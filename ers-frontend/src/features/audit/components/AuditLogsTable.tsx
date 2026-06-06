import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Button,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography
} from '@mui/material';
import { SectionCard } from '../../../components/shared/SectionCard';
import { AuditLogEntry } from '../../../models/audit';

type SortableField = keyof AuditLogEntry;

interface AuditLogsTableProps {
  rows: AuditLogEntry[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  sortBy: SortableField;
  sortDirection: 'asc' | 'desc';
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (field: SortableField) => void;
  onOpenDetail: (entry: AuditLogEntry) => void;
}

const columns: Array<{ field: SortableField; label: string }> = [
  { field: 'fechaHora', label: 'Fecha / hora' },
  { field: 'usuario', label: 'Usuario' },
  { field: 'rol', label: 'Rol' },
  { field: 'accion', label: 'Accion' },
  { field: 'identificadorConsultado', label: 'Identificador' },
  { field: 'resultado', label: 'Resultado' },
  { field: 'ip', label: 'IP' }
];

export function AuditLogsTable({
  rows,
  total,
  loading,
  error,
  page,
  pageSize,
  sortBy,
  sortDirection,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onOpenDetail
}: AuditLogsTableProps): JSX.Element {
  return (
    <SectionCard
      title="Logs de actividad y auditoria"
      subtitle="Consulta paginada con ordenamiento por columna y detalle expandido."
    >
      <Stack spacing={1.5}>
        {loading ? <LinearProgress /> : null}
        {error ? (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 180 }}>
            <Typography variant="h6">Error al cargar logs</Typography>
            <Typography color="text.secondary">{error}</Typography>
          </Stack>
        ) : rows.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 180 }}>
            <Typography variant="h6">Sin resultados</Typography>
            <Typography color="text.secondary">
              No hay eventos que coincidan con los filtros seleccionados.
            </Typography>
          </Stack>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell key={column.field}>
                        <TableSortLabel
                          active={sortBy === column.field}
                          direction={sortBy === column.field ? sortDirection : 'asc'}
                          onClick={() => onSortChange(column.field)}
                        >
                          {column.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell>Detalle</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{new Date(row.fechaHora).toLocaleString()}</TableCell>
                      <TableCell>{row.usuario}</TableCell>
                      <TableCell>{row.rol}</TableCell>
                      <TableCell>{row.accion}</TableCell>
                      <TableCell>{row.identificadorConsultado}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.resultado}
                          color={
                            row.resultado === 'OK'
                              ? 'success'
                              : row.resultado === 'Observado'
                                ? 'warning'
                                : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>{row.ip}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<InfoOutlinedIcon />}
                          onClick={() => onOpenDetail(row)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, nextPage) => onPageChange(nextPage)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </>
        )}
      </Stack>
    </SectionCard>
  );
}
