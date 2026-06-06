import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import { Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import { AuditActionType, AuditLogEntry, AuditLogFilter, AuditResultType } from '../../../models/audit';
import { SectionCard } from '../../../components/shared/SectionCard';

interface AuditLogFiltersProps {
  value: AuditLogFilter;
  loading: boolean;
  onChange: (value: AuditLogFilter) => void;
  onReset: () => void;
  onExport: () => void;
}

const roleOptions: Array<AuditLogEntry['rol']> = ['Administrador', 'Supervisor', 'Evaluador de Riesgos', 'Sistema'];
const actionOptions: AuditActionType[] = [
  'Login',
  'Logout',
  'Consulta de riesgo',
  'Exportacion CSV',
  'Exportacion PDF',
  'Actualizacion de umbrales',
  'Cambio de parametros',
  'Revision manual'
];
const resultOptions: AuditResultType[] = ['OK', 'Observado', 'Bloqueado', 'Error'];

export function AuditLogFilters({
  value,
  loading,
  onChange,
  onReset,
  onExport
}: AuditLogFiltersProps): JSX.Element {
  return (
    <SectionCard
      title="Filtros de auditoria"
      subtitle="Refina la consulta por usuario, rol, fecha, accion y resultado."
    >
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Usuario"
              value={value.usuario}
              disabled={loading}
              onChange={(event) => onChange({ ...value, usuario: event.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Rol"
              value={value.rol}
              disabled={loading}
              onChange={(event) => onChange({ ...value, rol: event.target.value as AuditLogFilter['rol'] })}
            >
              <MenuItem value="">Todos</MenuItem>
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Accion"
              value={value.accion}
              disabled={loading}
              onChange={(event) => onChange({ ...value, accion: event.target.value as AuditLogFilter['accion'] })}
            >
              <MenuItem value="">Todas</MenuItem>
              {actionOptions.map((action) => (
                <MenuItem key={action} value={action}>
                  {action}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Fecha desde"
              value={value.fechaDesde}
              disabled={loading}
              onChange={(event) => onChange({ ...value, fechaDesde: event.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Fecha hasta"
              value={value.fechaHasta}
              disabled={loading}
              onChange={(event) => onChange({ ...value, fechaHasta: event.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Resultado"
              value={value.resultado}
              disabled={loading}
              onChange={(event) => onChange({ ...value, resultado: event.target.value as AuditLogFilter['resultado'] })}
            >
              <MenuItem value="">Todos</MenuItem>
              {resultOptions.map((result) => (
                <MenuItem key={result} value={result}>
                  {result}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<FilterAltOffRoundedIcon />}
            onClick={onReset}
            disabled={loading}
          >
            Limpiar filtros
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadRoundedIcon />}
            onClick={onExport}
            disabled={loading}
          >
            Exportar CSV
          </Button>
        </Stack>
      </Stack>
    </SectionCard>
  );
}
