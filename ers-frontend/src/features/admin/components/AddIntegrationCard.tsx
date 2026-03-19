import { zodResolver } from '@hookform/resolvers/zod';
import AddLinkRoundedIcon from '@mui/icons-material/AddLinkRounded';
import { Alert, Button, Grid, LinearProgress, MenuItem, Stack, TextField } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SectionCard } from '../../../components/shared/SectionCard';

const addIntegrationSchema = z.object({
  code: z.string().min(2, 'Ingresa un codigo tecnico.'),
  providerType: z.enum(['IDENTITY', 'FINANCIAL', 'RELATIONSHIP', 'DOCUMENT']),
  name: z.string().min(2, 'Ingresa un nombre de integracion.'),
  type: z.enum(['API REST', 'Webhook', 'Batch', 'Base de datos']),
  status: z.enum(['Operativa', 'Degradada', 'Fuera de linea']),
  endpoint: z.string().url('Ingresa una URL valida.'),
  authType: z.enum(['API Key', 'OAuth2', 'Basic', 'Ninguna']),
  timeoutMs: z.coerce.number().int().min(250).max(60000),
  retries: z.coerce.number().int().min(0).max(10),
  enabled: z.enum(['true', 'false']),
  secretRef: z.string().optional(),
  detail: z.string().min(10, 'Describe brevemente la integracion.'),
  metadataJson: z.string().optional()
});

export type AddIntegrationFormValues = z.infer<typeof addIntegrationSchema>;

interface AddIntegrationCardProps {
  loading: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
  initialValue?: AddIntegrationFormValues | null;
  submitLabel?: string;
  onSubmit: (value: AddIntegrationFormValues) => Promise<void>;
  onCancelEdit?: () => void;
}

export function AddIntegrationCard({
  loading,
  feedback,
  initialValue,
  submitLabel,
  onSubmit,
  onCancelEdit
}: AddIntegrationCardProps): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddIntegrationFormValues>({
    resolver: zodResolver(addIntegrationSchema),
    defaultValues: {
      code: '',
      providerType: 'IDENTITY',
      name: '',
      type: 'API REST',
      status: 'Operativa',
      endpoint: '',
      authType: 'API Key',
      timeoutMs: 5000,
      retries: 0,
      enabled: 'true',
      secretRef: '',
      detail: '',
      metadataJson: '{}'
    }
  });

  const isEditing = !!initialValue;

  React.useEffect(() => {
    if (initialValue) {
      reset(initialValue);
      return;
    }

    reset({
      code: '',
      providerType: 'IDENTITY',
      name: '',
      type: 'API REST',
      status: 'Operativa',
      endpoint: '',
      authType: 'API Key',
      timeoutMs: 5000,
      retries: 0,
      enabled: 'true',
      secretRef: '',
      detail: '',
      metadataJson: '{}'
    });
  }, [initialValue, reset]);

  return (
    <SectionCard
      title={isEditing ? 'Edicion de integracion externa' : 'Alta de integraciones externas'}
      subtitle="Permite registrar nuevas APIs, webhooks u otras fuentes externas del sistema."
    >
      <Stack
        spacing={2}
        component="form"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
          if (!initialValue) {
            reset();
          }
        })}
      >
        {loading ? <LinearProgress /> : null}
        {feedback ? <Alert severity={feedback.type}>{feedback.message}</Alert> : null}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Codigo" error={!!errors.code} helperText={errors.code?.message} disabled={loading} {...register('code')} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth select label="Provider type" error={!!errors.providerType} helperText={errors.providerType?.message} disabled={loading} {...register('providerType')}>
              <MenuItem value="IDENTITY">IDENTITY</MenuItem>
              <MenuItem value="FINANCIAL">FINANCIAL</MenuItem>
              <MenuItem value="RELATIONSHIP">RELATIONSHIP</MenuItem>
              <MenuItem value="DOCUMENT">DOCUMENT</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Nombre de integracion" error={!!errors.name} helperText={errors.name?.message} disabled={loading} {...register('name')} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth select label="Tipo" error={!!errors.type} helperText={errors.type?.message} disabled={loading} {...register('type')}>
              <MenuItem value="API REST">API REST</MenuItem>
              <MenuItem value="Webhook">Webhook</MenuItem>
              <MenuItem value="Batch">Batch</MenuItem>
              <MenuItem value="Base de datos">Base de datos</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Estado inicial" error={!!errors.status} helperText={errors.status?.message} disabled={loading} {...register('status')}>
              <MenuItem value="Operativa">Operativa</MenuItem>
              <MenuItem value="Degradada">Degradada</MenuItem>
              <MenuItem value="Fuera de linea">Fuera de linea</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Autenticacion" error={!!errors.authType} helperText={errors.authType?.message} disabled={loading} {...register('authType')}>
              <MenuItem value="API Key">API Key</MenuItem>
              <MenuItem value="OAuth2">OAuth2</MenuItem>
              <MenuItem value="Basic">Basic</MenuItem>
              <MenuItem value="Ninguna">Ninguna</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Endpoint / URL" error={!!errors.endpoint} helperText={errors.endpoint?.message} disabled={loading} {...register('endpoint')} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth type="number" label="Timeout ms" error={!!errors.timeoutMs} helperText={errors.timeoutMs?.message} disabled={loading} {...register('timeoutMs')} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth type="number" label="Retries" error={!!errors.retries} helperText={errors.retries?.message} disabled={loading} {...register('retries')} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth select label="Habilitada" error={!!errors.enabled} helperText={errors.enabled?.message} disabled={loading} {...register('enabled')}>
              <MenuItem value="true">Si</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Secret ref" error={!!errors.secretRef} helperText={errors.secretRef?.message ?? 'Referencia abstracta, no credencial cruda.'} disabled={loading} {...register('secretRef')} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Descripcion"
              error={!!errors.detail}
              helperText={errors.detail?.message}
              disabled={loading}
              {...register('detail')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Metadata JSON"
              error={!!errors.metadataJson}
              helperText={errors.metadataJson?.message ?? 'Configuracion libre desacoplada del dominio.'}
              disabled={loading}
              {...register('metadataJson')}
            />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1.5}>
          <Button type="submit" variant="contained" startIcon={<AddLinkRoundedIcon />} disabled={loading} sx={{ alignSelf: 'flex-start' }}>
            {submitLabel ?? (isEditing ? 'Guardar cambios' : 'Agregar integracion')}
          </Button>
          {isEditing && onCancelEdit ? (
            <Button type="button" variant="text" disabled={loading} onClick={onCancelEdit}>
              Cancelar edicion
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </SectionCard>
  );
}
