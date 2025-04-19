import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, PlayCircle } from "lucide-react";

// Define the structure of the test data we expect from the API
interface Choice {
  id: string;
  text: string;
  // isCorrect is likely not needed here, but included for completeness if API sends it
  isCorrect?: boolean; 
}

interface Question {
  id: string;
  text: string;
  choices: Choice[];
}

interface TestData {
  id: string;
  title: string;
  status: string; // 'draft', 'published', etc.
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

export default function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>(); // Get testId from URL
  const navigate = useNavigate();
  const [test, setTest] = useState<TestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setTest(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch test data.');
        }
      } catch (err: any) {
        console.error("Error fetching test:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [testId]); // Re-fetch if testId changes

  const handleTakeTest = () => {
    if (testId) {
      navigate(`/testbank/take/${testId}`);
    }
  };

  const handleGoBack = () => {
    // Navigate back to the test bank list or a relevant previous page
    navigate('/dashboard'); 
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold">Loading test details...</div>
        {/* Optional: Add a spinner */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
          <CardFooter>
             <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
             </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!test) {
     // Should ideally be covered by error state, but good fallback
    return <div className="flex items-center justify-center min-h-screen">Test not found.</div>;
  }
  
  // Check if the test is published before allowing the user to take it
  const canTakeTest = test.status === 'published';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{test.title}</CardTitle>
          <CardDescription>
            Status: <span className={`font-medium ${test.status === 'published' ? 'text-green-600' : 'text-yellow-600'}`}>
              {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Number of Questions:</strong> {test.questions?.length || 0}</p>
          {/* Add other relevant details if needed, e.g., Subject, Grade */}
          {/* <p><strong>Subject:</strong> {test.subject || 'Not specified'}</p> */}
          {/* <p><strong>Created:</strong> {new Date(test.createdAt).toLocaleDateString()}</p> */}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
          {canTakeTest ? (
             <Button onClick={handleTakeTest} className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlayCircle className="mr-2 h-4 w-4" /> Take Test
             </Button>
          ) : (
            <Button disabled variant="secondary">
              Test Not Available
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 