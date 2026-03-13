import { FormEvent, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    const success = login({ username, password });
    if (!success) {
      setError('Credenciales invalidas.');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Card sx={{ width: 'min(1080px, 100%)', overflow: 'hidden' }}>
        <Grid container>
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              p: 4,
              color: 'white',
              background:
                'linear-gradient(160deg, rgba(12, 123, 147, 0.92), rgba(13, 59, 102, 0.96))'
            }}
          >
            <Typography
              sx={{
                display: 'inline-flex',
                px: 1.5,
                py: 0.5,
                borderRadius: 999,
                bgcolor: 'rgba(255,255,255,0.15)',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              ERS
            </Typography>
            <Typography variant="h3" sx={{ mt: 2 }}>
              Evaluador de Riesgos de Seguros
            </Typography>
            <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.82)' }}>
              Acceso seguro al tablero antifraude, trazabilidad y explicabilidad del score.
            </Typography>
            <List sx={{ mt: 2, color: 'rgba(255,255,255,0.82)' }}>
              <ListItem disablePadding>Roles y permisos por perfil</ListItem>
              <ListItem disablePadding>Consulta por DNI, CUIL y CUIT</ListItem>
              <ListItem disablePadding>Alertas, heatmap y red de relaciones</ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={5}>
            <CardContent sx={{ p: 4 }}>
              <Stack component="form" gap={2} onSubmit={handleSubmit}>
                {error ? <Alert severity="error">{error}</Alert> : null}
                <TextField
                  label="Usuario"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  InputProps={{ endAdornment: <PersonRoundedIcon color="action" /> }}
                />
                <TextField
                  label="Contrasena"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => setShowPassword((value) => !value)}>
                        {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                      </IconButton>
                    )
                  }}
                />
                <Button type="submit" variant="contained" size="large">
                  Iniciar sesion
                </Button>
              </Stack>
              <Box sx={{ mt: 3, p: 2, borderRadius: 4, bgcolor: 'rgba(227,237,247,0.9)' }}>
                <Typography fontWeight={700}>Credenciales demo</Typography>
                <Typography color="text.secondary">admin / Admin#123</Typography>
                <Typography color="text.secondary">evaluador / Eval#123</Typography>
                <Typography color="text.secondary">supervisor / Super#123</Typography>
              </Box>
            </CardContent>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}
