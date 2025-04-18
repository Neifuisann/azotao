import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus, Search, Clock, CalendarDays, Eye, Edit, BarChart } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Define the structure for a test fetched from the API
interface TestListItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count: {
    questions: number;
  };
}

export default function TestBankPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  // State for fetched data, loading, and errors
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tests from the API
  useEffect(() => {
    const fetchTests = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/tests");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          setTests(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch tests");
        }
      } catch (err: any) {
        console.error("Error fetching tests:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTests();
  }, []); // Empty dependency array means run once on mount

  // Filter tests based on search query
  const filteredTests = tests.filter(test => 
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getStatusBadge(status: string) {
    switch (status) {
      case "published":
        return <Badge className="bg-green-600 hover:bg-green-700">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>; // Use secondary for draft
      case "archived":
        return <Badge variant="outline">Archived</Badge>; // Use outline for archived
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <ContentLayout title="Test Bank">
      {/* Header with search and create button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tests..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading} // Disable search while loading
          />
        </div>
        <Button 
          className="gap-2"
          onClick={() => navigate("/testbank/create")}
          disabled={isLoading} // Disable create while loading
        >
          <FilePlus className="h-4 w-4" />
          Create Test
        </Button>
      </div>

      {/* All Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tests</CardTitle>
          <CardDescription>
            {isLoading ? "Loading tests..." : 
             error ? "Error loading tests" : 
             `${filteredTests.length} ${filteredTests.length === 1 ? 'test' : 'tests'} found`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Error: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead> { /* Actions column */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No tests found{searchQuery ? " matching your criteria" : ""}. Create one!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTests.map(test => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{test.title}</TableCell>
                      <TableCell className="text-center">{test._count.questions}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(test.status)}</TableCell>
                      <TableCell className="text-center">{new Date(test.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {/* Action Buttons based on status */}                      
                        {test.status === 'published' && (
                          <>
                            <Button variant="ghost" size="icon" title="View" onClick={() => navigate(`/testbank/view/${test.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Statistics" onClick={() => navigate(`/testbank/stats/${test.id}`)}>
                              <BarChart className="h-4 w-4" />
                            </Button>
                            {/* Add Archive/Unpublish button later if needed */}
                          </>
                        )}
                        {test.status === 'draft' && (
                          <>
                             <Button variant="ghost" size="icon" title="Edit/Configure" onClick={() => navigate(`/testbank/configuration?testId=${test.id}`)}>
                               <Edit className="h-4 w-4" />
                             </Button>
                             {/* Add Delete button later if needed */}
                          </>
                        )}
                         {test.status === 'archived' && (
                          <>
                            {/* Add Unarchive/Delete button later if needed */}
                            <Button variant="ghost" size="icon" title="Archived" disabled>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </ContentLayout>
  );
} 