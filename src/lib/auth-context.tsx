import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, AuthUser } from './api';

// Auth token expiration time (24 hours in seconds)
const TOKEN_EXPIRATION_TIME = 24 * 60 * 60;

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
        const storedUser = localStorage.getItem('currentUser');
        const expirationTime = localStorage.getItem('tokenExpiration');
        
        if (storedUser && expirationTime) {
          const expiration = parseInt(expirationTime, 10);
          
          if (!isTokenExpired(expiration)) {
            const parsedUser = JSON.parse(storedUser);
            // Ensure role exists, default to student if missing from old storage
            if (!parsedUser.role) {
                parsedUser.role = 'student'; 
            }
            setUser(parsedUser);
          } else {
            // Token expired, clear storage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('tokenExpiration');
          }
        }
      } catch (error) {
        console.error('Error initializing auth context:', error);
        setApiAvailable(false);
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
      setUser(result.data);
      localStorage.setItem('currentUser', JSON.stringify(result.data));
      
      // Set token expiration (24 hours from now)
      const expirationTime = Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_TIME;
      localStorage.setItem('tokenExpiration', expirationTime.toString());

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
    localStorage.removeItem('appRole'); // Also remove role preference on logout
  };

  // Function to update user role in state and localStorage
  const updateUserRole = (newRole: 'student' | 'teacher') => {
    if (!user) return;
    
    // Update state
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    
    // Update localStorage (currentUser includes role)
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Also store preferred role separately if needed for faster access on load
    // localStorage.setItem('appRole', newRole);
    
    console.log(`User role updated to: ${newRole}`);
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