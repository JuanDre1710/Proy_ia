import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../features/auth/LoginPage';
import { CaseDashboardPage } from '../features/cases/CaseDashboardPage';
import { AdminThresholdsPage } from '../features/admin/AdminThresholdsPage';
import { AdminLogsPage } from '../features/admin/AdminLogsPage';
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
            <Route path="/admin/thresholds" element={<AdminThresholdsPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />
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
