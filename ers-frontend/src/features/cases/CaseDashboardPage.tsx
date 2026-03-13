import { useEffect, useState } from 'react';
import { Button, Grid, Stack } from '@mui/material';
import WestRoundedIcon from '@mui/icons-material/WestRounded';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusState } from '../../components/shared/StatusState';
import { ApiState } from '../../models/domain';
import { CaseEvaluation } from '../../models/cases';
import { caseService } from '../../services/caseService';
import { CaseHeaderSummary } from './components/CaseHeaderSummary';
import { CaseStatusBanner } from './components/CaseStatusBanner';
import { ClaimsHistoryCard } from './components/ClaimsHistoryCard';
import { FinancialInfoCard } from './components/FinancialInfoCard';
import { LaborFiscalCard } from './components/LaborFiscalCard';
import { PersonalInfoCard } from './components/PersonalInfoCard';
import { RiskScoreCard } from './components/RiskScoreCard';
import { AlertsPanel } from './components/AlertsPanel';
import { AIExplanationPanel } from './components/AIExplanationPanel';

export function CaseDashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const [state, setState] = useState<ApiState<CaseEvaluation>>({
    status: 'loading',
    data: null,
    error: null
  });

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      if (!caseId) {
        setState({
          status: 'error',
          data: null,
          error: 'No se recibio un identificador de caso.'
        });
        return;
      }

      setState({ status: 'loading', data: null, error: null });
      const result = await caseService.getCaseById(caseId);
      if (active) {
        setState(result);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [caseId]);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Dashboard antifraude del caso"
        subtitle="Vista consolidada del cliente, el score de fraude y el estado general del expediente."
        actions={
          <Button variant="outlined" startIcon={<WestRoundedIcon />} onClick={() => navigate('/search')}>
            Volver a busqueda
          </Button>
        }
      />

      {state.status !== 'success' || !state.data ? (
        <StatusState status={state.status} message={state.error ?? undefined} />
      ) : (
        <>
          <CaseStatusBanner caseData={state.data} />
          <CaseHeaderSummary caseData={state.data} />
          <Grid container spacing={2}>
            <Grid item xs={12} xl={4}>
              <RiskScoreCard caseData={state.data} />
            </Grid>
            <Grid item xs={12} xl={8}>
              <PersonalInfoCard personalInfo={state.data.personalInfo} />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} xl={6}>
              <AlertsPanel alerts={state.data.alerts} />
            </Grid>
            <Grid item xs={12} xl={6}>
              <AIExplanationPanel explanation={state.data.aiExplanation} />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} xl={6}>
              <FinancialInfoCard financialInfo={state.data.financialInfo} />
            </Grid>
            <Grid item xs={12} xl={6}>
              <LaborFiscalCard laborFiscalInfo={state.data.laborFiscalInfo} />
            </Grid>
          </Grid>
          <ClaimsHistoryCard claimsHistory={state.data.claimsHistory} />
        </>
      )}
    </Stack>
  );
}
