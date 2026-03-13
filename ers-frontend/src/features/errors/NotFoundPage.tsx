import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { StatusState } from '../../components/shared/StatusState';

export function NotFoundPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      <StatusState status="empty" message="La ruta solicitada no existe en este MVP." />
      <Box>
        <Button variant="contained" onClick={() => navigate('/search')}>
          Ir a la busqueda
        </Button>
      </Box>
    </Stack>
  );
}
