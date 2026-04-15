import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getRouteTitle } from '../../components/layout/AppBreadcrumbs';
import { DataColumn, DataTable } from '../../components/shared/DataTable';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionCard } from '../../components/shared/SectionCard';
import { StatusState } from '../../components/shared/StatusState';
import { ApiState } from '../../models/domain';
import { MonitoredCaseListItem } from '../../models/cases';
import { caseService } from '../../services/caseService';

const priorityRank: Record<string, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baja: 3
};

const POLLING_INTERVAL_MS = 15000;
const NEW_CASE_HIGHLIGHT_MS = 45000;
const STATUS_CHANGE_HIGHLIGHT_MS = 30000;

const riskChipStyles: Record<MonitoredCaseListItem['riskLevel'], { bgcolor: string; color: string }> = {
  CRITICO: { bgcolor: '#c62828', color: '#fff' },
  MEDIO: { bgcolor: '#ef6c00', color: '#fff' },
  LEVE: { bgcolor: '#f9a825', color: '#1f2937' },
  NORMAL: { bgcolor: '#2e7d32', color: '#fff' }
};

const badgeChipStyles: Record<MonitoredCaseListItem['reviewBadge'], { bgcolor: string; color: string }> = {
  Sospechoso: { bgcolor: '#fdecea', color: '#b71c1c' },
  'Requiere revision': { bgcolor: '#fff3e0', color: '#e65100' },
  Normal: { bgcolor: '#e8f5e9', color: '#1b5e20' }
};

function formatDate(value: string | null): string {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('es-AR');
}

