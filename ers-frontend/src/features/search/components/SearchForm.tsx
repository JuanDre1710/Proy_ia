import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import { IdentifierValidationResult } from '../../../models/search';

interface SearchFormProps {
  isLoading: boolean;
  onValidate: (value: string) => IdentifierValidationResult;
  onSubmit: (value: string) => Promise<void>;
}

export function SearchForm({ isLoading, onValidate, onSubmit }: SearchFormProps): JSX.Element {
  const [value, setValue] = useState('');

  const validation = onValidate(value);
  const showValidationError = value.trim().length > 0 && !validation.isValid;

  return (
    <Card>
      <CardContent>
        <Stack
          component="form"
          gap={2}
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(value);
          }}
        >
          <Box>
            <Typography variant="h6">Buscar persona o entidad</Typography>
            <Typography color="text.secondary">
              Ingresa un DNI, CUIL o CUIT. El tipo se detecta automaticamente y se valida antes de consultar.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ md: 'flex-start' }}>
            <TextField
              fullWidth
              label="DNI, CUIL o CUIT"
              placeholder="Ej. 30111222 o 20333444556"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              error={showValidationError}
              helperText={showValidationError ? validation.error : ' '}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !validation.isValid}
              startIcon={<ManageSearchRoundedIcon />}
              sx={{ minWidth: { md: 180 } }}
            >
              {isLoading ? 'Evaluando...' : 'Evaluar'}
            </Button>
          </Stack>

          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip
              label={`Tipo detectado: ${validation.identifierType ?? 'Pendiente'}`}
              color={validation.identifierType ? 'primary' : 'default'}
              variant={validation.identifierType ? 'filled' : 'outlined'}
            />
            <Chip
              label={`Normalizado: ${validation.normalizedValue || 'Sin datos'}`}
              variant="outlined"
            />
          </Stack>

          {!value ? (
            <Alert severity="info">Todavia no hay una consulta cargada. Ingresa un identificador para comenzar.</Alert>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
