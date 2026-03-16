import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import { Alert, Grid, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { getRouteTitle } from '../../components/layout/AppBreadcrumbs';
import { PageSkeleton } from '../../components/shared/PageSkeleton';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusState } from '../../components/shared/StatusState';
import { AdminPanelData } from '../../models/admin';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../state/AuthContext';
import { ExportSettingsCard } from './components/ExportSettingsCard';
import { AddIntegrationCard } from './components/AddIntegrationCard';
import { AddRuleCard } from './components/AddRuleCard';
import { IntegrationStatusCard } from './components/IntegrationStatusCard';
import { RulesSummaryCard } from './components/RulesSummaryCard';
import { SystemSettingsCard } from './components/SystemSettingsCard';
import { ThresholdConfigCard } from './components/ThresholdConfigCard';

type FeedbackState = Record<
  'thresholds' | 'systemSettings' | 'exportSettings' | 'rules' | 'integrations',
  { type: 'success' | 'error'; message: string } | null
>;

type SavingState = Record<'thresholds' | 'systemSettings' | 'exportSettings' | 'rules' | 'integrations', boolean>;

export function AdminPage(): JSX.Element {
  const { session } = useAuth();
  const [data, setData] = useState<AdminPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<SavingState>({
    thresholds: false,
    systemSettings: false,
    exportSettings: false,
    rules: false,
    integrations: false
  });
  const [feedback, setFeedback] = useState<FeedbackState>({
    thresholds: null,
    systemSettings: null,
    exportSettings: null,
    rules: null,
    integrations: null
  });

  useEffect(() => {
    document.title = getRouteTitle('/admin');

    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await adminService.getAdminPanelData();
        setData(response);
      } catch (_error) {
        setError('No se pudo cargar la configuracion administrativa.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const withSaving = async (
    key: keyof SavingState,
    action: () => Promise<void>
  ): Promise<void> => {
    setSaving((current) => ({ ...current, [key]: true }));
    setFeedback((current) => ({ ...current, [key]: null }));
    try {
      await action();
    } catch (_error) {
      setFeedback((current) => ({
        ...current,
        [key]: { type: 'error', message: 'No se pudieron guardar los cambios.' }
      }));
    } finally {
      setSaving((current) => ({ ...current, [key]: false }));
    }
  };

  if (loading) {
    return <PageSkeleton sections={5} />;
  }

  if (error || !data) {
    return <StatusState status="error" message={error ?? 'No hay datos administrativos disponibles.'} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Panel administrativo"
        subtitle="Configuracion central del sistema ERS con formularios tipados y persistencia mock."
        actions={<AdminPanelSettingsRoundedIcon color="primary" sx={{ fontSize: 36 }} />}
      />
      <Alert severity="info">Acceso exclusivo para usuarios con rol Administrador.</Alert>
      <Grid container spacing={3}>
        <Grid item xs={12} xl={7}>
          <ThresholdConfigCard
            value={data.thresholds}
            loading={saving.thresholds}
            feedback={feedback.thresholds}
            onSave={async (value) => {
              await withSaving('thresholds', async () => {
                const updated = await adminService.saveThresholds(value, session.user);
                setData((current) => (current ? { ...current, thresholds: updated } : current));
                setFeedback((current) => ({
                  ...current,
                  thresholds: { type: 'success', message: 'Umbrales guardados correctamente.' }
                }));
              });
            }}
            onRestore={async () => {
              await withSaving('thresholds', async () => {
                const restored = await adminService.restoreThresholds(session.user);
                setData((current) => (current ? { ...current, thresholds: restored } : current));
                setFeedback((current) => ({
                  ...current,
                  thresholds: { type: 'success', message: 'Umbrales restaurados a valores mock.' }
                }));
              });
            }}
          />
        </Grid>
        <Grid item xs={12} xl={5}>
          <RulesSummaryCard rules={data.activeRules} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <AddRuleCard
            loading={saving.rules}
            feedback={feedback.rules}
            onSubmit={async (value) => {
              await withSaving('rules', async () => {
                const activeRules = await adminService.addRule(value, session.user);
                setData((current) => (current ? { ...current, activeRules } : current));
                setFeedback((current) => ({
                  ...current,
                  rules: { type: 'success', message: 'Regla agregada correctamente.' }
                }));
              });
            }}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <AddIntegrationCard
            loading={saving.integrations}
            feedback={feedback.integrations}
            onSubmit={async (value) => {
              await withSaving('integrations', async () => {
                const integrations = await adminService.addIntegration(value, session.user);
                setData((current) => (current ? { ...current, integrations } : current));
                setFeedback((current) => ({
                  ...current,
                  integrations: { type: 'success', message: 'Integracion externa agregada correctamente.' }
                }));
              });
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <IntegrationStatusCard integrations={data.integrations} loading={loading} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <SystemSettingsCard
            value={data.systemSettings}
            loading={saving.systemSettings}
            feedback={feedback.systemSettings}
            onSave={async (value) => {
              await withSaving('systemSettings', async () => {
                const updated = await adminService.saveSystemSettings(value, session.user);
                setData((current) => (current ? { ...current, systemSettings: updated } : current));
                setFeedback((current) => ({
                  ...current,
                  systemSettings: { type: 'success', message: 'Parametros del sistema actualizados.' }
                }));
              });
            }}
            onRestore={async () => {
              await withSaving('systemSettings', async () => {
                const restored = await adminService.restoreSystemSettings(session.user);
                setData((current) => (current ? { ...current, systemSettings: restored } : current));
                setFeedback((current) => ({
                  ...current,
                  systemSettings: { type: 'success', message: 'Parametros restaurados a valores mock.' }
                }));
              });
            }}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <ExportSettingsCard
            value={data.exportSettings}
            loading={saving.exportSettings}
            feedback={feedback.exportSettings}
            onSave={async (value) => {
              await withSaving('exportSettings', async () => {
                const updated = await adminService.saveExportSettings(value, session.user);
                setData((current) => (current ? { ...current, exportSettings: updated } : current));
                setFeedback((current) => ({
                  ...current,
                  exportSettings: { type: 'success', message: 'Configuracion de exportaciones actualizada.' }
                }));
              });
            }}
            onRestore={async () => {
              await withSaving('exportSettings', async () => {
                const restored = await adminService.restoreExportSettings(session.user);
                setData((current) => (current ? { ...current, exportSettings: restored } : current));
                setFeedback((current) => ({
                  ...current,
                  exportSettings: { type: 'success', message: 'Exportaciones restauradas a valores mock.' }
                }));
              });
            }}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
