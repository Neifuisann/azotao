import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LinkIcon, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
  const navigate = useNavigate();
  const location = useLocation();
  const [testId, setTestId] = useState<string | null>(null);

  const [testName, setTestName] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedLink, setPublishedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('testId');
    if (id) {
      setTestId(id);
    } else {
      console.error("No testId found in URL");
    }
  }, [location.search]);

  const isFormValid = !!testName;

  const handlePublish = async () => {
    if (!isFormValid || !testId) return;
    
    setIsPublishing(true);
    setError(null);
    setPublishedLink(null);

    try {
      const response = await fetch(`/api/tests/${testId}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("Test published successfully:", result.data);
        const viewLink = `${window.location.origin}/testbank/view/${testId}`;
        setPublishedLink(viewLink);
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

  return (
    <div className="h-screen w-full bg-white flex flex-col">
      {/* Fixed Header */}
      <header className="border-b shadow-sm px-6 py-3 bg-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-gray-700 text-white hover:bg-gray-800 hover:text-white"
            onClick={() => navigate("/testbank/create")}
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
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="test-name" className="text-gray-900">Test Name</Label>
              <Input
                id="test-name"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Enter test name..."
                className="w-full text-gray-900"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="grade" className="text-gray-900">Grade Level</Label>
              <Select value={grade} onValueChange={setGrade}>
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
              <Select value={subject} onValueChange={setSubject}>
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
              <Select value={purpose} onValueChange={setPurpose}>
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
              />
            </div>
            
            {/* --- Conditional Success/Error Message --- */}
            {publishedLink && (
              <div className="p-4 mt-4 border border-green-200 bg-green-50 rounded-md text-green-700 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Test published successfully!</p>
                  <p className="text-sm">Share this link with students:</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      readOnly 
                      value={publishedLink} 
                      className="flex-1 h-8 text-sm bg-white" 
                    />
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => navigator.clipboard.writeText(publishedLink)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="p-3 mt-4 border border-red-200 bg-red-50 rounded-md text-red-700 text-sm">
                Error: {error}
              </div>
            )}
            
            <div className="pt-4 flex justify-end space-x-4 items-center">
              <Button
                variant="outline"
                className="text-gray-800 border-gray-300 bg-gray-100 hover:bg-gray-200"
                onClick={() => navigate("/testbank")}
                size="sm"
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                disabled={!isFormValid || isPublishing || !!publishedLink}
                onClick={handlePublish}
                size="lg"
              >
                {isPublishing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                ) : null}
                {publishedLink ? "Published" : "Publish Test"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 