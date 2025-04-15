import { ThemeProvider } from "next-themes"
import { HeroSectionDemo } from "@/components/blocks/hero-section-demo"
import { LoginDialog } from "./components/ui/login-dialog"
import { SignUpDialog } from "./components/ui/signup-dialog"
import { AuthProvider, useAuth } from "./lib/auth-context"
import { Button } from "./components/ui/button"
import { Dashboard } from "./components/dashboard"
import { useEffect, useState } from "react"

function AppContent() {
  const { user, loading, apiAvailable, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

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

  // Render dashboard if the path is /dashboard and user is authenticated
  if (currentPath === "/dashboard") {
    if (user) {
      return <Dashboard />;
    } else {
      // Redirect to home if not authenticated
      window.location.href = "/";
      return <div>Redirecting...</div>;
    }
  }

  // Render home page for any other path
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="fixed top-4 right-4 flex gap-2">
        {user ? (
          <>
            <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
              Dashboard
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

function App() {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class" enableSystem={false}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App
