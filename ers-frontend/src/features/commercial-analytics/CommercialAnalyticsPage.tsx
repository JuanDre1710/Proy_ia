import { type Dispatch, type RefObject, type SetStateAction, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import SellRoundedIcon from '@mui/icons-material/SellRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import { DataColumn, DataTable } from '../../components/shared/DataTable';
import { KpiCard } from '../../components/shared/KpiCard';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionCard } from '../../components/shared/SectionCard';
import { StatusState } from '../../components/shared/StatusState';
import {
  CommercialClientDetail,
  CommercialClientWithoutPolicy,
  CommercialFilters,
  CommercialListQuery,
  CommercialPagedResult,
  CommercialProductDetail,
  CommercialQuotedNotBoughtClient,
  CommercialSummaryData,
  CommercialTopProduct
} from '../../models/commercialAnalytics';
import { ApiState } from '../../models/domain';
import { commercialAnalyticsService } from '../../services/commercialAnalyticsService';

const DEFAULT_FILTERS: CommercialFilters = {
  startDate: '',
  endDate: '',
  branchId: '',
  channelId: '',
  productId: '',
  planId: '',
  sellerId: ''
};

const DEFAULT_TOP_PRODUCTS_QUERY: CommercialListQuery = {
  take: 8,
  offset: 0,
  sortBy: 'policiesSold',
  sortDirection: 'desc'
};

const DEFAULT_CLIENTS_QUERY: CommercialListQuery = {
  take: 10,
  offset: 0,
  sortBy: 'clientId',
  sortDirection: 'asc'
};

const DEFAULT_QUOTES_QUERY: CommercialListQuery = {
  take: 10,
  offset: 0,
  sortBy: 'quoteDate',
  sortDirection: 'desc'
};

function normalizeNumericInput(value: string): string {
  return value.replace(/\D/g, '');
}

type TableChartSeries = {
  label: string;
  value: number;
};

type TableChartType = 'bars-horizontal' | 'bars-vertical' | 'funnel';

type TableChartConfig = {
  title: string;
  subtitle: string;
  series: TableChartSeries[];
  valueLabel: string;
  type: TableChartType;
  note?: string;
};

