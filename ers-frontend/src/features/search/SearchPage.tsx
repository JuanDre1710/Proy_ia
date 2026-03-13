import { Alert, Chip, Grid, Stack } from '@mui/material';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusState } from '../../components/shared/StatusState';
import { DailyLimitIndicator } from './components/DailyLimitIndicator';
import { RecentSearchesCard } from './components/RecentSearchesCard';
import { SearchForm } from './components/SearchForm';
import { useSearchFlow } from './hooks/useSearchFlow';

export function SearchPage(): JSX.Element {
  const { flow, recentSearches, dailyUsage, validateInput, submitSearch, openRecentSearch } =
    useSearchFlow();

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Busqueda y evaluacion"
        subtitle="Inicia el flujo antifraude ingresando un DNI, CUIL o CUIT. La evaluacion valida formato, consulta fuentes mock y redirige al dashboard del caso cuando aplica."
      />

      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip label="Normal: 20333444556" variant="outlined" />
        <Chip label="Revision: 27123456789" variant="outlined" />
        <Chip label="Sospechoso: 30111222" variant="outlined" />
        <Chip label="Fallecido: 27222333444" variant="outlined" />
        <Chip label="No evaluable: 27999888776" variant="outlined" />
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
                message={flow.error ?? 'Busca un identificador para iniciar la evaluacion del caso.'}
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
