import { Stack } from '@mui/material';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionCard } from '../../components/shared/SectionCard';
import { DataColumn, DataTable } from '../../components/shared/DataTable';
import { ersDataService } from '../../services/ersDataService';

const columns: DataColumn[] = [
  { key: 'timestamp', label: 'Fecha' },
  { key: 'actor', label: 'Usuario' },
  { key: 'role', label: 'Rol' },
  { key: 'action', label: 'Accion' },
  { key: 'entity', label: 'Entidad' },
  { key: 'result', label: 'Resultado' },
  { key: 'ip', label: 'IP' }
];

export function AdminLogsPage(): JSX.Element {
  const rows = ersDataService.getLogs().map((log) => ({
    timestamp: log.timestamp,
    actor: log.actor,
    role: log.role,
    action: log.action,
    entity: log.entity,
    result: log.result,
    ip: log.ip
  }));

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Logs operativos"
        subtitle="Trazabilidad de accesos, consultas, cambios administrativos y exportaciones."
      />
      <SectionCard title="Auditoria reciente" subtitle="Eventos mock en memoria">
        <DataTable columns={columns} rows={rows} />
      </SectionCard>
    </Stack>
  );
}