export function CommercialAnalyticsPage(): JSX.Element {
  const topProductsSectionRef = useRef<HTMLDivElement | null>(null);
  const policyStatusSectionRef = useRef<HTMLDivElement | null>(null);
  const clientsSectionRef = useRef<HTMLDivElement | null>(null);
  const quotesSectionRef = useRef<HTMLDivElement | null>(null);
  const [draftFilters, setDraftFilters] = useState<CommercialFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<CommercialFilters>(DEFAULT_FILTERS);
  const [summaryState, setSummaryState] = useState<ApiState<CommercialSummaryData>>({ status: 'loading', data: null, error: null });
  const [topProductsState, setTopProductsState] = useState<ApiState<CommercialPagedResult<CommercialTopProduct>>>({ status: 'loading', data: null, error: null });
  const [clientsState, setClientsState] = useState<ApiState<CommercialPagedResult<CommercialClientWithoutPolicy>>>({ status: 'loading', data: null, error: null });
  const [quotesState, setQuotesState] = useState<ApiState<CommercialPagedResult<CommercialQuotedNotBoughtClient>>>({ status: 'loading', data: null, error: null });
  const [topProductsQuery, setTopProductsQuery] = useState<CommercialListQuery>(DEFAULT_TOP_PRODUCTS_QUERY);
  const [clientsQuery, setClientsQuery] = useState<CommercialListQuery>(DEFAULT_CLIENTS_QUERY);
  const [quotesQuery, setQuotesQuery] = useState<CommercialListQuery>(DEFAULT_QUOTES_QUERY);
  const [productDetailState, setProductDetailState] = useState<ApiState<CommercialProductDetail>>({ status: 'idle', data: null, error: null });
  const [clientDetailState, setClientDetailState] = useState<ApiState<CommercialClientDetail>>({ status: 'idle', data: null, error: null });
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [clientDetailOpen, setClientDetailOpen] = useState(false);
  const [tableChartOpen, setTableChartOpen] = useState(false);
  const [tableChartConfig, setTableChartConfig] = useState<TableChartConfig | null>(null);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [listsEnabled, setListsEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      setListsEnabled(false);
      setSummaryState({ status: 'loading', data: null, error: null });
      setTopProductsState({ status: 'loading', data: null, error: null });
      setClientsState({ status: 'loading', data: null, error: null });
      setQuotesState({ status: 'loading', data: null, error: null });
      const summary = await commercialAnalyticsService.getSummary(appliedFilters);
      if (!active) {
        return;
      }
      setSummaryState(summary);
      setListsEnabled(true);
    };

    void load();

    return () => {
      active = false;
    };
  }, [appliedFilters]);

  useEffect(() => {
    if (!listsEnabled) {
      return;
    }

    let active = true;

    const load = async (): Promise<void> => {
      setTopProductsState({ status: 'loading', data: null, error: null });
      const topProducts = await commercialAnalyticsService.getTopProducts(appliedFilters, topProductsQuery);
      if (!active) {
        return;
      }
      setTopProductsState(topProducts);
    };

    void load();

    return () => {
      active = false;
    };
  }, [appliedFilters, topProductsQuery, listsEnabled]);

  useEffect(() => {
    if (!listsEnabled) {
      return;
    }

    let active = true;

    const load = async (): Promise<void> => {
      setClientsState({ status: 'loading', data: null, error: null });
      const clients = await commercialAnalyticsService.getClientsWithoutPolicies(appliedFilters, clientsQuery);
      if (!active) {
        return;
      }
      setClientsState(clients);
    };

    void load();

    return () => {
      active = false;
    };
  }, [appliedFilters, clientsQuery, listsEnabled]);

  useEffect(() => {
    if (!listsEnabled) {
      return;
    }

    let active = true;

    const load = async (): Promise<void> => {
      setQuotesState({ status: 'loading', data: null, error: null });
      const quotes = await commercialAnalyticsService.getQuotedNotBought(appliedFilters, quotesQuery);
      if (!active) {
        return;
      }
      setQuotesState(quotes);
    };

    void load();

    return () => {
      active = false;
    };
  }, [appliedFilters, quotesQuery, listsEnabled]);

  const handleFilterChange = (key: keyof CommercialFilters, value: string): void => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const handleApplyFilters = (): void => {
    setAppliedFilters(draftFilters);
    setTopProductsQuery((current) => ({ ...current, offset: 0 }));
    setClientsQuery((current) => ({ ...current, offset: 0 }));
    setQuotesQuery((current) => ({ ...current, offset: 0 }));
  };

  const handleResetFilters = (): void => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setTopProductsQuery(DEFAULT_TOP_PRODUCTS_QUERY);
    setClientsQuery(DEFAULT_CLIENTS_QUERY);
    setQuotesQuery(DEFAULT_QUOTES_QUERY);
  };

  const summary = summaryState.data;
  const topProducts = topProductsState.data;
  const clients = clientsState.data;
  const quotes = quotesState.data;

  const topProductColumns: Array<DataColumn<CommercialTopProduct>> = [
    { key: 'name', label: 'Producto' },
    { key: 'policiesSold', label: 'Polizas', align: 'right', render: (row) => commercialAnalyticsService.formatInteger(row.policiesSold) },
    { key: 'uniqueClients', label: 'Clientes', align: 'right', render: (row) => commercialAnalyticsService.formatInteger(row.uniqueClients) },
    { key: 'totalPremium', label: 'Premio total', align: 'right', render: (row) => commercialAnalyticsService.formatCurrency(row.totalPremium) },
    { key: 'lastPolicyDate', label: 'Ultima emision', render: (row) => row.lastPolicyDate ?? 'Sin fecha' }
  ];

  const clientsColumns: Array<DataColumn<CommercialClientWithoutPolicy>> = [
    { key: 'displayName', label: 'Cliente' },
    { key: 'documentNumber', label: 'Documento' },
    { key: 'email', label: 'Email' },
    {
      key: 'hasQuotes',
      label: 'Cotizaciones',
      render: (row) => <Chip size="small" label={row.hasQuotes ? 'Cotizo' : 'Sin cotizacion'} color={row.hasQuotes ? 'warning' : 'default'} variant={row.hasQuotes ? 'filled' : 'outlined'} />
    },
    { key: 'lastQuoteDate', label: 'Ultima cotizacion', render: (row) => row.lastQuoteDate ?? 'Sin fecha' }
  ];

  const quotesColumns: Array<DataColumn<CommercialQuotedNotBoughtClient>> = [
    { key: 'displayName', label: 'Cliente' },
    { key: 'documentNumber', label: 'Documento' },
    { key: 'email', label: 'Email' },
    { key: 'quoteId', label: 'Cotizacion', render: (row) => `#${row.quoteId}` },
    { key: 'quoteDate', label: 'Fecha cotizacion' },
    { key: 'productTypeDescription', label: 'Tipo cotizado' }
  ];

  const handleOpenProductDetail = async (row: CommercialTopProduct): Promise<void> => {
    setProductDetailOpen(true);
    setProductDetailState({ status: 'loading', data: null, error: null });
    const response = await commercialAnalyticsService.getProductDetail(row.id, appliedFilters);
    setProductDetailState(response);
  };

  const handleOpenClientDetail = async (clientId: number): Promise<void> => {
    setClientDetailOpen(true);
    setClientDetailState({ status: 'loading', data: null, error: null });
    const response = await commercialAnalyticsService.getClientDetail(clientId);
    setClientDetailState(response);
  };

  const handleExport = async (kind: 'summary' | 'clients-without-policies' | 'quoted-not-bought'): Promise<void> => {
    setExportMessage(null);
    const response = await commercialAnalyticsService.exportCsv(kind, appliedFilters);
    setExportMessage(
      response.status === 'success'
        ? { type: 'success', text: `Exportacion generada: ${response.data}` }
        : { type: 'error', text: response.error ?? 'No se pudo exportar la informacion comercial.' }
    );
  };

  const scrollToSection = (sectionRef: RefObject<HTMLDivElement | null>): void => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openTableChart = (config: TableChartConfig): void => {
    setTableChartConfig(config);
    setTableChartOpen(true);
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Analitica Comercial"
        subtitle="Vista comercial operativa con filtros server-side, listados accionables y drill-down puntual."
        actions={
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1}>
            <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => void handleExport('summary')} disabled={summaryState.status !== 'success'}>
              Exportar resumen
            </Button>
            <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => void handleExport('clients-without-policies')} disabled={clientsState.status === 'loading'}>
              Exportar clientes sin poliza
            </Button>
            <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => void handleExport('quoted-not-bought')} disabled={quotesState.status === 'loading'}>
              Exportar cotizaciones caidas
            </Button>
          </Stack>
        }
      />

      {exportMessage ? <Alert severity={exportMessage.type}>{exportMessage.text}</Alert> : null}

      <SectionCard title="Filtros comerciales" subtitle="Se aplican sobre backend real y recalculan metricas y listados.">
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField fullWidth type="date" label="Fecha desde" value={draftFilters.startDate} onChange={(event) => handleFilterChange('startDate', event.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth type="date" label="Fecha hasta" value={draftFilters.endDate} onChange={(event) => handleFilterChange('endDate', event.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth label="Sucursal" placeholder="Id" value={draftFilters.branchId} onChange={(event) => handleFilterChange('branchId', normalizeNumericInput(event.target.value))} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth label="Canal" placeholder="Id" value={draftFilters.channelId} onChange={(event) => handleFilterChange('channelId', normalizeNumericInput(event.target.value))} />
            </Grid>
            <Grid item xs={12} sm={4} md={1.5}>
              <TextField fullWidth label="Producto" placeholder="Id" value={draftFilters.productId} onChange={(event) => handleFilterChange('productId', normalizeNumericInput(event.target.value))} />
            </Grid>
            <Grid item xs={12} sm={4} md={1.5}>
              <TextField fullWidth label="Plan" placeholder="Id" value={draftFilters.planId} onChange={(event) => handleFilterChange('planId', normalizeNumericInput(event.target.value))} />
            </Grid>
            <Grid item xs={12} sm={4} md={1}>
              <TextField fullWidth label="Vendedor" placeholder="Id" value={draftFilters.sellerId} onChange={(event) => handleFilterChange('sellerId', normalizeNumericInput(event.target.value))} />
            </Grid>
          </Grid>

          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} justifyContent="space-between">
            <Stack direction="row" gap={1} flexWrap="wrap">
              {(summary?.unsupportedFilters ?? []).slice(0, 4).map((item) => (
                <Chip key={item} size="small" variant="outlined" label={item} />
              ))}
            </Stack>
            <Stack direction="row" gap={1}>
              <Button variant="contained" onClick={handleApplyFilters}>
                Aplicar filtros
              </Button>
              <Chip size="small" label="Limpiar filtros" onClick={handleResetFilters} onDelete={handleResetFilters} variant="outlined" />
            </Stack>
          </Stack>
        </Stack>
      </SectionCard>

      {summaryState.status !== 'success' || !summary ? (
        <StatusState status={summaryState.status} title={summaryState.status === 'empty' ? 'Sin analitica comercial' : undefined} message={summaryState.error ?? 'No hay datos comerciales visibles para los filtros seleccionados.'} />
      ) : (
        <>
          <Grid container spacing={2}>
            {summary.summaryCards.map((card, index) => {
              const icons = [
                <AssessmentRoundedIcon key="policies" />,
                <CategoryRoundedIcon key="product" />,
                <PersonOffRoundedIcon key="without-policy" />,
                <TrendingDownRoundedIcon key="quotes" />
              ];
              const actions: Array<(() => void) | null> = [
                () => scrollToSection(policyStatusSectionRef),
                summary.topProduct ? () => void handleOpenProductDetail(summary.topProduct!) : () => scrollToSection(topProductsSectionRef),
                () => scrollToSection(clientsSectionRef),
                () => scrollToSection(quotesSectionRef)
              ];
              const onClick = actions[index];

              return (
                <Grid key={card.label} item xs={12} sm={6} xl={3}>
                  <Box
                    onClick={onClick ?? undefined}
                    sx={
                      onClick
                        ? {
                            cursor: 'pointer',
                            borderRadius: 5,
                            transition: 'transform 120ms ease, box-shadow 120ms ease',
                            '&:hover': {
                              transform: 'translateY(-2px)'
                            }
                          }
                        : undefined
                    }
                  >
                    <KpiCard label={card.label} value={card.value} detail={card.detail} icon={icons[index]} />
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} xl={8}>
              <Box ref={topProductsSectionRef}>
              <SectionCard title="Ranking de productos" subtitle="Click en una fila para ver desglose por plan, sucursal, canal y vendedor.">
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} justifyContent="space-between">
                    <Alert severity={summary.topProduct ? 'success' : 'info'} sx={{ flex: 1 }}>
                      Producto lider actual: <strong>{summary.topProduct?.name ?? 'No disponible'}</strong>
                    </Alert>
                    <Stack direction="row" gap={1}>
                      <Button
                        variant="outlined"
                        startIcon={<BarChartRoundedIcon />}
                        disabled={!topProducts || topProducts.items.length === 0}
                        onClick={() =>
                          openTableChart({
                            title: 'Grafico de ranking de productos',
                            subtitle: 'Polizas emitidas por producto en la pagina actual.',
                            valueLabel: 'polizas',
                            type: 'bars-horizontal',
                            series:
                              topProducts?.items.slice(0, 8).map((item) => ({
                                label: item.name,
                                value: item.policiesSold
                              })) ?? []
                          })
                        }
                      >
                        Ver grafico
                      </Button>
                      <TextField select size="small" label="Orden" value={topProductsQuery.sortBy ?? 'policiesSold'} onChange={(event) => setTopProductsQuery((current) => ({ ...current, sortBy: event.target.value, offset: 0 }))} sx={{ minWidth: 160 }}>
                        <MenuItem value="policiesSold">Polizas</MenuItem>
                        <MenuItem value="name">Nombre</MenuItem>
                        <MenuItem value="uniqueClients">Clientes</MenuItem>
                        <MenuItem value="totalPremium">Premio</MenuItem>
                        <MenuItem value="lastPolicyDate">Ultima emision</MenuItem>
                      </TextField>
                      <TextField select size="small" label="Direccion" value={topProductsQuery.sortDirection ?? 'desc'} onChange={(event) => setTopProductsQuery((current) => ({ ...current, sortDirection: event.target.value as 'asc' | 'desc', offset: 0 }))} sx={{ minWidth: 120 }}>
                        <MenuItem value="desc">Desc</MenuItem>
                        <MenuItem value="asc">Asc</MenuItem>
                      </TextField>
                    </Stack>
                  </Stack>

                  {topProductsState.status !== 'success' || !topProducts ? (
                    <StatusState status={topProductsState.status} title="Sin ranking" message={topProductsState.error ?? 'No hay ranking para mostrar.'} />
                  ) : (
                    <DataTable columns={topProductColumns} rows={topProducts.items} getRowKey={(row) => String(row.id)} onRowClick={(row) => void handleOpenProductDetail(row)} />
                  )}
                </Stack>
              </SectionCard>
              </Box>
            </Grid>

            <Grid item xs={12} xl={4}>
              <Box ref={policyStatusSectionRef}>
              <SectionCard title="Estados de poliza" subtitle="Distribucion operativa de `PZA_ESTADO` para el recorte actual.">
                <Stack spacing={1.25}>
                  {summary.policyStatusBreakdown.length === 0 ? (
                    <Typography color="text.secondary">Sin estados para mostrar.</Typography>
                  ) : (
                    summary.policyStatusBreakdown.map((item) => (
                      <Box key={item.status} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 3, bgcolor: 'rgba(227,237,247,0.7)' }}>
                        <Typography fontWeight={600}>Estado {item.status}</Typography>
                        <Chip size="small" color="primary" label={commercialAnalyticsService.formatInteger(item.count)} />
                      </Box>
                    ))
                  )}
                </Stack>
              </SectionCard>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box ref={clientsSectionRef}>
              <SectionCard title="Clientes sin poliza" subtitle="Click en una fila para abrir el detalle resumido del cliente.">
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} justifyContent="space-between">
                    <Stack direction="row" gap={1}>
                      <Button
                        variant="outlined"
                        startIcon={<BarChartRoundedIcon />}
                        disabled={!clients || clients.items.length === 0}
                        onClick={() =>
                          openTableChart({
                            title: 'Grafico de clientes sin poliza',
                            subtitle: 'Distribucion de clientes con y sin cotizacion en la pagina actual.',
                            valueLabel: 'clientes',
                            type: 'bars-vertical',
                            series: clients
                              ? [
                                  {
                                    label: 'Cotizo',
                                    value: clients.items.filter((item) => item.hasQuotes).length
                                  },
                                  {
                                    label: 'Sin cotizacion',
                                    value: clients.items.filter((item) => !item.hasQuotes).length
                                  }
                                ]
                              : []
                          })
                        }
                      >
                        Ver grafico
                      </Button>
                      <TextField select size="small" label="Orden" value={clientsQuery.sortBy ?? 'clientId'} onChange={(event) => setClientsQuery((current) => ({ ...current, sortBy: event.target.value, offset: 0 }))} sx={{ minWidth: 170 }}>
                        <MenuItem value="clientId">Id cliente</MenuItem>
                        <MenuItem value="displayName">Cliente</MenuItem>
                        <MenuItem value="lastQuoteDate">Ultima cotizacion</MenuItem>
                        <MenuItem value="hasQuotes">Cotizaciones</MenuItem>
                      </TextField>
                      <TextField select size="small" label="Direccion" value={clientsQuery.sortDirection ?? 'asc'} onChange={(event) => setClientsQuery((current) => ({ ...current, sortDirection: event.target.value as 'asc' | 'desc', offset: 0 }))} sx={{ minWidth: 120 }}>
                        <MenuItem value="asc">Asc</MenuItem>
                        <MenuItem value="desc">Desc</MenuItem>
                      </TextField>
                    </Stack>
                  </Stack>

                  {clientsState.status !== 'success' || !clients ? (
                    <StatusState status={clientsState.status} title="Sin clientes" message={clientsState.error ?? 'No hay clientes sin poliza para mostrar.'} />
                  ) : (
                    <>
                      <DataTable columns={clientsColumns} rows={clients.items} getRowKey={(row) => String(row.clientId)} onRowClick={(row) => void handleOpenClientDetail(row.clientId)} />
                      <PaginationInline totalCount={clients.totalCount} query={clientsQuery} onChange={setClientsQuery} />
                    </>
                  )}
                </Stack>
              </SectionCard>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box ref={quotesSectionRef}>
              <SectionCard title="Cotizaron y no compraron" subtitle="Click en una fila para abrir el detalle resumido del cliente.">
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} justifyContent="space-between">
                    <Stack direction="row" gap={1}>
                      <Button
                        variant="outlined"
                        startIcon={<BarChartRoundedIcon />}
                        disabled={!quotes || quotes.items.length === 0}
                        onClick={() =>
                          openTableChart({
                            title: 'Funnel de cotizaciones sin compra',
                            subtitle: 'Embudo visual de concentracion de caidas por tipo de producto cotizado en la pagina actual.',
                            valueLabel: 'cotizaciones',
                            type: 'funnel',
                            note: 'La API actual no expone etapas completas de conversion cotizacion -> emision. Este funnel muestra concentracion de caidas por tipo cotizado, no conversion punta a punta.',
                            series: quotes
                              ? Array.from(
                                  quotes.items.reduce((acc, item) => {
                                    acc.set(item.productTypeDescription, (acc.get(item.productTypeDescription) ?? 0) + 1);
                                    return acc;
                                  }, new Map<string, number>())
                                )
                                  .map(([label, value]) => ({ label, value }))
                                  .sort((a, b) => b.value - a.value)
                                  .slice(0, 8)
                              : []
                          })
                        }
                      >
                        Ver grafico
                      </Button>
                      <TextField select size="small" label="Orden" value={quotesQuery.sortBy ?? 'quoteDate'} onChange={(event) => setQuotesQuery((current) => ({ ...current, sortBy: event.target.value, offset: 0 }))} sx={{ minWidth: 170 }}>
                        <MenuItem value="quoteDate">Fecha</MenuItem>
                        <MenuItem value="displayName">Cliente</MenuItem>
                        <MenuItem value="productType">Tipo cotizado</MenuItem>
                      </TextField>
                      <TextField select size="small" label="Direccion" value={quotesQuery.sortDirection ?? 'desc'} onChange={(event) => setQuotesQuery((current) => ({ ...current, sortDirection: event.target.value as 'asc' | 'desc', offset: 0 }))} sx={{ minWidth: 120 }}>
                        <MenuItem value="desc">Desc</MenuItem>
                        <MenuItem value="asc">Asc</MenuItem>
                      </TextField>
                    </Stack>
                  </Stack>

                  {quotesState.status !== 'success' || !quotes ? (
                    <StatusState status={quotesState.status} title="Sin oportunidades" message={quotesState.error ?? 'No hay cotizaciones sin compra para mostrar.'} />
                  ) : (
                    <>
                      <DataTable columns={quotesColumns} rows={quotes.items} getRowKey={(row) => `${row.clientId}-${row.quoteId}`} onRowClick={(row) => void handleOpenClientDetail(row.clientId)} />
                      <PaginationInline totalCount={quotes.totalCount} query={quotesQuery} onChange={setQuotesQuery} />
                    </>
                  )}
                </Stack>
              </SectionCard>
              </Box>
            </Grid>
          </Grid>

          <SectionCard title="Criterios operativos" subtitle="Reglas de negocio documentadas por el backend.">
            <Stack spacing={1.5}>
              <CriteriaRow icon={<RuleRoundedIcon color="primary" sx={{ mt: 0.25 }} />} title="Polizas vendidas" detail={summary.criteria.policiesSoldRule} />
              <CriteriaRow icon={<SellRoundedIcon color="primary" sx={{ mt: 0.25 }} />} title="Producto comercializado" detail={summary.criteria.productCommercializationRule} />
              <CriteriaRow icon={<PersonOffRoundedIcon color="primary" sx={{ mt: 0.25 }} />} title="Cliente sin poliza" detail={summary.criteria.clientsWithoutPoliciesRule} />
              <CriteriaRow icon={<TrendingDownRoundedIcon color="primary" sx={{ mt: 0.25 }} />} title="Cotizo y no compro" detail={summary.criteria.quotedNotBoughtRule} />
              {summary.criteria.limitations.length > 0 ? (
                <Alert severity="warning">
                  <Stack spacing={0.75}>
                    <Typography fontWeight={700}>Limitaciones documentadas</Typography>
                    {summary.criteria.limitations.map((item) => (
                      <Typography key={item} variant="body2">{item}</Typography>
                    ))}
                  </Stack>
                </Alert>
              ) : null}
            </Stack>
          </SectionCard>
        </>
      )}

      <Dialog open={productDetailOpen} onClose={() => setProductDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Desglose de producto</DialogTitle>
        <DialogContent>
          {productDetailState.status !== 'success' || !productDetailState.data ? (
            <StatusState status={productDetailState.status} message={productDetailState.error ?? 'No se pudo recuperar el detalle del producto.'} />
          ) : (
            <ProductDetailContent detail={productDetailState.data} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={clientDetailOpen} onClose={() => setClientDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de cliente</DialogTitle>
        <DialogContent>
          {clientDetailState.status !== 'success' || !clientDetailState.data ? (
            <StatusState status={clientDetailState.status} message={clientDetailState.error ?? 'No se pudo recuperar el detalle del cliente.'} />
          ) : (
            <ClientDetailContent detail={clientDetailState.data} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={tableChartOpen} onClose={() => setTableChartOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{tableChartConfig?.title ?? 'Grafico'}</DialogTitle>
        <DialogContent>
          {!tableChartConfig ? (
            <StatusState status="empty" message="No hay grafico disponible." />
          ) : (
            <TableChartContent config={tableChartConfig} />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

function PaginationInline({
  totalCount,
  query,
  onChange
}: {
  totalCount: number;
  query: CommercialListQuery;
  onChange: Dispatch<SetStateAction<CommercialListQuery>>;
}): JSX.Element {
  const page = Math.floor(query.offset / query.take);

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={1.5}>
      <Typography variant="body2" color="text.secondary">
        {commercialAnalyticsService.formatInteger(totalCount)} registros
      </Typography>
      <Stack direction="row" gap={1}>
        <Chip size="small" label="Anterior" disabled={query.offset === 0} onClick={() => onChange((current) => ({ ...current, offset: Math.max(0, current.offset - current.take) }))} />
        <Chip size="small" color="primary" label={`Pagina ${page + 1}`} />
        <Chip size="small" label="Siguiente" disabled={query.offset + query.take >= totalCount} onClick={() => onChange((current) => ({ ...current, offset: current.offset + current.take }))} />
      </Stack>
    </Stack>
  );
}

function CriteriaRow({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }): JSX.Element {
  return (
    <Stack direction="row" gap={1} alignItems="flex-start">
      {icon}
      <Box>
        <Typography fontWeight={700}>{title}</Typography>
        <Typography color="text.secondary">{detail}</Typography>
      </Box>
    </Stack>
  );
}

function ProductDetailContent({ detail }: { detail: CommercialProductDetail }): JSX.Element {
  return (
    <Stack spacing={2.5}>
      <Alert severity="info" icon={<InsightsRoundedIcon />}>
        <strong>{detail.productName}</strong> acumula {commercialAnalyticsService.formatInteger(detail.policiesSold)} polizas y {commercialAnalyticsService.formatCurrency(detail.totalPremium)} de premio.
      </Alert>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Planes">
            <Stack spacing={1}>
              {detail.plans.length === 0 ? <Typography color="text.secondary">No hay desglose de planes disponible.</Typography> : detail.plans.map((item) => (
                <MetricRow key={item.planId} title={item.planName} detail={`${commercialAnalyticsService.formatInteger(item.policiesSold)} polizas`} />
              ))}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Sucursales">
            <Stack spacing={1}>
              {detail.branches.length === 0 ? <Typography color="text.secondary">No hay sucursales disponibles para este recorte.</Typography> : detail.branches.map((item) => (
                <MetricRow key={`${item.value}-${item.label}`} title={item.label} detail={`${commercialAnalyticsService.formatInteger(item.policiesSold)} polizas`} />
              ))}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Canales">
            <Stack spacing={1}>
              {detail.channels.length === 0 ? <Typography color="text.secondary">No hay canales disponibles para este recorte.</Typography> : detail.channels.map((item) => (
                <MetricRow key={`${item.value}-${item.label}`} title={item.label} detail={`${commercialAnalyticsService.formatInteger(item.policiesSold)} polizas`} />
              ))}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Vendedores">
            <Stack spacing={1}>
              {detail.sellers.length === 0 ? <Typography color="text.secondary">No hay vendedores disponibles o el dato no esta cubierto.</Typography> : detail.sellers.map((item) => (
                <MetricRow key={`${item.value}-${item.label}`} title={item.label} detail={`${commercialAnalyticsService.formatInteger(item.policiesSold)} polizas`} />
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}

function ClientDetailContent({ detail }: { detail: CommercialClientDetail }): JSX.Element {
  return (
    <Stack spacing={2.5}>
      <Alert severity={detail.hasQuotesWithoutPurchase ? 'warning' : 'info'}>
        <strong>{detail.displayName}</strong> | Documento: {detail.documentNumber} | Quotes: {commercialAnalyticsService.formatInteger(detail.totalQuotes)} | Polizas: {commercialAnalyticsService.formatInteger(detail.totalPolicies)}
      </Alert>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Resumen">
            <Stack spacing={1}>
              <MetricRow title="Email" detail={detail.email} />
              <MetricRow title="Ultima cotizacion" detail={detail.lastQuoteDate ?? 'Sin fecha'} />
              <MetricRow title="Ultima poliza" detail={detail.lastPolicyDate ?? 'Sin fecha'} />
              <MetricRow title="Tiene polizas" detail={detail.hasAnyPolicy ? 'Si' : 'No'} />
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Cotizaciones recientes">
            <Stack spacing={1}>
              {detail.recentQuotes.length === 0 ? <Typography color="text.secondary">Sin cotizaciones.</Typography> : detail.recentQuotes.map((item) => (
                <MetricRow key={item.quoteId} title={`#${item.quoteId} - ${item.productTypeDescription}`} detail={item.quoteDate} />
              ))}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12}>
          <SectionCard title="Polizas recientes">
            <Stack spacing={1}>
              {detail.recentPolicies.length === 0 ? <Typography color="text.secondary">Sin polizas registradas.</Typography> : detail.recentPolicies.map((item) => (
                <MetricRow key={item.policyId} title={`${item.productName} / ${item.planName}`} detail={`${item.policyDate ?? 'Sin fecha'} | Estado ${item.policyStatus}`} />
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}

function MetricRow({ title, detail }: { title: string; detail: string }): JSX.Element {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.25, borderRadius: 2.5, bgcolor: 'rgba(227,237,247,0.7)' }}>
      <Typography fontWeight={600}>{title}</Typography>
      <Typography color="text.secondary">{detail}</Typography>
    </Box>
  );
}

function TableChartContent({ config }: { config: TableChartConfig }): JSX.Element {
  const maxValue = Math.max(...config.series.map((item) => item.value), 1);

  return (
    <Stack spacing={2.5}>
      <Alert severity="info">{config.subtitle}</Alert>
      {config.note ? <Alert severity="warning">{config.note}</Alert> : null}
      {config.series.length === 0 ? (
        <Typography color="text.secondary">No hay datos suficientes para graficar.</Typography>
      ) : config.type === 'bars-horizontal' ? (
        <HorizontalBarChart series={config.series} maxValue={maxValue} valueLabel={config.valueLabel} />
      ) : config.type === 'bars-vertical' ? (
        <VerticalBarChart series={config.series} maxValue={maxValue} valueLabel={config.valueLabel} />
      ) : (
        <FunnelChart series={config.series} maxValue={maxValue} valueLabel={config.valueLabel} />
      )}
    </Stack>
  );
}

function HorizontalBarChart({
  series,
  maxValue,
  valueLabel
}: {
  series: TableChartSeries[];
  maxValue: number;
  valueLabel: string;
}): JSX.Element {
  return (
    <Stack spacing={1.25}>
      {series.map((item) => {
        const width = `${Math.max((item.value / maxValue) * 100, 6)}%`;

        return (
          <Box key={item.label}>
            <Stack direction="row" justifyContent="space-between" gap={2} sx={{ mb: 0.75 }}>
              <Typography fontWeight={600}>{item.label}</Typography>
              <Typography color="text.secondary">
                {commercialAnalyticsService.formatInteger(item.value)} {valueLabel}
              </Typography>
            </Stack>
            <Box sx={{ height: 14, borderRadius: 999, bgcolor: 'rgba(16, 36, 58, 0.08)', overflow: 'hidden' }}>
              <Box
                sx={{
                  width,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #0d3b66 0%, #0c7b93 100%)'
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

function VerticalBarChart({
  series,
  maxValue,
  valueLabel
}: {
  series: TableChartSeries[];
  maxValue: number;
  valueLabel: string;
}): JSX.Element {
  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, minHeight: 220, pt: 2 }}>
        {series.map((item) => {
          const height = `${Math.max((item.value / maxValue) * 100, 12)}%`;

          return (
            <Stack key={item.label} spacing={1} sx={{ flex: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {commercialAnalyticsService.formatInteger(item.value)}
              </Typography>
              <Box sx={{ width: '100%', height: 160, display: 'flex', alignItems: 'flex-end' }}>
                <Box
                  sx={{
                    width: '100%',
                    height,
                    borderRadius: '16px 16px 6px 6px',
                    background: 'linear-gradient(180deg, #0c7b93 0%, #0d3b66 100%)'
                  }}
                />
              </Box>
              <Typography align="center" fontWeight={600}>
                {item.label}
              </Typography>
            </Stack>
          );
        })}
      </Box>
      <Typography variant="body2" color="text.secondary">
        Valores expresados en {valueLabel}.
      </Typography>
    </Stack>
  );
}

function FunnelChart({
  series,
  maxValue,
  valueLabel
}: {
  series: TableChartSeries[];
  maxValue: number;
  valueLabel: string;
}): JSX.Element {
  return (
    <Stack spacing={1.5}>
      {series.map((item, index) => {
        const width = `${Math.max((item.value / maxValue) * 100, 24)}%`;
        const opacity = Math.max(1 - index * 0.08, 0.45);

        return (
          <Stack key={item.label} spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width,
                minWidth: 160,
                px: 2,
                py: 1.25,
                borderRadius: 3,
                color: '#fff',
                textAlign: 'center',
                background: `linear-gradient(90deg, rgba(13,59,102,${opacity}) 0%, rgba(12,123,147,${opacity}) 100%)`
              }}
            >
              <Typography fontWeight={700}>{item.label}</Typography>
              <Typography variant="body2">
                {commercialAnalyticsService.formatInteger(item.value)} {valueLabel}
              </Typography>
            </Box>
            {index < series.length - 1 ? (
              <Typography color="text.secondary" variant="body2">
                ↓
              </Typography>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
}
