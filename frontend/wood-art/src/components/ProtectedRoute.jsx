
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

// Helper to get dashboard path by role
function getDashboardPath(role) {
  switch (role) {
    case 'customer':
      return '/customer';
    case 'designer':
      return '/designer';
    default:
      return '/';
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { user } = useAuth();


  // If not logged in, block access to all routes except home
  if (!user) {
    if (location.pathname !== '/') {
      return <Navigate to="/" replace />;
    }
    // Only allow the real Home component
    if (children && children.type && children.type.name === 'Home') {
      return children;
    }
    return null;
  }


  // If logged in, prevent access to home page (even via browser refresh)
  useEffect(() => {
    if (user && location.pathname === '/') {
      // Always redirect to dashboard for any logged-in user
      window.location.replace(getDashboardPath(user.role));
    }
    // Disable browser back button and prevent refresh to home for logged-in users
    if (user) {
      const handlePopState = () => {
        if (window.location.pathname === '/') {
          window.location.replace(getDashboardPath(user.role));
        }
      };
      const handlePageShow = () => {
        if (user && window.location.pathname === '/') {
          window.location.replace(getDashboardPath(user.role));
        }
      };
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('pageshow', handlePageShow);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('pageshow', handlePageShow);
      };
    }
  }, [user, location.pathname]);


  if (user && location.pathname === '/') {
    // Already handled by useEffect, render nothing
    return null;
  }

  // If logged in, ensure user can only access their own dashboard/routes
  const dashboardPath = getDashboardPath(user.role);
  // If the user is on a dashboard route that doesn't match their role, redirect
  const dashboardRoutes = ['/customer', '/designer'];
  if (dashboardRoutes.includes(location.pathname) && location.pathname !== dashboardPath) {
    window.location.replace(dashboardPath);
    return null;
  }

  // If logged in, allow access to protected routes (further role checks can be added here)
  return children;
}
