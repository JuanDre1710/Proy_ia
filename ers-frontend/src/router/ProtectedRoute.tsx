import { Navigate, Outlet } from 'react-router-dom';
import { AccessDeniedPage } from '../features/errors/AccessDeniedPage';
import { Role } from '../models/auth';
import { useAuth } from '../state/AuthContext';

interface ProtectedRouteProps {
  roles?: Role[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps): JSX.Element {
  const { session, loading, hasAnyRole } = useAuth();

  if (loading) {
    return <></>;
  }

  if (!session.authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasAnyRole(roles)) {
    return <AccessDeniedPage />;
  }

  return <Outlet />;
}
