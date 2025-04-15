import { useAuth } from "../lib/auth-context";
import { Button } from "./ui/button";

export function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={logout}>Sign out</Button>
      </div>
      
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user.name || 'User'}!</h2>
        <p className="text-muted-foreground">
          You're now signed in with {user.email}.
        </p>
      </div>
    </div>
  );
} 