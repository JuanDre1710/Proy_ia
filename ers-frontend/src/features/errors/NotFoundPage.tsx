import { Box, Button, Stack } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusState } from '../../components/shared/StatusState';

export function NotFoundPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'ERS | Ruta no encontrada';
  }, []);

  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      <StatusState
        status="empty"
        title="Ruta no encontrada"
        message="La ruta solicitada no existe en este MVP navegable o ya fue reemplazada."
      />
      <Box>
        <Button variant="contained" onClick={() => navigate('/search')}>
          Ir a la busqueda
        </Button>
      </Box>
    </Stack>
  );
}
