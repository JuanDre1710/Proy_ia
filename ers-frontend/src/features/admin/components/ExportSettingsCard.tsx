import { zodResolver } from '@hookform/resolvers/zod';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SettingsBackupRestoreRoundedIcon from '@mui/icons-material/SettingsBackupRestoreRounded';
import {
  Alert,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField
} from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { SectionCard } from '../../../components/shared/SectionCard';
import { ExportSetting } from '../../../models/admin';

const exportSettingsSchema = z.object({
  csvEnabled: z.boolean(),
  pdfEnabled: z.boolean(),
  includeSensitiveData: z.boolean(),
  requireApproval: z.boolean(),
  maxRowsPerExport: z.coerce.number().int().min(1).max(100000),
  deliveryChannel: z.enum(['Descarga directa', 'Correo interno'])
}).refine((value) => value.csvEnabled || value.pdfEnabled, {
  message: 'Debes habilitar al menos un formato de exportacion.',
  path: ['csvEnabled']
});

type ExportSettingsFormValues = z.infer<typeof exportSettingsSchema>;

interface ExportSettingsCardProps {
  value: ExportSetting;
  loading: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
  onSave: (value: ExportSettingsFormValues) => Promise<void>;
  onRestore: () => Promise<void>;
}

export function ExportSettingsCard({
  value,
  loading,
  feedback,
  onSave,
  onRestore
}: ExportSettingsCardProps): JSX.Element {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ExportSettingsFormValues>({
    resolver: zodResolver(exportSettingsSchema),
    defaultValues: {
      csvEnabled: value.csvEnabled,
      pdfEnabled: value.pdfEnabled,
      includeSensitiveData: value.includeSensitiveData,
      requireApproval: value.requireApproval,
      maxRowsPerExport: value.maxRowsPerExport,
      deliveryChannel: value.deliveryChannel
    }
  });

  useEffect(() => {
    reset({
      csvEnabled: value.csvEnabled,
      pdfEnabled: value.pdfEnabled,
      includeSensitiveData: value.includeSensitiveData,
      requireApproval: value.requireApproval,
      maxRowsPerExport: value.maxRowsPerExport,
      deliveryChannel: value.deliveryChannel
    });
  }, [reset, value]);

  return (
    <SectionCard
      title="Configuracion de exportaciones"
      subtitle={`Actualizado por ${value.updatedBy} el ${new Date(value.updatedAt).toLocaleString()}`}
    >
      <Stack spacing={2} component="form" onSubmit={handleSubmit(onSave)}>
        {loading ? <LinearProgress /> : null}
        {feedback ? <Alert severity={feedback.type}>{feedback.message}</Alert> : null}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Controller
              name="csvEnabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={loading} />}
                  label="CSV habilitado"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="pdfEnabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={loading} />}
                  label="PDF habilitado"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="includeSensitiveData"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={loading} />}
                  label="Incluir datos sensibles"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="requireApproval"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={loading} />}
                  label="Requiere aprobacion"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Maximo de filas por exportacion"
              error={!!errors.maxRowsPerExport}
              helperText={errors.maxRowsPerExport?.message}
              disabled={loading}
              {...register('maxRowsPerExport')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="deliveryChannel"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="delivery-channel-label">Canal de entrega</InputLabel>
                  <Select
                    {...field}
                    labelId="delivery-channel-label"
                    label="Canal de entrega"
                    disabled={loading}
                  >
                    <MenuItem value="Descarga directa">Descarga directa</MenuItem>
                    <MenuItem value="Correo interno">Correo interno</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
        {errors.csvEnabled ? <Alert severity="error">{errors.csvEnabled.message}</Alert> : null}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />} disabled={loading}>
            Guardar exportaciones
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
