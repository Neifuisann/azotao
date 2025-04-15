import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentMarketPage() {
  return (
    <ContentLayout title="Document Market">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Document Market</CardTitle>
            <CardDescription>
              Browse and purchase educational documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Find high-quality resources from verified providers to enhance your teaching or learning materials.</p>
          </CardContent>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Study Guides</CardTitle>
              <CardDescription>Comprehensive review materials</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">126 documents available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Practice Exams</CardTitle>
              <CardDescription>Test your knowledge</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">84 documents available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Lecture Notes</CardTitle>
              <CardDescription>University-level materials</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">57 documents available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ContentLayout>
  );
} 