import {
  adminPanelMock,
  defaultExportSetting,
  defaultRiskThresholdConfig,
  defaultSystemSetting
} from '../mocks/adminMock';
import {
  ActiveRule,
  AdminPanelData,
  ExportSetting,
  IntegrationStatus,
  RiskThresholdConfig,
  SystemSetting
} from '../models/admin';
import { User } from '../models/auth';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function withAudit<T extends { updatedAt: string; updatedBy: string }>(value: T, actor: User | null): T {
  return {
    ...value,
    updatedAt: new Date().toISOString(),
    updatedBy: actor?.name ?? 'Sistema'
  };
}

let adminState: AdminPanelData = clone(adminPanelMock);

export const adminService = {
  async getAdminPanelData(): Promise<AdminPanelData> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return clone(adminState);
  },
  async saveThresholds(
    payload: Omit<RiskThresholdConfig, 'updatedAt' | 'updatedBy'>,
    actor: User | null
  ): Promise<RiskThresholdConfig> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    adminState = {
      ...adminState,
      thresholds: withAudit({ ...payload, updatedAt: '', updatedBy: '' }, actor)
    };
    return clone(adminState.thresholds);
  },
  async restoreThresholds(actor: User | null): Promise<RiskThresholdConfig> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    adminState = {
      ...adminState,
      thresholds: withAudit(clone(defaultRiskThresholdConfig), actor)
    };
    return clone(adminState.thresholds);
  },
  async addRule(
    payload: Omit<ActiveRule, 'id' | 'lastUpdatedAt'>,
    actor: User | null
  ): Promise<ActiveRule[]> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const rule: ActiveRule = {
      ...payload,
      id: `RULE-${String(adminState.activeRules.length + 1).padStart(2, '0')}`,
      lastUpdatedAt: new Date().toISOString(),
      source: payload.source || actor?.name || 'Administrador'
    };
    adminState = {
      ...adminState,
      activeRules: [rule, ...adminState.activeRules]
    };
    return clone(adminState.activeRules);
  },
  async addIntegration(
    payload: Omit<IntegrationStatus, 'id' | 'lastSyncAt' | 'latencyMs'>,
    _actor: User | null
  ): Promise<IntegrationStatus[]> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const integration: IntegrationStatus = {
      ...payload,
      id: `INT-${sanitizeId(payload.name)}`,
      latencyMs: payload.status === 'Operativa' ? 250 : payload.status === 'Degradada' ? 850 : 0,
      lastSyncAt: new Date().toISOString()
    };
    adminState = {
      ...adminState,
      integrations: [integration, ...adminState.integrations]
    };
    return clone(adminState.integrations);
  },
  async saveSystemSettings(
    payload: Omit<SystemSetting, 'updatedAt' | 'updatedBy'>,
    actor: User | null
  ): Promise<SystemSetting> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    adminState = {
      ...adminState,
      systemSettings: withAudit({ ...payload, updatedAt: '', updatedBy: '' }, actor)
    };
    return clone(adminState.systemSettings);
  },
  async restoreSystemSettings(actor: User | null): Promise<SystemSetting> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    adminState = {
      ...adminState,
      systemSettings: withAudit(clone(defaultSystemSetting), actor)
    };
    return clone(adminState.systemSettings);
  },
  async saveExportSettings(
    payload: Omit<ExportSetting, 'updatedAt' | 'updatedBy'>,
    actor: User | null
  ): Promise<ExportSetting> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    adminState = {
      ...adminState,
      exportSettings: withAudit({ ...payload, updatedAt: '', updatedBy: '' }, actor)
    };
    return clone(adminState.exportSettings);
  },
  async restoreExportSettings(actor: User | null): Promise<ExportSetting> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    adminState = {
      ...adminState,
      exportSettings: withAudit(clone(defaultExportSetting), actor)
    };
    return clone(adminState.exportSettings);
  }
};

function sanitizeId(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
}
