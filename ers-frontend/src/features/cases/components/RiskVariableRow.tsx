import { Box, Chip, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import { RiskVariableImpact } from '../../../models/cases';
import { getImpactColor, getImpactLabel, getImpactWeight } from '../helpers/riskHeatmap';

export function RiskVariableRow({
  variable
}: {
  variable: RiskVariableImpact;
}): JSX.Element {
  const theme = useTheme();
  const barColor = getImpactColor(variable.impactLevel, theme);
  const weight = variable.impactScore ?? getImpactWeight(variable.impactLevel);

  return (
    <Stack
      spacing={1}
      sx={{
        p: 1.75,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'rgba(255,255,255,0.72)'
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
        <Stack spacing={0.5}>
          <Typography fontWeight={700}>{variable.label}</Typography>
          {variable.description ? (
            <Typography variant="body2" color="text.secondary">
              {variable.description}
            </Typography>
          ) : null}
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          {variable.value !== undefined ? (
            <Chip label={`Valor: ${variable.value}`} size="small" variant="outlined" />
          ) : null}
          <Chip
            label={getImpactLabel(variable.impactLevel)}
            size="small"
            sx={{ bgcolor: barColor, color: '#fff' }}
          />
        </Stack>
      </Stack>
      <Box>
        <LinearProgress
          aria-label={`Impacto ${getImpactLabel(variable.impactLevel)} para ${variable.label}`}
          variant="determinate"
          value={Math.min(weight, 100)}
          sx={{
            height: 10,
            borderRadius: 999,
            backgroundColor: 'rgba(16,36,58,0.08)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: barColor
            }
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Intensidad estimada: {weight} / 100
        </Typography>
      </Box>
    </Stack>
  );
}
