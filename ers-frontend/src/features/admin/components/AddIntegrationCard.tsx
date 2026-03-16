import { zodResolver } from '@hookform/resolvers/zod';
import AddLinkRoundedIcon from '@mui/icons-material/AddLinkRounded';
import { Alert, Button, Grid, LinearProgress, MenuItem, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SectionCard } from '../../../components/shared/SectionCard';

const addIntegrationSchema = z.object({
  name: z.string().min(2, 'Ingresa un nombre de integracion.'),
  type: z.enum(['API REST', 'Webhook', 'Batch', 'Base de datos']),
  status: z.enum(['Operativa', 'Degradada', 'Fuera de linea']),
  endpoint: z.string().url('Ingresa una URL valida.'),
  authType: z.enum(['API Key', 'OAuth2', 'Basic', 'Ninguna']),
  detail: z.string().min(10, 'Describe brevemente la integracion.')
});

type AddIntegrationFormValues = z.infer<typeof addIntegrationSchema>;

interface AddIntegrationCardProps {
  loading: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
  onSubmit: (value: AddIntegrationFormValues) => Promise<void>;
}

export function AddIntegrationCard({
  loading,
  feedback,
  onSubmit
}: AddIntegrationCardProps): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddIntegrationFormValues>({
    resolver: zodResolver(addIntegrationSchema),
    defaultValues: {
      name: '',
      type: 'API REST',
      status: 'Operativa',
      endpoint: '',
      authType: 'API Key',
      detail: ''
    }
  });

  return (
    <SectionCard
      title="Alta de integraciones externas"
      subtitle="Permite registrar nuevas APIs, webhooks u otras fuentes externas del sistema."
    >
      <Stack
        spacing={2}
        component="form"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
          reset();
        })}
      >
        {loading ? <LinearProgress /> : null}
        {feedback ? <Alert severity={feedback.type}>{feedback.message}</Alert> : null}
        <Grid container spacing={2}>
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
        </Grid>
        <Button type="submit" variant="contained" startIcon={<AddLinkRoundedIcon />} disabled={loading} sx={{ alignSelf: 'flex-start' }}>
          Agregar integracion
        </Button>
      </Stack>
    </SectionCard>
  );
}
