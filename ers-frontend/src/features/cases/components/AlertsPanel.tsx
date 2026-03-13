import { Alert, Card, CardContent, Stack, Typography } from '@mui/material';
import { FraudAlert } from '../../../models/cases';
import { AlertItemCard } from './AlertItemCard';

export function AlertsPanel({ alerts }: { alerts: FraudAlert[] }): JSX.Element {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6">Alertas antifraude</Typography>
            <Typography color="text.secondary">
              Senales activas del caso priorizadas para usuarios de negocio.
            </Typography>
          </Stack>
          {alerts.length === 0 ? (
            <Alert severity="success">No se detectaron alertas relevantes en este caso.</Alert>
          ) : (
            alerts.map((item) => <AlertItemCard key={item.id} alert={item} />)
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
