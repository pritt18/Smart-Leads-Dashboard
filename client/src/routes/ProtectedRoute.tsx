/**
 * ProtectedRoute.tsx — Guards routes that require authentication.
 *
 * Three states:
 *  1. isLoading=true  → Show a full-page spinner while the session is being
 *     restored from localStorage on mount. Avoids a flash of the login page
 *     for returning authenticated users.
 *  2. isAuthenticated → Render the child route normally.
 *  3. Not authenticated → Redirect to /login, preserving the originally
 *     requested path in location.state so the login page can redirect back.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
