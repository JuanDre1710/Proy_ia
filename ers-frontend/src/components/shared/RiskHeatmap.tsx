import { Box, Grid, Typography } from '@mui/material';
import { RiskHeatmapCell } from '../../models/domain';

function cellBackground(intensity: number): string {
  if (intensity >= 80) {
    return 'linear-gradient(135deg, rgba(180,35,24,0.16), rgba(180,35,24,0.34))';
  }
  if (intensity >= 55) {
    return 'linear-gradient(135deg, rgba(217,119,6,0.18), rgba(217,119,6,0.30))';
  }
  return 'linear-gradient(135deg, rgba(12,123,147,0.14), rgba(12,123,147,0.22))';
}

export function RiskHeatmap({ cells }: { cells: RiskHeatmapCell[] }): JSX.Element {
  return (
    <Grid container spacing={1.5}>
      {cells.map((item) => (
        <Grid key={item.variable} item xs={12} sm={6} lg={4}>
          <Box sx={{ p: 2, borderRadius: 4, minHeight: 110, background: cellBackground(item.intensity) }}>
            <Typography fontWeight={700}>{item.variable}</Typography>
            <Typography>{item.value}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.intensity} / 100
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
