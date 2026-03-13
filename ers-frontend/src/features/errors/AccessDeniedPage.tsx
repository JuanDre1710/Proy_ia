import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { StatusState } from '../../components/shared/StatusState';

export function AccessDeniedPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      <StatusState status="error" message="Tu rol no tiene permiso para acceder a este modulo." />
      <Box>
        <Button variant="contained" onClick={() => navigate('/search')}>
          Volver a la busqueda
        </Button>
      </Box>
    </Stack>
  );
}
