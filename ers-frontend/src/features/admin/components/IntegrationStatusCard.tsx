import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import { Chip, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import { IntegrationStatus } from '../../../models/admin';
import { SectionCard } from '../../../components/shared/SectionCard';

interface IntegrationStatusCardProps {
  integrations: IntegrationStatus[];
  loading: boolean;
}

export function IntegrationStatusCard({ integrations, loading }: IntegrationStatusCardProps): JSX.Element {
  return (
    <SectionCard title="Estado de integraciones" subtitle="Disponibilidad y latencia de fuentes externas">
      <Stack spacing={2}>
        {loading ? <LinearProgress /> : null}
        <Grid container spacing={2}>
          {integrations.map((integration) => (
            <Grid item xs={12} md={4} key={integration.id}>
              <Stack
                spacing={1.25}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.default',
                  minHeight: 180
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography variant="h6">{integration.name}</Typography>
                  <Chip
                    size="small"
                    label={integration.status}
                    color={
                      integration.status === 'Operativa'
                        ? 'success'
                        : integration.status === 'Degradada'
                          ? 'warning'
                          : 'error'
                    }
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {integration.type}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SyncRoundedIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {integration.latencyMs} ms
                  </Typography>
                </Stack>
                <Typography variant="body2">{integration.detail}</Typography>
                {integration.endpoint ? (
                  <Typography variant="caption" color="text.secondary">
                    {integration.endpoint}
                  </Typography>
                ) : null}
                {integration.authType ? (
                  <Typography variant="caption" color="text.secondary">
                    Auth: {integration.authType}
                  </Typography>
                ) : null}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
                  Ultima sincronizacion: {new Date(integration.lastSyncAt).toLocaleString()}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </SectionCard>
  );
}
