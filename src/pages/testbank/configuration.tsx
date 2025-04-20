import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, ChevronDown, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestDataResponse {
  success: boolean;
  data?: TestData;
  error?: string;
}

interface TestData {
  id: string;
  title: string;
  grade: string | null;
  subject: string | null;
  purpose: string | null;
  description: string | null;

  // NEW fields
  configType?: "test" | "practice";
  testDuration?: number | null;
  accessTimeFrom?: string | null;
  accessTimeTo?: string | null;
  allowedTakers?: string;         // "everyone" | "byClass" | "byStudent"...
  allowedStudents?: string;       // if byStudent, store emails
  submittedTimes?: number | null;
  examPassword?: string | null;
  questionAnswerMixed?: boolean;
  shuffleQuestionAnswers?: boolean;
  showPoint?: boolean;
  showCorrectAnswerOption?: "off" | "on" | "reach";
  pointToShowAnswer?: number | null;
  addHeaderInfo?: boolean;
  headerInfo?: string;
}

// Example select options
const gradeOptions = [
  "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade",
  "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade",
  "11th Grade", "12th Grade", "College", "Other",
];

const subjectOptions = [
  "Mathematics", "Science", "English", "History", "Geography",
  "Physics", "Chemistry", "Biology", "Computer Science", "Other",
];

const purposeOptions = [
  "Final Exam", "Mid-term Exam", "Quiz", "Pop Quiz", "Homework",
  "Practice Test", "Pre-assessment", "Post-assessment", "Self-assessment",
];

const allowedTakersOptions = [
  { label: "Everyone", value: "everyone" },
  { label: "By Class (placeholder)", value: "byClass" },
  { label: "By Student", value: "byStudent" },
];

