import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuestionBankPage() {
  return (
    <ContentLayout title="Question Bank">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Question Bank</CardTitle>
            <CardDescription>
              Manage your collection of questions for assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Create, edit, and organize questions for your tests and quizzes.</p>
          </CardContent>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Multiple Choice</CardTitle>
              <CardDescription>Standard question format</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">853 questions available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>True/False</CardTitle>
              <CardDescription>Binary response questions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">412 questions available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Essay Questions</CardTitle>
              <CardDescription>Long-form response format</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">267 questions available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ContentLayout>
  );
} 