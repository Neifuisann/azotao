import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { Outlet, useLocation } from "react-router-dom";
import { DashboardThemeProvider } from "@/components/providers/dashboard-theme-provider";

export default function DashboardLayout() {
  const location = useLocation();
  
  // Only show sidebar for main pages
  const showSidebar = [
    "/testbank",
    "/document-market", 
    "/question-bank", 
    "/categories", 
    "/tags",
    "/dashboard",
  ].includes(location.pathname);
  
  return (
    <DashboardThemeProvider>
      <AdminPanelLayout showSidebar={showSidebar}>
        <Outlet />
      </AdminPanelLayout>
    </DashboardThemeProvider>
  );
} 