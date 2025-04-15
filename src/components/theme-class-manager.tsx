import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Routes that should use the dashboard theme (light mode)
 */
const DASHBOARD_ROUTES = [
  '/dashboard',
  '/testbank',
  '/document-market',
  '/question-bank'
];

/**
 * ThemeClassManager handles application theme switching based on routes
 * It adds appropriate CSS classes to the document based on the current route:
 * - Landing page: dark theme (default)
 * - Dashboard pages: light theme
 */
export function ThemeClassManager() {
  const location = useLocation();
  
  useEffect(() => {
    // Check if current path is a dashboard route
    const isDashboardPage = DASHBOARD_ROUTES.some(route => 
      location.pathname.startsWith(route)
    );
    
    // Apply the appropriate page class based on location
    if (isDashboardPage) {
      // For dashboard pages, force light theme
      document.body.classList.add('dashboard-page');
      document.body.classList.remove('landing-page');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('force-dark');
      document.documentElement.classList.add('force-light');
    } else {
      // For landing page, force dark theme
      document.body.classList.add('landing-page');
      document.body.classList.remove('dashboard-page');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('force-dark');
      document.documentElement.classList.remove('force-light');
    }
  }, [location]);
  
  // This component doesn't render anything
  return null;
} 