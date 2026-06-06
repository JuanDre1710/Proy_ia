import { zodResolver } from '@hookform/resolvers/zod';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SettingsBackupRestoreRoundedIcon from '@mui/icons-material/SettingsBackupRestoreRounded';
import {
  Alert,
  Button,
  FormControlLabel,
  Grid,
  LinearProgress,
  Stack,
  Switch,
  TextField
} from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { SectionCard } from '../../../components/shared/SectionCard';
import { SystemSetting } from '../../../models/admin';

const systemSettingsSchema = z.object({
  autoAssignmentEnabled: z.boolean(),
  sessionTimeoutMinutes: z.coerce.number().int().min(5).max(240),
  incidentEmail: z.string().email('Ingresa un correo valido.'),
  auditRetentionDays: z.coerce.number().int().min(30).max(3650),
  maintenanceMode: z.boolean()
});

type SystemSettingsFormValues = z.infer<typeof systemSettingsSchema>;

interface SystemSettingsCardProps {
  value: SystemSetting;
  loading: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
  onSave: (value: SystemSettingsFormValues) => Promise<void>;
  onRestore: () => Promise<void>;
}

export function SystemSettingsCard({
  value,
  loading,
  feedback,
  onSave,
  onRestore
}: SystemSettingsCardProps): JSX.Element {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SystemSettingsFormValues>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      autoAssignmentEnabled: value.autoAssignmentEnabled,
      sessionTimeoutMinutes: value.sessionTimeoutMinutes,
      incidentEmail: value.incidentEmail,
      auditRetentionDays: value.auditRetentionDays,
      maintenanceMode: value.maintenanceMode
    }
  });

  useEffect(() => {
    reset({
      autoAssignmentEnabled: value.autoAssignmentEnabled,
      sessionTimeoutMinutes: value.sessionTimeoutMinutes,
      incidentEmail: value.incidentEmail,
      auditRetentionDays: value.auditRetentionDays,
      maintenanceMode: value.maintenanceMode
    });
  }, [reset, value]);

  return (
    <SectionCard
      title="Parametros generales del sistema"
      subtitle={`Actualizado por ${value.updatedBy} el ${new Date(value.updatedAt).toLocaleString()}`}
    >
      <Stack spacing={2} component="form" onSubmit={handleSubmit(onSave)}>
        {loading ? <LinearProgress /> : null}
        {feedback ? <Alert severity={feedback.type}>{feedback.message}</Alert> : null}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Controller
              name="autoAssignmentEnabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={loading} />}
                  label="Asignacion automatica de casos"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="maintenanceMode"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={loading} />}
                  label="Modo mantenimiento"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Timeout de sesion (min)"
              error={!!errors.sessionTimeoutMinutes}
              helperText={errors.sessionTimeoutMinutes?.message}
              disabled={loading}
              {...register('sessionTimeoutMinutes')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Retencion de auditoria (dias)"
              error={!!errors.auditRetentionDays}
              helperText={errors.auditRetentionDays?.message}
              disabled={loading}
              {...register('auditRetentionDays')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Correo de incidentes"
              error={!!errors.incidentEmail}
              helperText={errors.incidentEmail?.message}
              disabled={loading}
              {...register('incidentEmail')}
            />
          </Grid>
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />} disabled={loading}>
            Guardar parametros
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
