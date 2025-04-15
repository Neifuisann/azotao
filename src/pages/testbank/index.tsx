import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus, Search, Clock, CalendarDays } from "lucide-react";
import { useState } from "react";

// Mock data for tests
const recentTests = [
  { id: 1, name: "Final Exam - Mathematics", createdAt: "2023-10-23" },
  { id: 2, name: "Biology Quiz - Chapter 5", createdAt: "2023-10-20" },
  { id: 3, name: "English Literature Test", createdAt: "2023-10-18" }
];

const allTests = [
  { 
    id: 1, 
    name: "Final Exam - Mathematics", 
    submitTimes: 125, 
    status: "published", 
    lastChanged: "2023-10-23" 
  },
  { 
    id: 2, 
    name: "Biology Quiz - Chapter 5", 
    submitTimes: 87, 
    status: "published", 
    lastChanged: "2023-10-20" 
  },
  { 
    id: 3, 
    name: "English Literature Test", 
    submitTimes: 56, 
    status: "draft", 
    lastChanged: "2023-10-18" 
  },
  { 
    id: 4, 
    name: "Chemistry Exam - Unit 2", 
    submitTimes: 92, 
    status: "published", 
    lastChanged: "2023-10-15" 
  },
  { 
    id: 5, 
    name: "Physics Mid-term Exam", 
    submitTimes: 112, 
    status: "published", 
    lastChanged: "2023-10-12" 
  },
  { 
    id: 6, 
    name: "History Pop Quiz", 
    submitTimes: 34, 
    status: "draft", 
    lastChanged: "2023-10-10" 
  },
  { 
    id: 7, 
    name: "Geography Final Test", 
    submitTimes: 78, 
    status: "archived", 
    lastChanged: "2023-10-05" 
  },
  { 
    id: 8, 
    name: "Computer Science Project Test", 
    submitTimes: 45, 
    status: "published", 
    lastChanged: "2023-10-01" 
  }
];

export default function TestBankPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter tests based on search query
  const filteredTests = allTests.filter(test => 
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getStatusBadge(status: string) {
    switch (status) {
      case "published":
        return <Badge className="bg-green-600">Published</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "archived":
        return <Badge variant="secondary">Archived</Badge>;
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
          />
        </div>
        <Button className="gap-2">
          <FilePlus className="h-4 w-4" />
          Create Test
        </Button>
      </div>

      {/* Recent Tests Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Tests
          </CardTitle>
          <CardDescription>
            Your recently created or modified tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {recentTests.map(test => (
              <Card key={test.id} className="border border-muted">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{test.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarDays className="mr-1 h-3 w-3" />
                    Created: {test.createdAt}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tests</CardTitle>
          <CardDescription>
            {filteredTests.length} {filteredTests.length === 1 ? 'test' : 'tests'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Name</TableHead>
                <TableHead className="text-center">Submit Times</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Last Changed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No tests found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredTests.map(test => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell className="text-center">{test.submitTimes}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(test.status)}</TableCell>
                    <TableCell className="text-right">{test.lastChanged}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ContentLayout>
  );
} 