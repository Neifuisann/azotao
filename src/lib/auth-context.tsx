import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, AuthUser } from './api';

// Auth token expiration time (24 hours in seconds)
const TOKEN_EXPIRATION_TIME = 24 * 60 * 60;
// Key for storing preferred role
const PREFERRED_ROLE_KEY = 'preferredRole';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  apiAvailable: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserRole: (newRole: 'student' | 'teacher') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Check if token is expired
  const isTokenExpired = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    return now > timestamp;
  };

  useEffect(() => {
    async function initialize() {
      let initialUser: AuthUser | null = null;
      let preferredRole: string | null = null;
      
      try {
        // Check API health
        const isApiHealthy = await api.healthCheck();
        setApiAvailable(isApiHealthy);
        
        if (!isApiHealthy) {
          console.error('API health check failed - server may be unavailable');
          setLoading(false);
          return;
        }

        // Check for stored session
        const storedUserJson = localStorage.getItem('currentUser');
        const expirationTime = localStorage.getItem('tokenExpiration');
        
        if (storedUserJson && expirationTime) {
          const expiration = parseInt(expirationTime, 10);
          
          if (!isTokenExpired(expiration)) {
            const parsedUser = JSON.parse(storedUserJson);
            // Ensure role exists, default to student if missing
            if (!parsedUser.role) {
                parsedUser.role = 'student'; 
            }
            initialUser = parsedUser;
          } else {
            // Token expired, clear session storage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('tokenExpiration');
          }
        }

        // Check for stored preferred role *after* checking session
        preferredRole = localStorage.getItem(PREFERRED_ROLE_KEY);

        // Apply preferred role if it exists and differs from initial role
        if (initialUser && preferredRole && (preferredRole === 'student' || preferredRole === 'teacher') && initialUser.role !== preferredRole) {
           console.log(`Applying preferred role from localStorage: ${preferredRole}`);
           initialUser = { ...initialUser, role: preferredRole };
           // Update currentUser in localStorage as well to reflect preference immediately
           localStorage.setItem('currentUser', JSON.stringify(initialUser));
        }

        // Set the final initial user state
        setUser(initialUser);

      } catch (error) {
        console.error('Error initializing auth context:', error);
        setApiAvailable(false);
        // Clear potentially corrupted storage on error
        localStorage.removeItem('currentUser');
        localStorage.removeItem('tokenExpiration');
        localStorage.removeItem(PREFERRED_ROLE_KEY);
      } finally {
        setLoading(false);
      }
    }
    
    initialize();
  }, []);

  const login = async (email: string, password: string) => {
    if (!apiAvailable) {
      return { success: false, error: 'API server is not available' };
    }
    
    try {
      const result = await api.login(email, password);

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Invalid credentials' };
      }

      // Set the user in state and localStorage with expiration
      const loggedInUser = result.data;
      setUser(loggedInUser);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      
      // Set token expiration (24 hours from now)
      const expirationTime = Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_TIME;
      localStorage.setItem('tokenExpiration', expirationTime.toString());

      // **Important**: Clear preferred role on login? 
      // Or let the user manually switch after logging in? 
      // For now, let's clear it so the role from the server is the default on fresh login.
      localStorage.removeItem(PREFERRED_ROLE_KEY);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    if (!apiAvailable) {
      return { success: false, error: 'API server is not available' };
    }
    
    try {
      const result = await api.signup(name, email, password);
      return result;
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An error occurred during signup' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tokenExpiration');
    // **Important**: Also remove preferred role on logout
    localStorage.removeItem(PREFERRED_ROLE_KEY);
    // Old role preference key (if used previously, remove for consistency)
    localStorage.removeItem('appRole'); 
  };

  // Function to update user role in state and localStorage
  const updateUserRole = (newRole: 'student' | 'teacher') => {
    if (!user) return;
    
    // Update state
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    
    // Update localStorage (currentUser includes role)
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // **Save the preferred role to localStorage**
    localStorage.setItem(PREFERRED_ROLE_KEY, newRole);
    
    console.log(`User role updated to: ${newRole} and saved preference.`);
  };

  return (
    <AuthContext.Provider value={{ user, loading, apiAvailable, login, signup, logout, updateUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 