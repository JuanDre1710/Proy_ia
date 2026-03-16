import { Chip, Stack, Typography, useTheme } from '@mui/material';
import { getImpactColor, getImpactLabel } from '../helpers/riskHeatmap';

const levels = ['low', 'medium', 'high', 'critical'] as const;

export function RiskLegend(): JSX.Element {
  const theme = useTheme();

  return (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">
        Leyenda de severidad
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {levels.map((level) => (
          <Chip
            key={level}
            label={getImpactLabel(level)}
            sx={{
              bgcolor: getImpactColor(level, theme),
              color: '#fff'
            }}
            size="small"
          />
        ))}
      </Stack>
    </Stack>
  );
}
