import StudentDashboard from './StudentDashboard';
// import TeacherDashboard from './TeacherDashboard'; // No longer needed
import DashboardPage from './index'; // Import the existing dashboard page
import { useAuth } from '@/lib/auth-context';
import { ContentLayout } from "@/components/admin-panel/content-layout"; // Optional: Wrap in consistent layout

export default function DashboardSwitch() {
  const { user, loading } = useAuth();

  // Show loading state if auth is still initializing
  if (loading) {
    return (
      <ContentLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <p>Loading dashboard...</p> 
        </div>
      </ContentLayout>
    );
  }

  // Handle case where user might somehow be null despite ProtectedRoute (belt and suspenders)
  if (!user) {
    return (
       <ContentLayout title="Dashboard">
         <div className="flex items-center justify-center h-64 text-red-600">
          <p>Error: User not found.</p>
         </div>
       </ContentLayout>
    );
  }

  // Render Teacher (existing DashboardPage) or Student dashboard based on role
  return user.role === "teacher"
    ? <DashboardPage /> 
    : <StudentDashboard />;
} 