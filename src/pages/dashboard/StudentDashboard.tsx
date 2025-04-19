import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { Link } from "react-router-dom";
import { FileText, ShoppingBag, HelpCircle, Bookmark, Tag } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ContentLayout title="Dashboard">
    <> </>
    </ContentLayout>
  );
} 