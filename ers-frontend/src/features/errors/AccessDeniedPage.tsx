import { Box, Button, Stack } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRouteTitle } from '../../components/layout/AppBreadcrumbs';
import { StatusState } from '../../components/shared/StatusState';

export function AccessDeniedPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = getRouteTitle('/access-denied');
  }, []);

  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      <StatusState
        status="error"
        title="Acceso denegado"
        message="Tu rol no tiene permiso para acceder a este modulo del MVP."
      />
      <Box>
        <Button variant="contained" onClick={() => navigate('/search')}>
          Volver a la busqueda
        </Button>
      </Box>
    </Stack>
  );
}
