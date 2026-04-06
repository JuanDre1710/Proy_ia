import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

function getCrumbs(pathname: string): Array<{ label: string; to?: string }> {
  if (pathname === '/search') {
    return [{ label: 'Busqueda' }];
  }
  if (pathname === '/cases/upload-json') {
    return [
      { label: 'Busqueda', to: '/search' },
      { label: 'Carga JSON' }
    ];
  }
  if (pathname.startsWith('/cases/')) {
    const caseId = pathname.split('/')[2];
    return [
      { label: 'Busqueda', to: '/search' },
      { label: 'Caso' },
      { label: caseId }
    ];
  }
  if (pathname === '/admin') {
    return [{ label: 'Panel administrativo' }];
  }
  if (pathname === '/audit/logs' || pathname === '/admin/logs') {
    return [{ label: 'Auditoria' }, { label: 'Logs' }];
  }
  if (pathname === '/access-denied') {
    return [{ label: 'Acceso denegado' }];
  }
  return [{ label: 'ERS' }];
}

export function getRouteTitle(pathname: string): string {
  if (pathname === '/search') {
    return 'ERS | Busqueda';
  }
  if (pathname === '/cases/upload-json') {
    return 'ERS | Carga JSON';
  }
  if (pathname.startsWith('/cases/')) {
    return `ERS | Caso ${pathname.split('/')[2]}`;
  }
  if (pathname === '/admin') {
    return 'ERS | Panel administrativo';
  }
  if (pathname === '/audit/logs' || pathname === '/admin/logs') {
    return 'ERS | Auditoria';
  }
  if (pathname === '/access-denied') {
    return 'ERS | Acceso denegado';
  }
  if (pathname === '/login') {
    return 'ERS | Login';
  }
  return 'ERS | Frontend MVP';
}

export function AppBreadcrumbs(): JSX.Element {
  const location = useLocation();
  const crumbs = getCrumbs(location.pathname);

  return (
    <Breadcrumbs separator={<NavigateNextRoundedIcon fontSize="small" />} aria-label="breadcrumb">
      {crumbs.map((crumb, index) =>
        crumb.to ? (
          <Link key={`${crumb.label}-${index}`} component={RouterLink} underline="hover" color="inherit" to={crumb.to}>
            {crumb.label}
          </Link>
        ) : (
          <Typography key={`${crumb.label}-${index}`} color="text.secondary">
            {crumb.label}
          </Typography>
        )
      )}
    </Breadcrumbs>
  );
}
