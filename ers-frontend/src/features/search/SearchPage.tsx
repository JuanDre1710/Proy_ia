import { useEffect } from 'react';
import { Alert, Chip, Grid, Stack } from '@mui/material';
import { getRouteTitle } from '../../components/layout/AppBreadcrumbs';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusState } from '../../components/shared/StatusState';
import { DailyLimitIndicator } from './components/DailyLimitIndicator';
import { RecentSearchesCard } from './components/RecentSearchesCard';
import { SearchForm } from './components/SearchForm';
import { useSearchFlow } from './hooks/useSearchFlow';

export function SearchPage(): JSX.Element {
  const { flow, recentSearches, dailyUsage, validateInput, submitSearch, openRecentSearch } =
    useSearchFlow();

  useEffect(() => {
    document.title = getRouteTitle('/search');
  }, []);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Busqueda y evaluacion"
        subtitle="Inicia el flujo antifraude ingresando un DNI, CUIL o CUIT. La demo usa fuentes internas, ejecuta reglas, reasoning, scoring y habilita resolucion manual con auditoria."
      />

      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip label="Normal: 27123456789" variant="outlined" />
        <Chip label="Revision: 30111205" variant="outlined" />
        <Chip label="Sospechoso: 30111201" variant="outlined" />
        <Chip label="Datos incompletos: 30111297" variant="outlined" />
        <Chip label="Inconsistencia: 30111277" variant="outlined" />
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} xl={8}>
          <Stack spacing={2}>
            <SearchForm
              isLoading={flow.status === 'loading'}
              onValidate={validateInput}
              onSubmit={submitSearch}
            />
            {flow.response && flow.response.outcome !== 'found' ? (
              <Alert severity={flow.response.outcome === 'not_found' ? 'info' : flow.response.outcome === 'integration_error' ? 'error' : 'warning'}>
                {flow.response.message}
              </Alert>
            ) : null}
            {flow.status !== 'success' ? (
              <StatusState
                status={flow.status}
                title={flow.status === 'idle' ? 'Listo para evaluar un caso' : undefined}
                message={
                  flow.error ??
                  'Busca un identificador valido para iniciar la evaluacion y abrir el dashboard del caso.'
                }
              />
            ) : null}
          </Stack>
        </Grid>
        <Grid item xs={12} xl={4}>
          <Stack spacing={2}>
            <DailyLimitIndicator {...dailyUsage} />
            <RecentSearchesCard searches={recentSearches} onOpen={openRecentSearch} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
