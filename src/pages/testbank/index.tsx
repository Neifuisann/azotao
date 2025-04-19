import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus, Search, Eye, Edit, BarChart, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
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
} from "@/components/ui/alert-dialog"

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
  const { user } = useAuth();
  
  // State for fetched data, loading, and errors
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  // Fetch tests from the API
  const fetchTests = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tests?userId=${user.id}`);
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Bad request: User ID might be missing or invalid.");
        }
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
  }, [user]);

  // Initial fetch on mount or when user changes
  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Filter tests based on search query
  const filteredTests = tests.filter(test => 
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // [ADDED] Calculate states for the header checkbox
  const allVisibleSelected = filteredTests.length > 0 && selectedTestIds.size === filteredTests.length;
  const someVisibleSelected = selectedTestIds.size > 0 && selectedTestIds.size < filteredTests.length;
  const headerCheckboxState = allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false;

  // [ADDED] Handler for the header checkbox change
  const handleSelectAllChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      // Select all filtered tests
      setSelectedTestIds(new Set(filteredTests.map(test => test.id)));
    } else {
      // Deselect all (including those not currently filtered, for simplicity)
      // Or, more precisely, deselect only the filtered ones:
      setSelectedTestIds(prev => {
         const next = new Set(prev);
         filteredTests.forEach(test => next.delete(test.id));
         return next;
      });
      // Or even simpler: setSelectedTestIds(new Set()); // Deselect absolutely all
    }
  };

  // [ADDED] Handler for confirmed bulk deletion
  const handleBulkDelete = async () => {
    if (selectedTestIds.size === 0) return;

    setIsBulkDeleting(true);
    setBulkDeleteError(null);

    try {
      const response = await fetch('/api/tests/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testIds: Array.from(selectedTestIds) }), // Send IDs as an array
      });

      if (response.ok) {
        console.log("Bulk delete successful");
        setSelectedTestIds(new Set()); // Clear selection
        setShowBulkDeleteConfirm(false); // Close dialog
        await fetchTests(); // Refresh the test list
      } else {
        const result = await response.json().catch(() => ({})); // Try to parse JSON error
        throw new Error(result.error || `Failed to bulk delete tests (status: ${response.status})`);
      }
    } catch (err: any) {
      console.error("Error during bulk delete:", err);
      setBulkDeleteError(err.message || 'Could not delete tests. Please try again.');
      // Keep dialog open on error to show message
    } finally {
      setIsBulkDeleting(false);
    }
  };

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
    <>
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
            disabled={isLoading || !user}
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedTestIds.size > 0 && (
            <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                  disabled={isBulkDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedTestIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to permanently delete the selected {selectedTestIds.size} test(s)?
                    This action cannot be undone.
                    {/* Show error message inside dialog if delete fails */}
                    {bulkDeleteError && (
                      <div className="mt-2 text-red-600">{bulkDeleteError}</div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isBulkDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {isBulkDeleting ? 'Deleting...' : 'Yes, delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button 
            className="gap-2"
            onClick={() => navigate("/testbank/create")}
            disabled={isLoading || !user}
          >
            <FilePlus className="h-4 w-4" />
            Create Test
          </Button>
        </div>
      </div>

      {/* All Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tests</CardTitle>
          <CardDescription>
            {isLoading ? "Loading tests..." : 
             !user ? "Please log in to view tests." :
             error ? "Error loading tests" : 
             `${filteredTests.length} ${filteredTests.length === 1 ? 'test' : 'tests'} found`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !user ? (
             <div className="text-center py-8 text-muted-foreground">Please log in.</div>
          ): error ? (
            <div className="text-center py-8 text-red-600">Error: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"><Checkbox 
                    checked={headerCheckboxState}
                    onCheckedChange={handleSelectAllChange}
                    aria-label="Select all rows"
                  /></TableHead>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell>
                        <Checkbox 
                          checked={selectedTestIds.has(test.id)}
                          onCheckedChange={(checked) => {
                            setSelectedTestIds(prev => {
                              const next = new Set(prev);
                              if (checked) {
                                next.add(test.id);
                              } else {
                                next.delete(test.id);
                              }
                              return next;
                            });
                          }}
                        />
                      </TableCell>
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
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Test"
                              onClick={() => navigate(`/testbank/create?testId=${test.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {test.status === 'draft' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Test"
                              onClick={() => navigate(`/testbank/create?testId=${test.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {test.status === 'archived' && (
                          <>
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
  </>
);
}