export default function TestConfigurationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [testId, setTestId] = useState<string | null>(null);

  // Basic fields
  const [testName, setTestName] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");

  // New config fields
  const [configType, setConfigType] = useState<"test" | "practice">("test");
  const [testDuration, setTestDuration] = useState("");
  const [accessTimeFrom, setAccessTimeFrom] = useState("");
  const [accessTimeTo, setAccessTimeTo] = useState("");
  const [allowedTakers, setAllowedTakers] = useState("everyone");
  const [allowedStudents, setAllowedStudents] = useState("");
  const [submittedTimes, setSubmittedTimes] = useState("");
  const [examPassword, setExamPassword] = useState("");
  const [questionAnswerMixed, setQuestionAnswerMixed] = useState(false);
  const [shuffleQuestionAnswers, setShuffleQuestionAnswers] = useState(false);
  const [showPoint, setShowPoint] = useState(false);
  const [showCorrectAnswerOption, setShowCorrectAnswerOption] = useState<"off" | "on" | "reach">("off");
  const [pointToShowAnswer, setPointToShowAnswer] = useState("");
  const [addHeaderInfo, setAddHeaderInfo] = useState(false);
  const [headerInfo, setHeaderInfo] = useState("");

  // Toggle switches for sections
  const [useGrade, setUseGrade] = useState(false);
  const [useSubject, setUseSubject] = useState(false);
  const [usePurpose, setUsePurpose] = useState(false);
  const [useDescription, setUseDescription] = useState(false);
  const [useDuration, setUseDuration] = useState(false);
  const [useAccessTime, setUseAccessTime] = useState(false);
  const [useAttempts, setUseAttempts] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [useAllowedTakers, setUseAllowedTakers] = useState(false);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirm delete states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Grab testId from URL ?testId=123
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tid = params.get("testId");
    setTestId(tid);
    if (!tid) {
      setError("No Test ID provided. Cannot configure a test.");
      setIsLoading(false);
    }
  }, [location.search]);

  // Fetch existing test data
  useEffect(() => {
    if (!testId) return;
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/tests/${testId}`);
        const json: TestDataResponse = await res.json();
        if (!res.ok) {
          throw new Error(json.error || `HTTP error: ${res.status}`);
        }
        if (!json.success || !json.data) {
          throw new Error(json.error || "Failed to load test data.");
        }
        // Populate state
        const data = json.data;
        setTestName(data.title || "");
        
        // Set basic fields and their toggles
        if (data.grade) {
          setGrade(data.grade);
          setUseGrade(true);
        }
        
        if (data.subject) {
          setSubject(data.subject);
          setUseSubject(true);
        }
        
        if (data.purpose) {
          setPurpose(data.purpose);
          setUsePurpose(true);
        }
        
        if (data.description) {
          setDescription(data.description);
          setUseDescription(true);
        }

        // Config fields and their toggles
        setConfigType(data.configType || "test");
        
        if (data.testDuration) {
          setTestDuration(data.testDuration.toString());
          setUseDuration(true);
        }
        
        if (data.accessTimeFrom || data.accessTimeTo) {
          setAccessTimeFrom(data.accessTimeFrom || "");
          setAccessTimeTo(data.accessTimeTo || "");
          setUseAccessTime(true);
        }
        
        if (data.allowedTakers && data.allowedTakers !== "everyone") {
          setAllowedTakers(data.allowedTakers);
          setAllowedStudents(data.allowedStudents || "");
          setUseAllowedTakers(true);
        } else {
          setAllowedTakers("everyone");
        }
        
        if (data.submittedTimes) {
          setSubmittedTimes(data.submittedTimes.toString());
          setUseAttempts(true);
        }
        
        if (data.examPassword) {
          setExamPassword(data.examPassword);
          setUsePassword(true);
        }
        
        setQuestionAnswerMixed(!!data.questionAnswerMixed);
        setShuffleQuestionAnswers(!!data.shuffleQuestionAnswers);
        setShowPoint(!!data.showPoint);
        setShowCorrectAnswerOption(data.showCorrectAnswerOption || "off");
        setPointToShowAnswer(data.pointToShowAnswer?.toString() || "");
        setAddHeaderInfo(!!data.addHeaderInfo);
        setHeaderInfo(data.headerInfo || "");
      } catch (err: any) {
        console.error("Error loading test config:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [testId]);

  const handleDelete = useCallback(async () => {
    if (!testId) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tests/${testId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Failed to delete test. Status ${res.status}`);
      }
      // success
      navigate("/testbank");
    } catch (err: any) {
      console.error("Error deleting test:", err);
      setError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [testId, navigate]);

  const isFormValid = !!testName;

  const handlePublish = useCallback(async () => {
    if (!testId || !isFormValid) return;
    setIsPublishing(true);
    setError(null);

    // parse numeric fields
    const parsedTestDuration = useDuration && testDuration ? parseInt(testDuration, 10) : null;
    const parsedSubmittedTimes = useAttempts && submittedTimes ? parseInt(submittedTimes, 10) : null;
    const parsedPointToShow = pointToShowAnswer ? parseInt(pointToShowAnswer, 10) : null;

    const payload: Partial<TestData> = {
      title: testName || "Untitled",
      grade: useGrade ? grade : null,
      subject: useSubject ? subject : null,
      purpose: usePurpose ? purpose : null,
      description: useDescription ? description : null,
      configType,
      testDuration: parsedTestDuration,
      accessTimeFrom: useAccessTime ? accessTimeFrom : null,
      accessTimeTo: useAccessTime ? accessTimeTo : null,
      allowedTakers: useAllowedTakers ? allowedTakers : "everyone",
      allowedStudents: useAllowedTakers && allowedTakers === "byStudent" ? allowedStudents : "",
      submittedTimes: parsedSubmittedTimes,
      examPassword: usePassword ? examPassword : null,
      questionAnswerMixed,
      shuffleQuestionAnswers,
      showPoint,
      showCorrectAnswerOption,
      pointToShowAnswer: parsedPointToShow,
      addHeaderInfo,
      headerInfo,
    };

    try {
      // For final publish, you might do /api/tests/:id/publish or something:
      const res = await fetch(`/api/tests/${testId}/publish`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to publish test");
      }
      // success - navigate to success page (or wherever)
      const link = `${window.location.origin}/testbank/view/${testId}`;
      navigate(`/testbank/success?link=${encodeURIComponent(link)}&name=${encodeURIComponent(testName)}`);
    } catch (err: any) {
      console.error("Publish error:", err);
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  }, [
    testId,
    isFormValid,
    testName,
    useGrade,
    grade,
    useSubject,
    subject,
    usePurpose,
    purpose,
    useDescription,
    description,
    configType,
    useDuration,
    testDuration,
    useAccessTime,
    accessTimeFrom,
    accessTimeTo,
    useAllowedTakers,
    allowedTakers,
    allowedStudents,
    useAttempts,
    submittedTimes,
    usePassword,
    examPassword,
    questionAnswerMixed,
    shuffleQuestionAnswers,
    showPoint,
    showCorrectAnswerOption,
    pointToShowAnswer,
    addHeaderInfo,
    headerInfo,
    navigate,
  ]);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <header className="border-b shadow-sm px-6 py-3 bg-white dark:bg-zinc-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 bg-black text-white hover:bg-gray-800 hover:text-white"
            onClick={() => navigate(testId ? `/testbank/create?testId=${testId}` : "/testbank/create")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-medium text-white">Test Configuration</h1>
        </div>
        {testId && (
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1"
                disabled={isDeleting || isLoading}
              >
                <Trash2 className="h-4 w-4" />
                Delete Test
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Test</AlertDialogTitle>
                <AlertDialogDescription>
                  This action permanently removes the test from the system. Continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Yes, delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-gray-600 bg-white p-8 rounded-lg border shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Loading test configuration...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 p-3 mb-4 rounded text-red-700">
              {error}
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={["basic", "type", "security"]} className="space-y-4">
              {/* Basic Information Section */}
              <AccordionItem value="basic" className="border rounded-lg overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
                <AccordionTrigger className="px-6 py-4 hover:bg-blue-100/50 transition-all">
                  <div className="flex items-center">
                    <Badge className="mr-2 bg-blue-600">1</Badge>
                    <span className="text-lg font-medium">Basic Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2">
                  <Card className="bg-white border-blue-200">
                    <CardContent className="pt-6">
                      {/* Test name */}
                      <div className="mb-4">
                        <Label className="text-blue-800 font-medium">Test Name *</Label>
                        <Input
                          value={testName}
                          onChange={(e) => setTestName(e.target.value)}
                          placeholder="Required"
                          className="mt-1 border-blue-200 focus-visible:ring-blue-500"
                          disabled={isPublishing}
                        />
                      </div>
                      
                      {/* Grade Level */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-blue-800">Grade Level</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={useGrade}
                              onCheckedChange={setUseGrade}
                              disabled={isPublishing}
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <span className="text-xs text-blue-600">{useGrade ? "Enabled" : "Disabled"}</span>
                          </div>
                        </div>
                        {useGrade && (
                          <Select
                            value={grade}
                            onValueChange={setGrade}
                            disabled={isPublishing}
                          >
                            <SelectTrigger className="w-full mt-1 border-blue-200 focus:ring-blue-500">
                              <SelectValue placeholder="Select grade level" />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      {/* Subject */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-blue-800">Subject</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={useSubject}
                              onCheckedChange={setUseSubject}
                              disabled={isPublishing}
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <span className="text-xs text-blue-600">{useSubject ? "Enabled" : "Disabled"}</span>
                          </div>
                        </div>
                        {useSubject && (
                          <Select
                            value={subject}
                            onValueChange={setSubject}
                            disabled={isPublishing}
                          >
                            <SelectTrigger className="w-full mt-1 border-blue-200 focus:ring-blue-500">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjectOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      {/* Purpose */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-blue-800">Purpose</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={usePurpose}
                              onCheckedChange={setUsePurpose}
                              disabled={isPublishing}
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <span className="text-xs text-blue-600">{usePurpose ? "Enabled" : "Disabled"}</span>
                          </div>
                        </div>
                        {usePurpose && (
                          <Select
                            value={purpose}
                            onValueChange={setPurpose}
                            disabled={isPublishing}
                          >
                            <SelectTrigger className="w-full mt-1 border-blue-200 focus:ring-blue-500">
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              {purposeOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      {/* Description */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-blue-800">Description</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={useDescription}
                              onCheckedChange={setUseDescription}
                              disabled={isPublishing}
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <span className="text-xs text-blue-600">{useDescription ? "Enabled" : "Disabled"}</span>
                          </div>
                        </div>
                        {useDescription && (
                          <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter additional description..."
                            className="mt-1 border-blue-200 focus-visible:ring-blue-500"
                            disabled={isPublishing}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
              
              {/* Test Type Section */}
              <AccordionItem value="type" className="border rounded-lg overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50">
                <AccordionTrigger className="px-6 py-4 hover:bg-green-100/50 transition-all">
                  <div className="flex items-center">
                    <Badge className="mr-2 bg-green-600">2</Badge>
                    <span className="text-lg font-medium">Test Type & Duration</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2">
                  <Card className="bg-white border-green-200">
                    <CardContent className="pt-6">
                      {/* Configuration type */}
                      <div className="mb-6">
                        <Label className="mb-1 text-green-800 font-medium">Configuration Type</Label>
                        <div className="p-3 rounded-md bg-green-50 flex items-center gap-4">
                          <Switch
                            checked={configType === "practice"}
                            onCheckedChange={(checked) => setConfigType(checked ? "practice" : "test")}
                            disabled={isPublishing}
                            className="data-[state=checked]:bg-green-600"
                          />
                          <div>
                            <span className="text-sm font-medium text-green-800">
                              {configType === "practice" ? "Practice Mode" : "Test Mode"}
                            </span>
                            <p className="text-xs text-green-600 mt-1">
                              {configType === "practice"
                                ? "1 question at a time, immediate feedback (not fully implemented yet)"
                                : "Secure until exam is finished"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Test duration */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-green-800">Test Duration (minutes)</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={useDuration}
                              onCheckedChange={setUseDuration}
                              disabled={isPublishing}
                              className="data-[state=checked]:bg-green-600"
                            />
                            <span className="text-xs text-green-600">{useDuration ? "Enabled" : "No time limit"}</span>
                          </div>
                        </div>
                        {useDuration && (
                          <Input
                            type="number"
                            value={testDuration}
                            onChange={(e) => setTestDuration(e.target.value)}
                            placeholder="Enter time in minutes"
                            disabled={isPublishing}
                            className="mt-1 border-green-200 focus-visible:ring-green-500"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Access Settings Section */}
              <AccordionItem value="access" className="border rounded-lg overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50">
                <AccordionTrigger className="px-6 py-4 hover:bg-amber-100/50 transition-all">
                  <div className="flex items-center">
                    <Badge className="mr-2 bg-amber-600">3</Badge>
                    <span className="text-lg font-medium">Access Settings</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2">
                  <Card className="bg-white border-amber-200">
                    <CardContent className="pt-6">
                      {/* Access time range */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-amber-800 font-medium">Access Time Range</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={useAccessTime}
                              onCheckedChange={setUseAccessTime}
                              disabled={isPublishing}
                              className="data-[state=checked]:bg-amber-600"
                            />
                            <span className="text-xs text-amber-600">{useAccessTime ? "Enabled" : "Always accessible"}</span>
                          </div>
                        </div>
                        {useAccessTime && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label className="text-amber-700">Start Time</Label>
                              <Input
                                type="datetime-local"
                                value={accessTimeFrom}
                                onChange={(e) => setAccessTimeFrom(e.target.value)}
                                disabled={isPublishing}
                                className="mt-1 border-amber-200 focus-visible:ring-amber-500"
                              />
                            </div>
                            <div>
                              <Label className="text-amber-700">End Time</Label>
                              <Input
                                type="datetime-local"
                                value={accessTimeTo}
                                onChange={(e) => setAccessTimeTo(e.target.value)}
                                disabled={isPublishing}
                                className="mt-1 border-amber-200 focus-visible:ring-amber-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Allowed takers */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-amber-800 font-medium">Who can take the exam?</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={useAllowedTakers}
                              onCheckedChange={setUseAllowedTakers}
                              disabled={isPublishing}
                              className="data-[state=checked]:bg-amber-600"
                            />
                            <span className="text-xs text-amber-600">{useAllowedTakers ? "Restricted" : "Everyone"}</span>
                          </div>
                        </div>
                        {useAllowedTakers && (
                          <>
                            <Select
                              value={allowedTakers}
                              onValueChange={setAllowedTakers}
                              disabled={isPublishing}
                            >
                              <SelectTrigger className="mt-1 w-full border-amber-200 focus:ring-amber-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {allowedTakersOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {allowedTakers === "byStudent" && (
                              <div className="mt-2">
                                <Label className="text-amber-700">Student Emails</Label>
                                <Textarea
                                  value={allowedStudents}
                                  onChange={(e) => setAllowedStudents(e.target.value)}
                                  placeholder="Separate by commas or new lines"
                                  className="h-20 mt-1 border-amber-200 focus-visible:ring-amber-500"
                                  disabled={isPublishing}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Submitted attempts */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-amber-800">Max Submission Attempts</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={useAttempts}
                              onCheckedChange={setUseAttempts}
                              disabled={isPublishing}
                              className="data-[state=checked]:bg-amber-600"
                            />
                            <span className="text-xs text-amber-600">{useAttempts ? "Limited" : "Unlimited"}</span>
                          </div>
                        </div>
                        {useAttempts && (
                          <Input
                            type="number"
                            value={submittedTimes}
                            onChange={(e) => setSubmittedTimes(e.target.value)}
                            placeholder="Enter max number of attempts"
                            disabled={isPublishing}
                            className="mt-1 border-amber-200 focus-visible:ring-amber-500"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Security Settings */}
              <AccordionItem value="security" className="border rounded-lg overflow-hidden bg-gradient-to-r from-red-50 to-rose-50">
                <AccordionTrigger className="px-6 py-4 hover:bg-red-100/50 transition-all">
                  <div className="flex items-center">
                    <Badge className="mr-2 bg-red-600">4</Badge>
                    <span className="text-lg font-medium">Security Settings</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2">
                  <Card className="bg-white border-red-200">
                    <CardContent className="pt-6">
                      {/* Exam password */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-red-800 font-medium">Exam Password</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={usePassword}
                              onCheckedChange={setUsePassword}
                              disabled={isPublishing}
                              className="data-[state=checked]:bg-red-600"
                            />
                            <span className="text-xs text-red-600">{usePassword ? "Enabled" : "No password"}</span>
                          </div>
                        </div>
                        {usePassword && (
                          <Input
                            value={examPassword}
                            onChange={(e) => setExamPassword(e.target.value)}
                            disabled={isPublishing}
                            placeholder="Enter a password to access the exam"
                            className="mt-1 border-red-200 focus-visible:ring-red-500"
                            type="password"
                          />
                        )}
                      </div>

                      {/* Question & answer mixing */}
                      <div className="p-3 rounded-md bg-red-50 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            checked={questionAnswerMixed}
                            onCheckedChange={setQuestionAnswerMixed}
                            disabled={isPublishing}
                            className="data-[state=checked]:bg-red-600"
                          />
                          <Label className="text-red-800 font-medium">Question & Answer Mixed</Label>
                        </div>
                        <p className="text-xs text-red-600 ml-10">Present questions and answers in a mixed order</p>
                      </div>

                      <div className="p-3 rounded-md bg-red-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            checked={shuffleQuestionAnswers}
                            onCheckedChange={setShuffleQuestionAnswers}
                            disabled={isPublishing}
                            className="data-[state=checked]:bg-red-600"
                          />
                          <Label className="text-red-800 font-medium">Shuffle Questions & Answers</Label>
                        </div>
                        <p className="text-xs text-red-600 ml-10">Randomize the order of questions and answer choices</p>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Display Options */}
              <AccordionItem value="display" className="border rounded-lg overflow-hidden bg-gradient-to-r from-purple-50 to-violet-50">
                <AccordionTrigger className="px-6 py-4 hover:bg-purple-100/50 transition-all">
                  <div className="flex items-center">
                    <Badge className="mr-2 bg-purple-600">5</Badge>
                    <span className="text-lg font-medium">Display Options</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2">
                  <Card className="bg-white border-purple-200">
                    <CardContent className="pt-6">
                      {/* Show point */}
                      <div className="p-3 rounded-md bg-purple-50 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            checked={showPoint}
                            onCheckedChange={setShowPoint}
                            disabled={isPublishing}
                            className="data-[state=checked]:bg-purple-600"
                          />
                          <Label className="text-purple-800 font-medium">Show Points to Student</Label>
                        </div>
                        <p className="text-xs text-purple-600 ml-10">Display point values for each question to students</p>
                      </div>

                      {/* Show correct answer option */}
                      <div className="mb-6">
                        <Label className="text-purple-800 font-medium mb-2">Show Correct Answers</Label>
                        <Select
                          value={showCorrectAnswerOption}
                          onValueChange={(value) => setShowCorrectAnswerOption(value as "off" | "on" | "reach")}
                          disabled={isPublishing}
                        >
                          <SelectTrigger className="mt-1 w-full border-purple-200 focus:ring-purple-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="off">Never Show</SelectItem>
                            <SelectItem value="on">Always Show (after submission)</SelectItem>
                            <SelectItem value="reach">Only if student reaches certain score</SelectItem>
                          </SelectContent>
                        </Select>
                        {showCorrectAnswerOption === "reach" && (
                          <div className="mt-2">
                            <Label className="text-purple-700">Score threshold (%)</Label>
                            <Input
                              type="number"
                              value={pointToShowAnswer}
                              onChange={(e) => setPointToShowAnswer(e.target.value)}
                              placeholder="Ex: 70 => must have 70% or more"
                              disabled={isPublishing}
                              className="mt-1 border-purple-200 focus-visible:ring-purple-500"
                            />
                          </div>
                        )}
                      </div>

                      {/* Add Header Info */}
                      <div className="mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            checked={addHeaderInfo}
                            onCheckedChange={setAddHeaderInfo}
                            disabled={isPublishing}
                            className="data-[state=checked]:bg-purple-600"
                          />
                          <Label className="text-purple-800 font-medium">Add Header Information</Label>
                        </div>
                        {addHeaderInfo && (
                          <div className="mt-2">
                            <Label className="text-purple-700">Header Content</Label>
                            <Textarea
                              value={headerInfo}
                              onChange={(e) => setHeaderInfo(e.target.value)}
                              placeholder="Enter text for instructions or additional information..."
                              className="mt-1 h-24 border-purple-200 focus-visible:ring-purple-500"
                              disabled={isPublishing}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Publish Section */}
              <div className="mt-8 flex justify-end">
                <Button
                  className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handlePublish}
                  disabled={!isFormValid || isPublishing || isDeleting}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Publish Test
                    </>
                  )}
                </Button>
              </div>
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
