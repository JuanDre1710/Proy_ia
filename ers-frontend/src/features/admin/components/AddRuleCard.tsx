import { zodResolver } from '@hookform/resolvers/zod';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import { Alert, Button, Grid, LinearProgress, MenuItem, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SectionCard } from '../../../components/shared/SectionCard';

const addRuleSchema = z.object({
  name: z.string().min(3, 'Ingresa un nombre de regla valido.'),
  category: z.string().min(2, 'Ingresa una categoria.'),
  severity: z.enum(['Alta', 'Media', 'Baja']),
  status: z.enum(['Activa', 'Monitoreada']),
  source: z.string().min(2, 'Ingresa el origen o fuente.'),
  description: z.string().min(10, 'Describe brevemente la regla.'),
  ruleType: z.enum(['json_high_amount_suspicious_images']),
  amountThreshold: z.coerce.number().positive('Ingresa un umbral mayor a cero.')
});

type AddRuleFormValues = z.infer<typeof addRuleSchema>;

interface AddRuleCardProps {
  loading: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
  onSubmit: (value: AddRuleFormValues) => Promise<void>;
}

export function AddRuleCard({ loading, feedback, onSubmit }: AddRuleCardProps): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddRuleFormValues>({
    resolver: zodResolver(addRuleSchema),
    defaultValues: {
      name: '',
      category: '',
      severity: 'Media',
      status: 'Activa',
      source: '',
      description: '',
      ruleType: 'json_high_amount_suspicious_images',
      amountThreshold: 250000
    }
  });

  return (
    <SectionCard
      title="Alta de reglas"
      subtitle="Permite agregar reglas configurables que el motor hard-rule evalua sobre casos cargados desde JSON."
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
            <TextField fullWidth label="Nombre de la regla" error={!!errors.name} helperText={errors.name?.message} disabled={loading} {...register('name')} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Categoria" error={!!errors.category} helperText={errors.category?.message} disabled={loading} {...register('category')} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Severidad" error={!!errors.severity} helperText={errors.severity?.message} disabled={loading} {...register('severity')}>
              <MenuItem value="Alta">Alta</MenuItem>
              <MenuItem value="Media">Media</MenuItem>
              <MenuItem value="Baja">Baja</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Estado" error={!!errors.status} helperText={errors.status?.message} disabled={loading} {...register('status')}>
              <MenuItem value="Activa">Activa</MenuItem>
              <MenuItem value="Monitoreada">Monitoreada</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Fuente" error={!!errors.source} helperText={errors.source?.message} disabled={loading} {...register('source')} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Tipo tecnico"
              error={!!errors.ruleType}
              helperText={errors.ruleType?.message ?? 'Regla aplicada sobre casos cargados desde JSON interno.'}
              disabled={loading}
              {...register('ruleType')}
            >
              <MenuItem value="json_high_amount_suspicious_images">
                Monto alto + imagenes sospechosas
              </MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Umbral de monto reclamado"
              error={!!errors.amountThreshold}
              helperText={errors.amountThreshold?.message ?? 'Se dispara cuando el JSON tenga suspiciousImages=true y el monto supere este valor.'}
              disabled={loading}
              inputProps={{ min: 1, step: 1000 }}
              {...register('amountThreshold')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Descripcion"
              error={!!errors.description}
              helperText={errors.description?.message}
              disabled={loading}
              {...register('description')}
            />
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" startIcon={<AddCircleOutlineRoundedIcon />} disabled={loading} sx={{ alignSelf: 'flex-start' }}>
          Agregar regla
        </Button>
      </Stack>
    </SectionCard>
  );
}
