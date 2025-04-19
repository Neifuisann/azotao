import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LinkIcon, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Sample data for dropdown options
const gradeOptions = [
  "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade",
  "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade",
  "11th Grade", "12th Grade", "College", "Other"
];

const subjectOptions = [
  "Mathematics", "Science", "English", "History", "Geography",
  "Physics", "Chemistry", "Biology", "Computer Science", "Other"
];

const purposeOptions = [
  "Final Exam", "Mid-term Exam", "Quiz", "Pop Quiz", "Homework",
  "Practice Test", "Pre-assessment", "Post-assessment", "Self-assessment"
];

export default function TestConfigurationPage() {
  // [ADDED] Simple log to confirm component rendering
  console.log("--- TestConfigurationPage Component Rendering ---");

  const navigate = useNavigate();
  const location = useLocation();
  const [testId, setTestId] = useState<string | null>(null);

  const [testName, setTestName] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('testId');

    if (id) {
      setTestId(id);
      const fetchTestData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/tests/${id}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Test not found. Cannot configure.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            setTestName(data.title || '');
            setGrade(data.grade || '');
            setSubject(data.subject || '');
            setPurpose(data.purpose || '');
            setDescription(data.description || '');
          } else {
            throw new Error(result.error || 'Failed to load test data structure.');
          }
        } catch (err: any) {
          console.error("Error fetching test data:", err);
          setError(err.message || 'An unexpected error occurred while loading the test.');
          setTestName('');
          setGrade('');
          setSubject('');
          setPurpose('');
          setDescription('');
        } finally {
          setIsLoading(false);
        }
      };
      fetchTestData();
    } else {
      setError("No Test ID provided in the URL. Cannot configure test.");
      console.error("No testId found in URL");
      setIsLoading(false);
    }

    // [ADDED] Log the extracted ID
    console.log('Extracted testId from URL:', id); 

  }, [location.search]);

  const isFormValid = !!testName;

  const handlePublish = async () => {
    if (!isFormValid || !testId || isLoading) return;
    
    setIsPublishing(true);
    setError(null);

    // Prepare the data to send
    const updatedTestData = {
      title: testName,
      grade: grade || null,
      subject: subject || null,
      purpose: purpose || null,
      description: description || null,
    };

    try {
      const response = await fetch(`/api/tests/${testId}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTestData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("Test published successfully:", result.data);
        const viewLink = `${window.location.origin}/testbank/view/${testId}`;
        // Navigate to the success page with the published link and test name
        navigate(`/testbank/success?link=${encodeURIComponent(viewLink)}&name=${encodeURIComponent(testName)}`);
      } else {
        console.error("Error publishing test:", result.error);
        setError(result.error || 'Failed to publish test');
      }
    } catch (err) {
      console.error("Network error publishing test:", err);
      setError('Network error. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!testId) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log("Test deleted successfully");
        navigate("/testbank");
      } else {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `Failed to delete test (status: ${response.status})`);
      }
    } catch (err: any) {
      console.error("Error deleting test:", err);
      setError(err.message || 'Could not delete test. Please try again.');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // [ADDED] Log the current testId state before rendering
  console.log('Current testId state:', testId); 

  return (
    <div className="h-screen w-full bg-white flex flex-col">
      {/* Fixed Header */}
      <header className="border-b shadow-sm px-6 py-3 bg-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-gray-700 text-white hover:bg-gray-800 hover:text-white"
            onClick={() => navigate(testId ? `/testbank/create?testId=${testId}` : '/testbank/create')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-medium text-gray-900">Test Configuration</h1>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-2 text-gray-600">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Loading configuration...</span>
            </div>
          ) : error ? (
            <div className="p-3 mb-6 border border-red-200 bg-red-50 rounded-md text-red-700 text-sm">
              Error loading configuration: {error}
            </div>
          ) : (
            <div className={`space-y-6 ${isPublishing ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="space-y-2">
                <Label htmlFor="test-name" className="text-gray-900">Test Name</Label>
                <Input
                  id="test-name"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Enter test name..."
                  className="w-full text-gray-900"
                  disabled={isPublishing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grade" className="text-gray-900">Grade Level</Label>
                <Select value={grade} onValueChange={setGrade} disabled={isPublishing}>
                  <SelectTrigger id="grade" className="text-gray-900">
                    <SelectValue placeholder="Select grade level" className="text-gray-500" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((option) => (
                      <SelectItem key={option} value={option} className="text-gray-900">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-gray-900">Subject</Label>
                <Select value={subject} onValueChange={setSubject} disabled={isPublishing}>
                  <SelectTrigger id="subject" className="text-gray-900">
                    <SelectValue placeholder="Select subject" className="text-gray-500" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((option) => (
                      <SelectItem key={option} value={option} className="text-gray-900">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purpose" className="text-gray-900">Purpose</Label>
                <Select value={purpose} onValueChange={setPurpose} disabled={isPublishing}>
                  <SelectTrigger id="purpose" className="text-gray-900">
                    <SelectValue placeholder="Select purpose" className="text-gray-500" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposeOptions.map((option) => (
                      <SelectItem key={option} value={option} className="text-gray-900">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-900">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter optional description..."
                  className="resize-none h-24 text-gray-900"
                  disabled={isPublishing}
                />
              </div>
              
              <div className="pt-4 flex justify-end items-center">
                <div className="flex space-x-4 items-center">
                  <Button
                    variant="outline"
                    className="text-gray-800 border-gray-300 bg-gray-100 hover:bg-gray-200"
                    onClick={() => navigate("/testbank")}
                    size="sm"
                    disabled={isPublishing || isDeleting}
                  >
                    Save Draft
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!isFormValid || isPublishing || isLoading || isDeleting}
                    onClick={handlePublish}
                  >
                    {isPublishing ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" /> 
                    )}
                    {isPublishing ? "Publishing..." : "Publish Test"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 