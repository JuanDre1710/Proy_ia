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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

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

function toBackendProviderType(value: IntegrationStatus['providerType'] | undefined): 'IDENTITY' | 'FINANCIAL' | 'RELATIONSHIP' | 'DOCUMENT' {
  return value ?? 'IDENTITY';
}

function toBackendStatus(value: IntegrationStatus['status']): 'ACTIVE' | 'DEGRADED' | 'DISABLED' | 'TESTING' {
  if (value === 'Operativa') {
    return 'ACTIVE';
  }
  if (value === 'Degradada') {
    return 'DEGRADED';
  }
  return 'DISABLED';
}

function fromBackendStatus(value: string): IntegrationStatus['status'] {
  if (value === 'ACTIVE') {
    return 'Operativa';
  }
  if (value === 'DEGRADED' || value === 'TESTING') {
    return 'Degradada';
  }
  return 'Fuera de linea';
}

function mapBackendIntegration(item: any): IntegrationStatus {
  const lastConnectivityTest = item.metadata?.lastConnectivityTest;

  return {
    id: item.id,
    code: item.code,
    providerType: item.providerType,
    name: item.displayName,
    type: item.integrationKind,
    status: fromBackendStatus(item.status),
    latencyMs: Number(lastConnectivityTest?.latencyMs ?? item.metadata?.latencyMs ?? 0),
    lastSyncAt: item.updatedAt,
    detail: item.detail ?? '',
    endpoint: item.baseUrl ?? undefined,
    authType: item.authType ?? undefined,
    timeoutMs: item.timeoutMs,
    retries: item.retries,
    enabled: item.enabled,
    secretConfigured: item.secretConfigured,
    metadata: item.metadata ?? {}
  };
}

async function tryFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const adminService = {
  async getAdminPanelData(): Promise<AdminPanelData> {
    await new Promise((resolve) => setTimeout(resolve, 250));

    try {
      const integrations = await tryFetchJson<any[]>(`${apiBaseUrl}/admin/integrations`);
      adminState = {
        ...adminState,
        integrations: integrations.map(mapBackendIntegration)
      };
    } catch (_error) {
      // Keep mock fallback during migration.
    }

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
    actor: User | null
  ): Promise<IntegrationStatus[]> {
    try {
      const created = await tryFetchJson<any>(`${apiBaseUrl}/admin/integrations`, {
        method: 'POST',
        body: JSON.stringify({
          code: payload.code ?? sanitizeId(payload.name),
          providerType: toBackendProviderType(payload.providerType),
          integrationKind: payload.type,
          displayName: payload.name,
          baseUrl: payload.endpoint ?? null,
          authType: payload.authType ?? null,
          secretRef: payload.secretConfigured ? 'configured-secret' : null,
          timeoutMs: payload.timeoutMs ?? 5000,
          retries: payload.retries ?? 0,
          status: toBackendStatus(payload.status),
          enabled: payload.enabled ?? true,
          detail: payload.detail,
          metadata: payload.metadata ?? {},
          settings: {},
          updatedBy: actor?.name ?? 'Administrador'
        })
      });

      const integration = mapBackendIntegration(created);
      adminState = {
        ...adminState,
        integrations: [integration, ...adminState.integrations.filter((item) => item.id !== integration.id)]
      };
      return clone(adminState.integrations);
    } catch (_error) {
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
    }
    return clone(adminState.integrations);
  },
  async updateIntegration(
    integrationId: string,
    payload: Omit<IntegrationStatus, 'id' | 'lastSyncAt' | 'latencyMs'>,
    actor: User | null
  ): Promise<IntegrationStatus[]> {
    const updated = await tryFetchJson<any>(`${apiBaseUrl}/admin/integrations/${integrationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        code: payload.code ?? sanitizeId(payload.name),
        providerType: toBackendProviderType(payload.providerType),
        integrationKind: payload.type,
        displayName: payload.name,
        baseUrl: payload.endpoint ?? null,
        authType: payload.authType ?? null,
        secretRef: payload.secretConfigured ? 'configured-secret' : null,
        timeoutMs: payload.timeoutMs ?? 5000,
        retries: payload.retries ?? 0,
        status: toBackendStatus(payload.status),
        enabled: payload.enabled ?? true,
        detail: payload.detail,
        metadata: payload.metadata ?? {},
        settings: {},
        updatedBy: actor?.name ?? 'Administrador'
      })
    });

    const mapped = mapBackendIntegration(updated);
    adminState = {
      ...adminState,
      integrations: adminState.integrations.map((item) => (item.id === integrationId ? mapped : item))
    };
    return clone(adminState.integrations);
  },
  async toggleIntegrationEnabled(
    integrationId: string,
    enabled: boolean,
    actor: User | null
  ): Promise<IntegrationStatus> {
    const updated = await tryFetchJson<any>(`${apiBaseUrl}/admin/integrations/${integrationId}/enabled`, {
      method: 'PATCH',
      body: JSON.stringify({
        enabled,
        updatedBy: actor?.name ?? 'Administrador'
      })
    });

    const mapped = mapBackendIntegration(updated);
    adminState = {
      ...adminState,
      integrations: adminState.integrations.map((item) => (item.id === integrationId ? mapped : item))
    };
    return clone(mapped);
  },
  async testIntegrationConnectivity(integrationId: string, actor: User | null): Promise<{ success: boolean; message: string; latencyMs?: number | null }> {
    const result = await tryFetchJson<any>(
      `${apiBaseUrl}/admin/integrations/${integrationId}/test-connectivity?updatedBy=${encodeURIComponent(actor?.name ?? 'Administrador')}`,
      { method: 'POST' }
    );

    const integrations = await tryFetchJson<any[]>(`${apiBaseUrl}/admin/integrations`);
    adminState = {
      ...adminState,
      integrations: integrations.map(mapBackendIntegration)
    };

    return {
      success: result.success,
      message: result.message,
      latencyMs: result.latencyMs
    };
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
