import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../features/auth/LoginPage';
import { AdminPage } from '../features/admin/AdminPage';
import { AuditLogsPage } from '../features/audit/AuditLogsPage';
import { CaseDashboardPage } from '../features/cases/CaseDashboardPage';
import { AccessDeniedPage } from '../features/errors/AccessDeniedPage';
import { NotFoundPage } from '../features/errors/NotFoundPage';
import { SearchPage } from '../features/search/SearchPage';
import { ProtectedRoute } from './ProtectedRoute';

export function RouterProvider(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/dashboard" element={<Navigate to="/search" replace />} />
          <Route path="/dashboard/:identifier" element={<LegacyCaseRedirect />} />
          <Route path="/cases/:caseId" element={<CaseDashboardPage />} />
          <Route element={<ProtectedRoute roles={['Administrador', 'Supervisor']} />}>
            <Route path="/audit/logs" element={<AuditLogsPage />} />
            <Route path="/admin/logs" element={<Navigate to="/audit/logs" replace />} />
          </Route>
          <Route element={<ProtectedRoute roles={['Administrador']} />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/thresholds" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>
      </Route>
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function LegacyCaseRedirect(): JSX.Element {
  return <Navigate to="/search" replace />;
}
