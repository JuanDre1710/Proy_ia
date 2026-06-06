import { zodResolver } from '@hookform/resolvers/zod';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SettingsBackupRestoreRoundedIcon from '@mui/icons-material/SettingsBackupRestoreRounded';
import { Alert, Button, Grid, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { RiskThresholdConfig } from '../../../models/admin';
import { SectionCard } from '../../../components/shared/SectionCard';

const thresholdSchema = z.object({
  manualReviewThreshold: z.coerce.number().min(1).max(100),
  autoRejectThreshold: z.coerce.number().min(1).max(100),
  suspiciousClaimFrequency: z.coerce.number().int().min(1).max(20),
  debtRatioThreshold: z.coerce.number().min(1).max(100),
  highRiskCountryWeight: z.coerce.number().min(0).max(100)
}).refine((value) => value.autoRejectThreshold > value.manualReviewThreshold, {
  message: 'El rechazo automatico debe ser mayor al umbral de revision manual.',
  path: ['autoRejectThreshold']
});

type ThresholdFormValues = z.infer<typeof thresholdSchema>;

interface ThresholdConfigCardProps {
  value: RiskThresholdConfig;
  loading: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
  onSave: (value: ThresholdFormValues) => Promise<void>;
  onRestore: () => Promise<void>;
}

export function ThresholdConfigCard({
  value,
  loading,
  feedback,
  onSave,
  onRestore
}: ThresholdConfigCardProps): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ThresholdFormValues>({
    resolver: zodResolver(thresholdSchema),
    defaultValues: {
      manualReviewThreshold: value.manualReviewThreshold,
      autoRejectThreshold: value.autoRejectThreshold,
      suspiciousClaimFrequency: value.suspiciousClaimFrequency,
      debtRatioThreshold: value.debtRatioThreshold,
      highRiskCountryWeight: value.highRiskCountryWeight
    }
  });

  useEffect(() => {
    reset({
      manualReviewThreshold: value.manualReviewThreshold,
      autoRejectThreshold: value.autoRejectThreshold,
      suspiciousClaimFrequency: value.suspiciousClaimFrequency,
      debtRatioThreshold: value.debtRatioThreshold,
      highRiskCountryWeight: value.highRiskCountryWeight
    });
  }, [reset, value]);

  return (
    <SectionCard
      title="Configuracion de umbrales de riesgo"
      subtitle={`Actualizado por ${value.updatedBy} el ${new Date(value.updatedAt).toLocaleString()}`}
    >
      <Stack spacing={2} component="form" onSubmit={handleSubmit(onSave)}>
        {loading ? <LinearProgress /> : null}
        {feedback ? <Alert severity={feedback.type}>{feedback.message}</Alert> : null}
        <Typography variant="body2" color="text.secondary">
          Define los limites centrales que impactan la clasificacion automatica y la revision manual.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Revision manual"
              error={!!errors.manualReviewThreshold}
              helperText={errors.manualReviewThreshold?.message}
              disabled={loading}
              {...register('manualReviewThreshold')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Rechazo automatico"
              error={!!errors.autoRejectThreshold}
              helperText={errors.autoRejectThreshold?.message}
              disabled={loading}
              {...register('autoRejectThreshold')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Frecuencia sospechosa"
              error={!!errors.suspiciousClaimFrequency}
              helperText={errors.suspiciousClaimFrequency?.message}
              disabled={loading}
              {...register('suspiciousClaimFrequency')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Debt ratio maximo"
              error={!!errors.debtRatioThreshold}
              helperText={errors.debtRatioThreshold?.message}
              disabled={loading}
              {...register('debtRatioThreshold')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Peso pais de alto riesgo"
              error={!!errors.highRiskCountryWeight}
              helperText={errors.highRiskCountryWeight?.message}
              disabled={loading}
              {...register('highRiskCountryWeight')}
            />
          </Grid>
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />} disabled={loading}>
            Guardar umbrales
          </Button>
          <Button
            type="button"
            variant="outlined"
            startIcon={<SettingsBackupRestoreRoundedIcon />}
            onClick={() => void onRestore()}
            disabled={loading}
          >
            Restaurar mock
          </Button>
        </Stack>
      </Stack>
    </SectionCard>
  );
}
