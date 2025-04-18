import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context"; // Import useAuth to get user ID
import { ArrowLeft, Send, CheckCircle, XCircle } from "lucide-react";

// Interfaces from previous steps (can be moved to a shared types file)
interface Choice {
  id: string;
  text: string;
  isCorrect?: boolean; // Backend might not send this initially
}

interface Question {
  id: string;
  text: string;
  choices: Choice[];
}

interface TestData {
  id: string;
  title: string;
  status: string;
  questions: Question[];
}

// Structure for user's answers state
type SelectedAnswers = {
  [questionId: string]: string; // { questionId: chosenChoiceId }
};

// Structure for submission results from the API
interface SubmissionResult {
  submissionId: string;
  correctCount: number;
  totalQuestions: number;
  score: number;
  detailedAnswers: {
    questionId: string;
    chosenChoiceId: string | null;
    isCorrect: boolean;
    correctChoiceId: string | null;
  }[];
}

export default function TakeTestPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user info from context

  const [test, setTest] = useState<TestData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Test Data
  useEffect(() => {
    if (!testId) {
      setError("Test ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchTest = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/tests/${testId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          // Ensure questions/choices are present and the test is published
          if (result.data.status !== 'published') {
            throw new Error("This test is not currently available.");
          }
          if (!result.data.questions || result.data.questions.length === 0) {
             throw new Error("This test has no questions.");
          }
          setTest(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch test data.');
        }
      } catch (err: any) {
        console.error("Error fetching test for taking:", err);
        setError(err.message || "An unexpected error occurred while loading the test.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  // Handle selecting an answer
  const handleChoiceSelect = (questionId: string, choiceId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: choiceId
    }));
  };

  // Handle submitting the test
  const handleSubmit = async () => {
    if (!test || !user) return; // Need test data and logged-in user

    const unansweredQuestions = test.questions.filter(q => !selectedAnswers[q.id]);
    if (unansweredQuestions.length > 0) {
      // Optional: Alert or prompt user about unanswered questions
      if (!window.confirm(`You have ${unansweredQuestions.length} unanswered questions. Submit anyway?`)) {
        return;
      }
    }
    
    setIsSubmitting(true);
    setError(null);

    // Format answers for the API
    const answersPayload = Object.entries(selectedAnswers).map(([qId, cId]) => ({
      questionId: qId,
      chosenChoiceId: cId
    }));

    try {
      const response = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, // Use the ID from auth context
          answers: answersPayload,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("Submission successful:", result.data);
        setSubmissionResult(result.data); // Store results to display feedback
      } else {
        console.error("Error submitting test:", result.error);
        setError(result.error || 'Failed to submit answers.');
      }
    } catch (err: any) {
      console.error("Network error submitting test:", err);
      setError(err.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading test...</div>;
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
         <Card className="w-full max-w-md bg-red-50 border-red-200">
            <CardHeader><CardTitle className="text-red-700">Error</CardTitle></CardHeader>
            <CardContent><p className="text-red-600">{error}</p></CardContent>
            <CardFooter>
                <Button variant="outline" onClick={() => navigate('/testbank')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tests</Button>
            </CardFooter>
         </Card>
        </div>
    );
  }

  if (!test) {
    return <div className="flex items-center justify-center min-h-screen">Test data could not be loaded.</div>;
  }

  // --- Display Results View --- 
  if (submissionResult) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Test Results: {test.title}</CardTitle>
            <div className="text-lg font-semibold mt-2">
              Score: {submissionResult.score}% ({submissionResult.correctCount} / {submissionResult.totalQuestions} Correct)
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {test.questions.map((q, index) => {
              const resultDetail = submissionResult.detailedAnswers.find(a => a.questionId === q.id);
              const userAnswerChoiceId = resultDetail?.chosenChoiceId;
              const correctChoiceId = resultDetail?.correctChoiceId;
              const isCorrect = resultDetail?.isCorrect;

              return (
                <div key={q.id} className={`p-4 rounded-md border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <p className="font-semibold mb-3">{index + 1}. {q.text}</p>
                  <div className="space-y-2">
                    {q.choices.map(choice => {
                      const isUserAnswer = choice.id === userAnswerChoiceId;
                      const isTheCorrectAnswer = choice.id === correctChoiceId;
                      
                      let indicator = null;
                      let textColor = "text-gray-800";
                      if (isUserAnswer && isCorrect) {
                        indicator = <CheckCircle className="w-4 h-4 text-green-600 ml-2" />;
                        textColor = "text-green-700 font-medium";
                      } else if (isUserAnswer && !isCorrect) {
                        indicator = <XCircle className="w-4 h-4 text-red-600 ml-2" />;
                        textColor = "text-red-700 font-medium line-through";
                      } else if (isTheCorrectAnswer) {
                         indicator = <CheckCircle className="w-4 h-4 text-green-600 ml-2" />;
                         textColor = "text-green-700 font-medium";
                      }

                      return (
                        <div key={choice.id} className={`flex items-center p-2 rounded ${isUserAnswer || isTheCorrectAnswer ? 'bg-white' : ''}`}>
                          <span className={textColor}>{choice.text}</span>
                          {indicator}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={() => navigate('/testbank')}>Back to Test Bank</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- Display Test Taking View ---
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Taking Test: {test.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {test.questions.map((q, index) => (
            <div key={q.id} className="p-4 rounded-md border border-gray-200 bg-white">
              <p className="font-semibold mb-3">{index + 1}. {q.text}</p>
              <RadioGroup
                value={selectedAnswers[q.id] || ""}
                onValueChange={(choiceId: string) => handleChoiceSelect(q.id, choiceId)}
              >
                {q.choices.map((choice) => (
                  <div key={choice.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <RadioGroupItem value={choice.id} id={`${q.id}-${choice.id}`} />
                    <Label htmlFor={`${q.id}-${choice.id}`} className="flex-1 cursor-pointer">
                      {choice.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
            ) : (
                <Send className="mr-2 h-4 w-4" /> 
            )}
            Submit Answers
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 