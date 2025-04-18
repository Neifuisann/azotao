import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, TrendingUp, Users, BarChart } from "lucide-react";

// Define structure for individual submission within statistics
interface SubmissionDetail {
  id: string;
  userId: string; // Consider fetching user names if needed
  score: number;
  answers: any; // Keep as any for now, or define detailed answer structure if needed for display
  createdAt: string;
}

// Define the structure for the statistics data from the API
interface TestStatsData {
  submissionCount: number;
  averageScore: number;
  submissions: SubmissionDetail[];
  // We also need the test title, let's fetch the test data too
  testTitle?: string; 
}

export default function TestStatisticsPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [stats, setStats] = useState<TestStatsData | null>(null);
  const [testTitle, setTestTitle] = useState<string>("Test"); // State for test title
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) {
      setError("Test ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchStatsAndTestInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch both stats and test details concurrently
        const [statsResponse, testResponse] = await Promise.all([
          fetch(`/api/tests/${testId}/statistics`),
          fetch(`/api/tests/${testId}`) // Fetch test details for title
        ]);

        // Handle Stats Response
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json();
          throw new Error(errorData.error || `HTTP error fetching stats: ${statsResponse.status}`);
        }
        const statsResult = await statsResponse.json();
        if (!statsResult.success) {
          throw new Error(statsResult.error || 'Failed to fetch test statistics.');
        }
        
        // Handle Test Info Response
        if (!testResponse.ok) {
           // Non-critical if test info fails, but log it
          console.error(`HTTP error fetching test details: ${testResponse.status}`);
          setTestTitle("Test"); // Use default title
        } else {
            const testResult = await testResponse.json();
            if (testResult.success) {
                setTestTitle(testResult.data.title || "Test");
            } else {
                 console.error('Failed to parse test details.');
                 setTestTitle("Test");
            }
        }

        setStats(statsResult.data);

      } catch (err: any) {
        console.error("Error fetching test statistics:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatsAndTestInfo();
  }, [testId]);

  const handleGoBack = () => {
    navigate('/testbank');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading statistics...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-red-50 border-red-200">
          <CardHeader><CardTitle className="text-red-700">Error Loading Statistics</CardTitle></CardHeader>
          <CardContent><p className="text-red-600">{error}</p></CardContent>
          <CardFooter>
            <Button variant="outline" onClick={handleGoBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tests</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return <div className="flex items-center justify-center min-h-screen">Statistics not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <BarChart className="mr-3 h-6 w-6 text-blue-600" />
            Statistics for: {testTitle}
          </CardTitle>
          <CardDescription>Overview of student submissions and performance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Total Submissions</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{stats.submissionCount}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {stats.submissionCount > 0 ? `${stats.averageScore}%` : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submissions Table */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Individual Submissions</h3>
            {stats.submissions && stats.submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Submitted At</TableHead>
                    {/* Add more columns if needed, e.g., View Details */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.userId}</TableCell> 
                      <TableCell className="text-right">{sub.score}%</TableCell>
                      <TableCell>{new Date(sub.createdAt).toLocaleString()}</TableCell>
                       {/* Example: Link to view details (requires a new route/component) */}
                      {/* <TableCell>
                        <Link to={`/testbank/submission/${sub.id}`} className="text-blue-600 hover:underline">Details</Link>
                      </TableCell> */} 
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 italic">No submissions have been recorded for this test yet.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-start">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Test Bank
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 