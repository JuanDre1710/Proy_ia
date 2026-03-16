import { Chip, Divider, Stack, Typography, useTheme } from '@mui/material';
import { getNodeTypeColor, getRiskColor } from '../helpers/relationshipGraph';

const nodeTypes = [
  'Persona',
  'Empresa',
  'Siniestro',
  'Taller',
  'Abogado',
  'Medico',
  'Testigo',
  'Familiar',
  'Cuenta'
] as const;

const riskLevels = ['low', 'medium', 'high', 'critical'] as const;

export function GraphLegend(): JSX.Element {
  const theme = useTheme();

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Tipos de nodo
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {nodeTypes.map((type) => (
          <Chip
            key={type}
            label={type}
            size="small"
            sx={{ bgcolor: getNodeTypeColor(type, theme), color: '#fff' }}
          />
        ))}
      </Stack>
      <Divider />
      <Typography variant="body2" color="text.secondary">
        Riesgo de nodo / severidad de relacion
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {riskLevels.map((level) => (
          <Chip
            key={level}
            label={level}
            size="small"
            sx={{ bgcolor: getRiskColor(level, theme), color: '#fff' }}
          />
        ))}
      </Stack>
    </Stack>
  );
}
