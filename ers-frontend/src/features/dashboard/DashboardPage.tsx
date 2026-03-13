import { useEffect, useState } from 'react';
import { Box, Button, Grid, List, ListItem, Stack, Typography } from '@mui/material';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import CarCrashRoundedIcon from '@mui/icons-material/CarCrashRounded';
import CreditScoreRoundedIcon from '@mui/icons-material/CreditScoreRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import WestRoundedIcon from '@mui/icons-material/WestRounded';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { ExportActions } from '../../components/shared/ExportActions';
import { KpiCard } from '../../components/shared/KpiCard';
import { SectionCard } from '../../components/shared/SectionCard';
import { AlertChips } from '../../components/shared/AlertChips';
import { ScoreGauge } from '../../components/shared/ScoreGauge';
import { RiskHeatmap } from '../../components/shared/RiskHeatmap';
import { RelationshipNetwork } from '../../components/shared/RelationshipNetwork';
import { StatusState } from '../../components/shared/StatusState';
import { DataColumn, DataTable } from '../../components/shared/DataTable';
import { ApiState, RiskEvaluation } from '../../models/domain';
import { ersDataService } from '../../services/ersDataService';
import { exportService } from '../../services/exportService';

const claimColumns: DataColumn[] = [
  { key: 'date', label: 'Fecha' },
  { key: 'type', label: 'Tipo' },
  { key: 'amount', label: 'Monto' },
  { key: 'status', label: 'Estado' },
  { key: 'notes', label: 'Observaciones' }
];

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const { identifier } = useParams<{ identifier: string }>();
  const [evaluationState, setEvaluationState] = useState<ApiState<RiskEvaluation>>({
    status: 'loading',
    data: null,
    error: null
  });

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      if (!identifier) {
        setEvaluationState({
          status: 'error',
          data: null,
          error: 'No se recibio un identificador para abrir el dashboard del caso.'
        });
        return;
      }

      setEvaluationState({ status: 'loading', data: null, error: null });
      await new Promise((resolve) => setTimeout(resolve, 250));

      if (!active) {
        return;
      }

      const evaluation = ersDataService.getEvaluationByIdentifier(identifier);

      if (!evaluation) {
        setEvaluationState({
          status: 'empty',
          data: null,
          error: 'No hay un caso evaluable disponible para ese identificador.'
        });
        return;
      }

      setEvaluationState({
        status: 'success',
        data: evaluation,
        error: null
      });
    };

    void load();

    return () => {
      active = false;
    };
  }, [identifier]);

  const evaluation = evaluationState.data;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Dashboard del caso"
        subtitle="Detalle antifraude consolidado del identificador evaluado."
        actions={
          <Stack direction="row" gap={1.5} flexWrap="wrap">
            <Button variant="outlined" startIcon={<WestRoundedIcon />} onClick={() => navigate('/search')}>
              Volver a busqueda
            </Button>
            {evaluation ? (
              <ExportActions
                onExportCsv={() => exportService.exportCsv(evaluation)}
                onExportPdf={() => exportService.exportPdf(evaluation)}
              />
            ) : null}
          </Stack>
        }
      />

      {!evaluation ? (
        <StatusState status={evaluationState.status} message={evaluationState.error ?? undefined} />
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                label="Score IA"
                value={`${evaluation.score.score}/100`}
                detail={`Nivel ${evaluation.score.level}`}
                icon={<AnalyticsRoundedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                label="Alertas"
                value={`${evaluation.alerts.length}`}
                detail="Senales activas del caso"
                icon={<WarningAmberRoundedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                label="Credit score"
                value={`${evaluation.financial.creditScore}`}
                detail={`Debt ratio ${evaluation.financial.debtRatio}%`}
                icon={<CreditScoreRoundedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                label="Siniestros"
                value={`${evaluation.claims.length}`}
                detail="Historico consolidado"
                icon={<CarCrashRoundedIcon />}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} xl={6}>
              <SectionCard
                title="Identidad y datos verificados"
                subtitle="Renaper, contacto y geografia"
              >
                <Grid container spacing={1.5}>
                  {[
                    ['Nombre', evaluation.person.fullName],
                    ['Identificador', evaluation.person.identifier],
                    ['Fecha de nacimiento', evaluation.person.birthDate],
                    ['Edad', `${evaluation.person.age}`],
                    ['Direccion', evaluation.person.address],
                    ['Provincia', evaluation.person.province],
                    ['Telefono', evaluation.person.phone],
                    ['Email', evaluation.person.email]
                  ].map(([label, value]) => (
                    <Grid key={label} item xs={12} md={6}>
                      <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'rgba(227,237,247,0.7)' }}>
                        <Typography fontWeight={700}>{label}</Typography>
                        <Typography color="text.secondary">{value}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </SectionCard>
            </Grid>
            <Grid item xs={12} xl={6}>
              <SectionCard title="Alertas visuales y score IA" subtitle="Resumen ejecutivo del caso">
                <Stack spacing={2}>
                  <AlertChips alerts={evaluation.alerts} />
                  <ScoreGauge score={evaluation.score} />
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} xl={6}>
              <SectionCard title="Situacion financiera y bancarizacion">
                <List>
                  <ListItem disablePadding>Credit score: {evaluation.financial.creditScore}</ListItem>
                  <ListItem disablePadding>Debt ratio: {evaluation.financial.debtRatio}%</ListItem>
                  <ListItem disablePadding>Bancarizacion: {evaluation.financial.bancarizationLevel}</ListItem>
                  <ListItem disablePadding>Cheques rechazados: {evaluation.financial.bouncedChecks}</ListItem>
                  <ListItem disablePadding>Prestamos activos: {evaluation.financial.activeLoans}</ListItem>
                </List>
                <Typography color="text.secondary">{evaluation.financial.observation}</Typography>
              </SectionCard>
            </Grid>
            <Grid item xs={12} xl={6}>
              <SectionCard title="Actividad laboral / fiscal">
                <List>
                  <ListItem disablePadding>Condicion: {evaluation.employmentFiscal.taxStatus}</ListItem>
                  <ListItem disablePadding>Actividad: {evaluation.employmentFiscal.mainActivity}</ListItem>
                  <ListItem disablePadding>
                    Empleador / razon social: {evaluation.employmentFiscal.employer}
                  </ListItem>
                  <ListItem disablePadding>
                    Ingresos estimados: {evaluation.employmentFiscal.monthlyIncomeRange}
                  </ListItem>
                  {evaluation.employmentFiscal.registeredEmployees ? (
                    <ListItem disablePadding>
                      Empleados registrados: {evaluation.employmentFiscal.registeredEmployees}
                    </ListItem>
                  ) : null}
                </List>
                <Typography color="text.secondary">{evaluation.employmentFiscal.observation}</Typography>
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} xl={6}>
              <SectionCard title="Historial de siniestros" subtitle="Eventos consolidados del titular">
                <DataTable
                  columns={claimColumns}
                  rows={evaluation.claims.map((claim) => ({
                    date: claim.date,
                    type: claim.type,
                    amount: `$${claim.amount.toLocaleString('es-AR')}`,
                    status: claim.status,
                    notes: claim.notes
                  }))}
                />
              </SectionCard>
            </Grid>
            <Grid item xs={12} xl={6}>
              <SectionCard title="Mapa de calor de variables de riesgo">
                <RiskHeatmap cells={evaluation.heatmap} />
              </SectionCard>
            </Grid>
          </Grid>

          <SectionCard title="Red de relaciones sospechosas" subtitle="Nodos y conexiones relevantes">
            <RelationshipNetwork
              nodes={evaluation.relationships.nodes}
              edges={evaluation.relationships.edges}
            />
          </SectionCard>
        </>
      )}
    </Stack>
  );
}
