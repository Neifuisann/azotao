import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { Outlet } from "react-router-dom";
import { DashboardThemeProvider } from "@/components/providers/dashboard-theme-provider";

export default function DashboardLayout() {
  return (
    <DashboardThemeProvider>
      <AdminPanelLayout>
        <Outlet />
      </AdminPanelLayout>
    </DashboardThemeProvider>
  );
} 