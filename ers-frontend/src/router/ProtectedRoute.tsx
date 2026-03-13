import { Navigate, Outlet } from 'react-router-dom';
import { Role } from '../models/auth';
import { useAuth } from '../state/AuthContext';

interface ProtectedRouteProps {
  roles?: Role[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps): JSX.Element {
  const { session, hasAnyRole } = useAuth();

  if (!session.authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasAnyRole(roles)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}
