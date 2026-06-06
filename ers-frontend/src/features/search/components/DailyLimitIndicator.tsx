import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';

interface DailyLimitIndicatorProps {
  used: number;
  limit: number;
  remaining: number;
}

export function DailyLimitIndicator({
  used,
  limit,
  remaining
}: DailyLimitIndicatorProps): JSX.Element {
  const progress = Math.min((used / limit) * 100, 100);
  const color: 'primary' | 'warning' | 'error' =
    progress >= 85 ? 'error' : progress >= 60 ? 'warning' : 'primary';

  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6">Limite diario de consultas</Typography>
          <Typography color="text.secondary">
            {used} de {limit} consultas utilizadas hoy.
          </Typography>
          <LinearProgress color={color} variant="determinate" value={progress} sx={{ height: 10, borderRadius: 999 }} />
          <Typography color="text.secondary">
            Restantes disponibles: <strong>{remaining}</strong>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
