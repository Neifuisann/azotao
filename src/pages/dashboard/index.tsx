import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { Link } from "react-router-dom";
import { FileText, ShoppingBag, HelpCircle, Bookmark, Tag } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ContentLayout title="Dashboard">


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Link to="/testbank" className="block">
          <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="p-4 pb-2 flex flex-col items-center text-center">
              <FileText size={48} className="text-blue-600 mb-2" />
              <CardTitle className="text-lg">Test Bank</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-center">
              <p className="text-sm text-muted-foreground">Manage and create tests</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/document-market" className="block">
          <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="p-4 pb-2 flex flex-col items-center text-center">
              <ShoppingBag size={48} className="text-green-600 mb-2" />
              <CardTitle className="text-lg">Document Market</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-center">
              <p className="text-sm text-muted-foreground">Browse available documents</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/question-bank" className="block">
          <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="p-4 pb-2 flex flex-col items-center text-center">
              <HelpCircle size={48} className="text-purple-600 mb-2" />
              <CardTitle className="text-lg">Question Bank</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-center">
              <p className="text-sm text-muted-foreground">Manage question repository</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/categories" className="block">
          <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="p-4 pb-2 flex flex-col items-center text-center">
              <Bookmark size={48} className="text-yellow-600 mb-2" />
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-center">
              <p className="text-sm text-muted-foreground">Organize with categories</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/tags" className="block">
          <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="p-4 pb-2 flex flex-col items-center text-center">
              <Tag size={48} className="text-orange-600 mb-2" />
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-center">
              <p className="text-sm text-muted-foreground">Manage content tags</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </ContentLayout>
  );
} 