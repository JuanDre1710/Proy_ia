import { useEffect, useState } from 'react';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';
import { AppBreadcrumbs, getRouteTitle } from './AppBreadcrumbs';

const drawerWidth = 290;

export function AppShell(): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, hasAnyRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canAccessAdmin = hasAnyRole(['Administrador']);
  const canAccessAudit = hasAnyRole(['Administrador', 'Supervisor']);

  const items = [
    { to: '/search', label: 'Busqueda', icon: <SearchRoundedIcon /> },
    { to: '/cases/30111222', label: 'Dashboard ejemplo', icon: <DashboardRoundedIcon /> },
    ...(canAccessAudit ? [{ to: '/audit/logs', label: 'Auditoria', icon: <ReceiptLongRoundedIcon /> }] : []),
    ...(canAccessAdmin
      ? [{ to: '/admin', label: 'Panel admin', icon: <AdminPanelSettingsRoundedIcon /> }]
      : [])
  ];

  const drawer = (
    <Box
      sx={{
        height: '100%',
        color: 'white',
        background: 'linear-gradient(180deg, #0f2741 0%, #14395c 100%)',
        p: 2
      }}
    >
      <Box sx={{ px: 1, py: 2.5 }}>
        <Typography
          sx={{
            display: 'inline-flex',
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            bgcolor: 'rgba(255,255,255,0.12)',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}
        >
          ERS
        </Typography>
        <Typography variant="h5" sx={{ mt: 2 }}>
          Evaluador de Riesgos
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.72)' }}>
          Motor antifraude para seguros
        </Typography>
      </Box>
      <List>
        {items.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            sx={{
              color: 'inherit',
              borderRadius: 3,
              mb: 0.5,
              '&.active': {
                bgcolor: 'rgba(255,255,255,0.12)'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  useEffect(() => {
    document.title = getRouteTitle(location.pathname);
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          bgcolor: 'rgba(255,255,255,0.82)',
          color: 'text.primary',
          borderBottom: '1px solid rgba(14,42,71,0.12)',
          backdropFilter: 'blur(14px)'
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton color="inherit" onClick={() => setMobileOpen((value) => !value)} sx={{ display: { lg: 'none' } }}>
            <MenuRoundedIcon />
          </IconButton>
          <Box>
            <Typography fontWeight={700}>ERS</Typography>
            <Typography variant="body2" color="text.secondary">
              Monitoreo de riesgo y trazabilidad
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Avatar sx={{ bgcolor: 'primary.main' }}>{session.user?.name.charAt(0)}</Avatar>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography fontWeight={700}>{session.user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {session.user?.role}
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={() => navigate('/search')}>
            <TravelExploreRoundedIcon />
          </IconButton>
          <IconButton color="inherit" onClick={logout}>
            <LogoutRoundedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(14,42,71,0.12)'
            }
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: 10 }}>
        <Box sx={{ mb: 2 }}>
          <AppBreadcrumbs />
        </Box>
        {session.expiresAt ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Sesion mock activa hasta {new Date(session.expiresAt).toLocaleTimeString()}.
          </Alert>
        ) : null}
        <Outlet />
      </Box>
    </Box>
  );
}
