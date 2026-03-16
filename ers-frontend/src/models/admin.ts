export interface RiskThresholdConfig {
  manualReviewThreshold: number;
  autoRejectThreshold: number;
  suspiciousClaimFrequency: number;
  debtRatioThreshold: number;
  highRiskCountryWeight: number;
  updatedBy: string;
  updatedAt: string;
}

export interface ActiveRule {
  id: string;
  name: string;
  category: string;
  severity: 'Alta' | 'Media' | 'Baja';
  status: 'Activa' | 'Monitoreada';
  description: string;
  lastUpdatedAt: string;
  source?: string;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  type: 'API REST' | 'Webhook' | 'Batch' | 'Base de datos';
  status: 'Operativa' | 'Degradada' | 'Fuera de linea';
  latencyMs: number;
  lastSyncAt: string;
  detail: string;
  endpoint?: string;
  authType?: 'API Key' | 'OAuth2' | 'Basic' | 'Ninguna';
}

export interface SystemSetting {
  autoAssignmentEnabled: boolean;
  sessionTimeoutMinutes: number;
  incidentEmail: string;
  auditRetentionDays: number;
  maintenanceMode: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface ExportSetting {
  csvEnabled: boolean;
  pdfEnabled: boolean;
  includeSensitiveData: boolean;
  requireApproval: boolean;
  maxRowsPerExport: number;
  deliveryChannel: 'Descarga directa' | 'Correo interno';
  updatedBy: string;
  updatedAt: string;
}

export interface AdminPanelData {
  thresholds: RiskThresholdConfig;
  activeRules: ActiveRule[];
  integrations: IntegrationStatus[];
  systemSettings: SystemSetting;
  exportSettings: ExportSetting;
}
