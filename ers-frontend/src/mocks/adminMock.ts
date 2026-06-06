import {
  ActiveRule,
  AdminPanelData,
  ExportSetting,
  IntegrationStatus,
  RiskThresholdConfig,
  SystemSetting
} from '../models/admin';

export const defaultRiskThresholdConfig: RiskThresholdConfig = {
  manualReviewThreshold: 65,
  autoRejectThreshold: 90,
  suspiciousClaimFrequency: 3,
  debtRatioThreshold: 45,
  highRiskCountryWeight: 20,
  updatedBy: 'Sistema',
  updatedAt: '2026-03-14T09:30:00'
};

export const mockActiveRules: ActiveRule[] = [
  {
    id: 'RULE-01',
    name: 'Coincidencia con listas internas',
    category: 'Identidad',
    severity: 'Alta',
    status: 'Activa',
    description: 'Escala el caso si existe match con antecedentes internos de fraude.',
    lastUpdatedAt: '2026-03-10T12:10:00',
    source: 'Motor interno'
  },
  {
    id: 'RULE-02',
    name: 'Frecuencia de siniestros',
    category: 'Historial',
    severity: 'Media',
    status: 'Activa',
    description: 'Marca revision manual cuando supera el limite historico parametrizado.',
    lastUpdatedAt: '2026-03-11T15:45:00',
    source: 'Regla operativa'
  },
  {
    id: 'RULE-03',
    name: 'Documento con inconsistencias',
    category: 'Documental',
    severity: 'Alta',
    status: 'Monitoreada',
    description: 'Observa diferencias entre identidad declarada, selfie y fuentes externas.',
    lastUpdatedAt: '2026-03-12T10:20:00',
    source: 'RENAPER + biometria'
  }
];

export const mockIntegrationStatus: IntegrationStatus[] = [
  {
    id: 'INT-RENAPER',
    name: 'RENAPER',
    type: 'API REST',
    status: 'Operativa',
    latencyMs: 380,
    lastSyncAt: '2026-03-16T09:55:00',
    detail: 'Validacion documental y biometrica disponible.',
    endpoint: 'https://api.renaper.mock/identity',
    authType: 'OAuth2'
  },
  {
    id: 'INT-AFIP',
    name: 'AFIP',
    type: 'API REST',
    status: 'Degradada',
    latencyMs: 940,
    lastSyncAt: '2026-03-16T09:48:00',
    detail: 'Respuesta lenta en consultas de situacion fiscal.',
    endpoint: 'https://api.afip.mock/tax-profile',
    authType: 'API Key'
  },
  {
    id: 'INT-MAIL',
    name: 'Notificaciones internas',
    type: 'Webhook',
    status: 'Operativa',
    latencyMs: 120,
    lastSyncAt: '2026-03-16T09:58:00',
    detail: 'Envio de alertas y auditoria funcionando.',
    endpoint: 'https://hooks.ers.local/notify',
    authType: 'Basic'
  }
];

export const defaultSystemSetting: SystemSetting = {
  autoAssignmentEnabled: true,
  sessionTimeoutMinutes: 30,
  incidentEmail: 'riesgo-operaciones@ers.local',
  auditRetentionDays: 180,
  maintenanceMode: false,
  updatedBy: 'Sistema',
  updatedAt: '2026-03-14T09:30:00'
};

export const defaultExportSetting: ExportSetting = {
  csvEnabled: true,
  pdfEnabled: true,
  includeSensitiveData: false,
  requireApproval: true,
  maxRowsPerExport: 1000,
  deliveryChannel: 'Descarga directa',
  updatedBy: 'Sistema',
  updatedAt: '2026-03-14T09:30:00'
};

export const adminPanelMock: AdminPanelData = {
  thresholds: defaultRiskThresholdConfig,
  activeRules: mockActiveRules,
  integrations: mockIntegrationStatus,
  systemSettings: defaultSystemSetting,
  exportSettings: defaultExportSetting
};
