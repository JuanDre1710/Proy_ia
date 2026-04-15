import { useEffect, useState } from 'react';
import { Button, Grid, Stack } from '@mui/material';
import WestRoundedIcon from '@mui/icons-material/WestRounded';
import { useNavigate, useParams } from 'react-router-dom';
import { getRouteTitle } from '../../components/layout/AppBreadcrumbs';
import { PageHeader } from '../../components/shared/PageHeader';
import { PageSkeleton } from '../../components/shared/PageSkeleton';
import { StatusState } from '../../components/shared/StatusState';
import { ApiState } from '../../models/domain';
import { CaseDecisionAction, CaseEvaluation } from '../../models/cases';
import { caseService } from '../../services/caseService';
import { useAuth } from '../../state/AuthContext';
import { CaseHeaderSummary } from './components/CaseHeaderSummary';
import { CaseStatusBanner } from './components/CaseStatusBanner';
import { ClaimsHistoryCard } from './components/ClaimsHistoryCard';
import { FinancialInfoCard } from './components/FinancialInfoCard';
import { LaborFiscalCard } from './components/LaborFiscalCard';
import { PersonalInfoCard } from './components/PersonalInfoCard';
import { PolicyClaimInfoCard } from './components/PolicyClaimInfoCard';
import { RiskScoreCard } from './components/RiskScoreCard';
import { AlertsPanel } from './components/AlertsPanel';
import { AIExplanationPanel } from './components/AIExplanationPanel';
import { RiskHeatmapCard } from './components/RiskHeatmapCard';
import { RelationshipGraphCard } from './components/RelationshipGraphCard';
import { ExportActionsCard } from './components/ExportActionsCard';
import { CaseDecisionCard } from './components/CaseDecisionCard';

function isDecisionEnabled(caseData: CaseEvaluation): boolean {
  return Boolean(caseData.finalAssessment?.requiresManualReview);
}

export function CaseDashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const { session } = useAuth();
  const [state, setState] = useState<ApiState<CaseEvaluation>>({
    status: 'loading',
    data: null,
    error: null
  });

  useEffect(() => {
    let active = true;

    if (caseId) {
      document.title = getRouteTitle(`/cases/${caseId}`);
    }

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

  const handleDecision = async (action: CaseDecisionAction, comment: string): Promise<void> => {
    if (!caseId || state.status !== 'success' || !state.data) {
      throw new Error('Case not loaded');
    }

    const result = await caseService.decideCase(state.data.sinId ?? caseId, {
      action,
      comment
    });

    if (result.status !== 'success' || !result.data) {
      throw new Error(result.error ?? 'No se pudo resolver el caso.');
    }

    setState({
      status: 'success',
      data: {
        ...state.data,
        resolution: result.data
      },
      error: null
    });
  };

  const handleFinalResolution = async (fraudeConfirmado: boolean, comment: string): Promise<void> => {
    if (!caseId || state.status !== 'success' || !state.data) {
      throw new Error('Case not loaded');
    }

    const result = await caseService.resolveCase(state.data.sinId ?? caseId, {
      fraudeConfirmado,
      comment
    });

    if (result.status !== 'success' || !result.data) {
      throw new Error(result.error ?? 'No se pudo registrar la resolucion final del caso.');
    }

    setState({
      status: 'success',
      data: {
        ...state.data,
        operationalCaseStatus: 'cerrado',
        resolution: result.data
      },
      error: null
    });
  };

  if (state.status === 'loading') {
    return <PageSkeleton sections={4} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Dashboard antifraude del caso"
        subtitle="Vista consolidada del cliente, domicilio, poliza, siniestro, score, alertas y resumen del backend operativo."
        actions={
          <Button variant="outlined" startIcon={<WestRoundedIcon />} onClick={() => navigate('/cases')}>
            Volver a bandeja
          </Button>
        }
      />

      {state.status !== 'success' || !state.data ? (
        <StatusState
          status={state.status}
          title={state.status === 'empty' ? 'Caso no disponible' : undefined}
          message={state.error ?? undefined}
        />
      ) : (
        <>
          <CaseStatusBanner caseData={state.data} />
          <CaseHeaderSummary caseData={state.data} />
          {isDecisionEnabled(state.data) ? (
            <CaseDecisionCard
              caseData={state.data}
              onDecision={handleDecision}
              onFinalResolution={handleFinalResolution}
              currentUser={session.user?.name}
            />
          ) : null}
          <ExportActionsCard evaluation={state.data} />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <PageHeader
                title="Informacion"
                subtitle="Datos del cliente, domicilio, poliza y siniestro reconstruidos desde el backend."
              />
            </Grid>
            <Grid item xs={12} xl={6}>
              <PersonalInfoCard personalInfo={state.data.personalInfo} />
            </Grid>
            <Grid item xs={12} xl={6}>
              {state.data.operationalInfo ? <PolicyClaimInfoCard operationalInfo={state.data.operationalInfo} /> : null}
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <PageHeader
                title="Analisis"
                subtitle="Score, resumen y senales del modelo operativo sobre el caso."
              />
            </Grid>
            <Grid item xs={12} xl={4}>
              <RiskScoreCard caseData={state.data} />
            </Grid>
            <Grid item xs={12} xl={8}>
              <AIExplanationPanel explanation={state.data.aiExplanation} />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <PageHeader
                title="Alertas"
                subtitle="Alertas operativas y antecedentes visibles del expediente."
              />
            </Grid>
            <Grid item xs={12} xl={6}>
              <AlertsPanel alerts={state.data.alerts} />
            </Grid>
            <Grid item xs={12} xl={6}>
              <ClaimsHistoryCard claimsHistory={state.data.claimsHistory} />
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
          {state.data.riskHeatmap.length > 0 ? <RiskHeatmapCard variables={state.data.riskHeatmap} /> : null}
          {state.data.relationshipGraph.nodes.length > 0 || state.data.relationshipGraph.edges.length > 0 ? (
            <RelationshipGraphCard
              nodes={state.data.relationshipGraph.nodes}
              edges={state.data.relationshipGraph.edges}
            />
          ) : null}
        </>
      )}
    </Stack>
  );
}
