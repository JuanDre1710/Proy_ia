import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { Alert, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { getRouteTitle } from '../../components/layout/AppBreadcrumbs';
import { PageSkeleton } from '../../components/shared/PageSkeleton';
import { PageHeader } from '../../components/shared/PageHeader';
import { AuditLogEntry, AuditLogFilter, AuditLogQuery } from '../../models/audit';
import { auditService } from '../../services/auditService';
import { AuditLogDetailDialog } from './components/AuditLogDetailDialog';
import { AuditLogFilters } from './components/AuditLogFilters';
import { AuditLogsTable } from './components/AuditLogsTable';

const defaultFilters: AuditLogFilter = {
  usuario: '',
  rol: '',
  fechaDesde: '',
  fechaHasta: '',
  accion: '',
  resultado: ''
};

export function AuditLogsPage(): JSX.Element {
  const [filters, setFilters] = useState<AuditLogFilter>(defaultFilters);
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<AuditLogQuery['sortBy']>('fechaHora');
  const [sortDirection, setSortDirection] = useState<AuditLogQuery['sortDirection']>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    document.title = getRouteTitle('/audit/logs');
  }, []);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await auditService.getLogs({
          ...filters,
          page,
          pageSize,
          sortBy,
          sortDirection
        });
        setRows(response.rows);
        setTotal(response.total);
      } catch (loadError) {
        setRows([]);
        setTotal(0);
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los logs.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [filters, page, pageSize, sortBy, sortDirection]);

  if (loading && rows.length === 0 && !error) {
    return <PageSkeleton sections={3} />;
  }

  const handleFilterChange = (nextFilters: AuditLogFilter): void => {
    setFilters(nextFilters);
    setPage(0);
  };

  const handleSortChange = (field: AuditLogQuery['sortBy']): void => {
    if (sortBy === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortDirection('asc');
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Auditoria y logs"
        subtitle="Trazabilidad de accesos, consultas, cambios operativos y exportaciones."
        actions={<ReceiptLongRoundedIcon color="primary" sx={{ fontSize: 36 }} />}
      />
      <Alert severity="info">Modulo disponible para Administrador y Supervisor.</Alert>
      <AuditLogFilters
        value={filters}
        loading={loading}
        onChange={handleFilterChange}
        onReset={() => {
          setFilters(defaultFilters);
          setPage(0);
        }}
        onExport={() => auditService.exportCsv(rows)}
      />
      <AuditLogsTable
        rows={rows}
        total={total}
        loading={loading}
        error={error}
        page={page}
        pageSize={pageSize}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(0);
        }}
        onSortChange={handleSortChange}
        onOpenDetail={setSelectedLog}
      />
      <AuditLogDetailDialog
        open={!!selectedLog}
        entry={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </Stack>
  );
}
