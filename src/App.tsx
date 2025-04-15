import { ThemeProvider } from "./components/providers/theme-provider"
import { HeroSectionDemo } from "@/components/blocks/hero-section-demo"
import { LoginDialog } from "./components/ui/login-dialog"
import { SignUpDialog } from "./components/ui/signup-dialog"
import { AuthProvider, useAuth } from "./lib/auth-context"
import { Button } from "./components/ui/button"
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom"
import DashboardLayout from "./pages/dashboard/layout"
import DashboardPage from "./pages/dashboard/index"
import TestBankPage from "./pages/testbank/index"
import DocumentMarketPage from "./pages/document-market/index"
import QuestionBankPage from "./pages/question-bank/index"
import { ThemeClassManager } from "./components/theme-class-manager"

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function HomePage() {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="fixed top-4 right-4 flex gap-2">
        {user ? (
          <>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <LoginDialog />
            <SignUpDialog />
          </>
        )}
      </div>
      <HeroSectionDemo />
    </div>
  );
}

function AppContent() {
  const { loading, apiAvailable } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Display a server unavailable message if API is not available
  if (!apiAvailable) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="p-6 max-w-md mx-auto bg-card rounded-lg shadow-lg">
          <div className="text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mx-auto mb-4 text-yellow-500"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h2 className="text-2xl font-bold mb-2">Server Unavailable</h2>
            <p className="text-muted-foreground mb-4">
              The authentication server is currently unavailable. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ThemeClassManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/testbank" element={<TestBankPage />} />
          <Route path="/document-market" element={<DocumentMarketPage />} />
          <Route path="/question-bank" element={<QuestionBankPage />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App