function formatTime(value: string | null): string {
  if (!value) {
    return 'Sin actualizacion';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function sortCases(items: MonitoredCaseListItem[]): MonitoredCaseListItem[] {
  return [...items].sort((left, right) => {
    const leftPriority = priorityRank[left.priority.trim().toLowerCase()] ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = priorityRank[right.priority.trim().toLowerCase()] ?? Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftDate = left.claimDate ? new Date(left.claimDate).getTime() : 0;
    const rightDate = right.claimDate ? new Date(right.claimDate).getTime() : 0;
    return rightDate - leftDate;
  });
}

function buildCaseKey(item: MonitoredCaseListItem): string {
  return `${item.caseId}-${item.sinId}`;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function matchesDateRange(itemDate: string | null, fromDate: string, toDate: string): boolean {
  if (!fromDate && !toDate) {
    return true;
  }

  if (!itemDate) {
    return false;
  }

  const date = new Date(itemDate);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const itemTime = date.getTime();
  const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
  const toTime = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

  if (fromTime !== null && itemTime < fromTime) {
    return false;
  }

  if (toTime !== null && itemTime > toTime) {
    return false;
  }

  return true;
}

export function CaseInboxPage(): JSX.Element {
  const navigate = useNavigate();
  const [state, setState] = useState<ApiState<MonitoredCaseListItem[]>>({
    status: 'loading',
    data: null,
    error: null
  });
  const [newCaseIds, setNewCaseIds] = useState<string[]>([]);
  const [changedCaseIds, setChangedCaseIds] = useState<string[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const latestRowsRef = useRef<MonitoredCaseListItem[]>([]);

  useEffect(() => {
    let active = true;
    document.title = getRouteTitle('/cases');

    const registerHighlights = (
      ids: string[],
      setter: React.Dispatch<React.SetStateAction<string[]>>,
      ttlMs: number
    ): void => {
      if (ids.length === 0) {
        return;
      }

      setter((current) => Array.from(new Set([...current, ...ids])));
      window.setTimeout(() => {
        setter((current) => current.filter((item) => !ids.includes(item)));
      }, ttlMs);
    };

    const load = async (mode: 'initial' | 'poll' = 'initial'): Promise<void> => {
      if (mode === 'initial') {
        setState({
          status: 'loading',
          data: null,
          error: null
        });
      }

      const response = await caseService.getMonitoredCases();
      if (!active) {
        return;
      }

      if (response.status === 'success' && response.data) {
        const sortedItems = sortCases(response.data);
        const previousMap = new Map(latestRowsRef.current.map((item) => [buildCaseKey(item), item]));

        if (latestRowsRef.current.length > 0) {
          const addedKeys = sortedItems
            .map((item) => buildCaseKey(item))
            .filter((key) => !previousMap.has(key));

          const changedStatusKeys = sortedItems
            .filter((item) => {
              const previous = previousMap.get(buildCaseKey(item));
              return previous !== undefined && previous.caseStatus !== item.caseStatus;
            })
            .map((item) => buildCaseKey(item));

          registerHighlights(addedKeys, setNewCaseIds, NEW_CASE_HIGHLIGHT_MS);
          registerHighlights(changedStatusKeys, setChangedCaseIds, STATUS_CHANGE_HIGHLIGHT_MS);
        }

        latestRowsRef.current = sortedItems;
        setLastUpdatedAt(new Date().toISOString());
        setState({
          status: sortedItems.length === 0 ? 'empty' : 'success',
          data: sortedItems,
          error: null
        });
        return;
      }

      if (mode === 'initial') {
        setState(response);
        return;
      }

      if (response.error) {
        setState((current) => ({
          ...current,
          error: response.error
        }));
      }
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load('poll');
    }, POLLING_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const newCaseIdSet = useMemo(() => new Set(newCaseIds), [newCaseIds]);
  const changedCaseIdSet = useMemo(() => new Set(changedCaseIds), [changedCaseIds]);

  const availableStatuses = useMemo(() => {
    const items = state.data ?? [];
    return Array.from(new Set(items.map((item) => item.caseStatus))).sort((left, right) =>
      left.localeCompare(right, 'es', { sensitivity: 'base' })
    );
  }, [state.data]);

  const filteredCases = useMemo(() => {
    const items = state.data ?? [];
    const normalizedSearch = normalizeText(searchTerm);

    return items.filter((item) => {
      const matchesRisk = riskFilter === 'all' || item.riskLevel === riskFilter;
      const matchesStatus = statusFilter === 'all' || item.caseStatus === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizeText(item.customerName).includes(normalizedSearch) ||
        normalizeText(item.claimNumber).includes(normalizedSearch);
      const matchesDates = matchesDateRange(item.claimDate, fromDate, toDate);

      return matchesRisk && matchesStatus && matchesSearch && matchesDates;
    });
  }, [fromDate, riskFilter, searchTerm, state.data, statusFilter, toDate]);

  const paginatedCases = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredCases.slice(start, start + rowsPerPage);
  }, [filteredCases, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [riskFilter, statusFilter, fromDate, toDate, searchTerm]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredCases.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredCases.length, page, rowsPerPage]);

  const handleResetFilters = (): void => {
    setRiskFilter('all');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setPage(0);
  };

  const reloadCases = async (): Promise<void> => {
    const response = await caseService.getMonitoredCases();
    if (response.status !== 'success' || !response.data) {
      setState(response);
      return;
    }

    const sortedItems = sortCases(response.data);
    latestRowsRef.current = sortedItems;
    setLastUpdatedAt(new Date().toISOString());
    setState({
      status: sortedItems.length === 0 ? 'empty' : 'success',
      data: sortedItems,
      error: null
    });
  };

  const handleDecision = async (
    event: MouseEvent<HTMLButtonElement>,
    row: MonitoredCaseListItem,
    action: 'accept' | 'deny' | 'review'
  ): Promise<void> => {
    event.stopPropagation();
    setActionError(null);
    setActiveActionKey(`${buildCaseKey(row)}-${action}`);

    const result = await caseService.decideCase(row.sinId, {
      action,
      comment: ''
    });

    if (result.status !== 'success') {
      setActionError(result.error ?? 'No se pudo registrar la decision operativa.');
      setActiveActionKey(null);
      return;
    }

    await reloadCases();
    setActiveActionKey(null);
  };

  const columns: Array<DataColumn<MonitoredCaseListItem>> = [
    { key: 'claimNumber', label: 'Nro siniestro' },
    { key: 'customerName', label: 'Cliente' },
    {
      key: 'claimDate',
      label: 'Fecha siniestro',
      render: (row) => formatDate(row.claimDate)
    },
    {
      key: 'score',
      label: 'Score',
      align: 'right',
      render: (row) => (row.isPendingAnalysis ? 'Pend.' : row.score.toFixed(0))
    },
    {
      key: 'riskLevel',
      label: 'Nivel riesgo',
      render: (row) =>
        row.isPendingAnalysis ? (
          <Chip size="small" label="SIN ANALIZAR" variant="outlined" />
        ) : (
          <Chip size="small" label={row.riskLevel} sx={riskChipStyles[row.riskLevel]} />
        )
    },
    {
      key: 'reviewBadge',
      label: 'Clasificacion',
      render: (row) =>
        row.isPendingAnalysis ? (
          <Chip size="small" label="Pendiente" color="default" />
        ) : (
          <Chip size="small" label={row.reviewBadge} sx={badgeChipStyles[row.reviewBadge]} />
        )
    },
    { key: 'priority', label: 'Prioridad' },
    {
      key: 'caseStatus',
      label: 'Estado caso',
      render: (row) => {
        const rowKey = buildCaseKey(row);

        return (
          <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
            <Typography variant="body2">{row.caseStatus}</Typography>
            {row.isPendingAnalysis ? <Chip size="small" variant="outlined" label="Pendiente de analisis" /> : null}
            {newCaseIdSet.has(rowKey) ? <Chip size="small" color="primary" label="Nuevo" /> : null}
            {changedCaseIdSet.has(rowKey) ? <Chip size="small" color="warning" label="Actualizado" /> : null}
          </Stack>
        );
      }
    },
    {
      key: 'quickView',
      label: 'Vista rapida',
      render: (row) => (
        <Stack spacing={0.75} sx={{ maxWidth: 360 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2
            }}
          >
            {row.summaryPreview}
          </Typography>
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            {row.topAlerts.length === 0 ? (
              <Chip size="small" variant="outlined" label="Sin alertas destacadas" />
            ) : (
              row.topAlerts.map((alert) => <Chip key={alert} size="small" variant="outlined" label={alert} />)
            )}
          </Stack>
          <Tooltip
            placement="top-start"
            title={
              <Box sx={{ py: 0.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Alertas completas
                </Typography>
                <Stack spacing={0.5}>
                  {(row.allAlerts.length === 0 ? ['Sin alertas registradas'] : row.allAlerts).map((alert) => (
                    <Typography key={alert} variant="body2">
                      {alert}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            }
          >
            <Typography variant="caption" color="text.secondary" sx={{ width: 'fit-content' }}>
              {row.suggestedAction}
            </Typography>
          </Tooltip>
        </Stack>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <Button
            size="small"
            variant="contained"
            color="success"
            disabled={activeActionKey !== null}
            onClick={(event) => void handleDecision(event, row, 'accept')}
          >
            {activeActionKey === `${buildCaseKey(row)}-accept` ? 'Aceptando...' : 'Aceptar'}
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            disabled={activeActionKey !== null}
            onClick={(event) => void handleDecision(event, row, 'deny')}
          >
            {activeActionKey === `${buildCaseKey(row)}-deny` ? 'Denegando...' : 'Denegar'}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            disabled={activeActionKey !== null}
            onClick={(event) => void handleDecision(event, row, 'review')}
          >
            {activeActionKey === `${buildCaseKey(row)}-review` ? 'Enviando...' : 'Revisar'}
          </Button>
        </Stack>
      )
    }
  ];

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Bandeja de Casos Antifraude"
        subtitle="Cola operativa de siniestros pendientes de analisis o con seguimiento abierto, con acciones directas de aceptar, denegar o revisar."
      />

      {state.status !== 'success' || !state.data ? (
        <StatusState
          status={state.status}
          title={state.status === 'empty' ? 'Sin casos monitoreados' : undefined}
          message={
            state.error ??
            'Todavia no hay casos persistidos en la bandeja operativa o el backend no devolvio resultados.'
          }
        />
      ) : (
        <SectionCard
          title="Casos monitoreados"
          subtitle="La bandeja combina siniestros pendientes de analisis con casos operativos aun no cerrados."
        >
          <Stack spacing={2}>
            {actionError ? <Alert severity="error">{actionError}</Alert> : null}
            <Alert severity="info">
              <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }}>
                <Typography fontWeight={700}>Actualizacion automatica activa</Typography>
                <Typography>Polling cada {Math.round(POLLING_INTERVAL_MS / 1000)} segundos</Typography>
                <Typography>Ultima actualizacion: {formatTime(lastUpdatedAt)}</Typography>
                {newCaseIds.length > 0 ? <Chip size="small" color="primary" label={`${newCaseIds.length} nuevos`} /> : null}
                {changedCaseIds.length > 0 ? (
                  <Chip size="small" color="warning" label={`${changedCaseIds.length} con cambios`} />
                ) : null}
              </Stack>
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buscar cliente o nro siniestro"
                  placeholder="Ej. Perez o 123456"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Nivel riesgo"
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="CRITICO">Critico</MenuItem>
                  <MenuItem value="MEDIO">Medio</MenuItem>
                  <MenuItem value="LEVE">Leve</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {availableStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha desde"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha hasta"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={1.5}>
              <Stack direction="row" gap={1} flexWrap="wrap">
                <Chip size="small" variant="outlined" label={`${filteredCases.length} casos visibles`} />
                <Chip size="small" variant="outlined" label={`${state.data.length} casos totales`} />
              </Stack>
              <Button variant="text" onClick={handleResetFilters}>
                Limpiar filtros
              </Button>
            </Stack>

            {filteredCases.length === 0 ? (
              <StatusState
                status="empty"
                title="Sin resultados"
                message="No hay casos que coincidan con los filtros y busqueda actuales."
              />
            ) : (
              <>
                <DataTable
                  columns={columns}
                  rows={paginatedCases}
                  getRowKey={(row) => buildCaseKey(row)}
                  isRowClickable={(row) => row.isPersisted}
                  getRowStyle={(row) => {
                    const rowKey = buildCaseKey(row);

                    if (newCaseIdSet.has(rowKey)) {
                      return {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                      };
                    }

                    if (changedCaseIdSet.has(rowKey)) {
                      return {
                        backgroundColor: 'rgba(245, 124, 0, 0.10)'
                      };
                    }

                    return undefined;
                  }}
                  onRowClick={(row) => navigate(`/cases/${row.caseId}`)}
                />

                <TablePagination
                  component="div"
                  count={filteredCases.length}
                  page={page}
                  onPageChange={(_event, nextPage) => setPage(nextPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setRowsPerPage(Number(event.target.value));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50]}
                  labelRowsPerPage="Filas por pagina"
                />
              </>
            )}
          </Stack>
        </SectionCard>
      )}
    </Stack>
  );
}
