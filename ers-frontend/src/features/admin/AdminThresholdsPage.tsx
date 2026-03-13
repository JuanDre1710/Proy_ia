import { FormEvent, useState } from 'react';
import { Alert, Button, Grid, Stack, TextField } from '@mui/material';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionCard } from '../../components/shared/SectionCard';
import { ersDataService } from '../../services/ersDataService';
import { useAuth } from '../../state/AuthContext';

export function AdminThresholdsPage(): JSX.Element {
  const { session } = useAuth();
  const initial = ersDataService.getThresholds();
  const [reviewThreshold, setReviewThreshold] = useState(initial.reviewThreshold);
  const [autoRejectThreshold, setAutoRejectThreshold] = useState(initial.autoRejectThreshold);
  const [suspiciousClaimFrequency, setSuspiciousClaimFrequency] = useState(initial.suspiciousClaimFrequency);
  const [debtRatioThreshold, setDebtRatioThreshold] = useState(initial.debtRatioThreshold);
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [message, setMessage] = useState('');

  const save = (event: FormEvent): void => {
    event.preventDefault();
    const updated = ersDataService.updateThresholds(
      {
        reviewThreshold,
        autoRejectThreshold,
        suspiciousClaimFrequency,
        debtRatioThreshold
      },
      session.user
    );
    setUpdatedAt(updated.updatedAt);
    setMessage('Umbrales actualizados.');
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Configuracion de umbrales"
        subtitle="Parametros operativos del motor de riesgo y reglas de intervencion."
      />
      <SectionCard title="Umbrales de negocio" subtitle={`Ultima actualizacion: ${updatedAt}`}>
        <Stack component="form" spacing={2} onSubmit={save}>
          {message ? <Alert severity="success">{message}</Alert> : null}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Umbral de revision manual" value={reviewThreshold} onChange={(event) => setReviewThreshold(Number(event.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Umbral de rechazo automatico" value={autoRejectThreshold} onChange={(event) => setAutoRejectThreshold(Number(event.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Frecuencia sospechosa de siniestros" value={suspiciousClaimFrequency} onChange={(event) => setSuspiciousClaimFrequency(Number(event.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Debt ratio maximo" value={debtRatioThreshold} onChange={(event) => setDebtRatioThreshold(Number(event.target.value))} />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>
            Guardar cambios
          </Button>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
