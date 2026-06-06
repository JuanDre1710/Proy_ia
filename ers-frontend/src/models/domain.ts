export type IdentifierType = 'DNI' | 'CUIL' | 'CUIT';
export type UiStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';
export type AlertLevel = 'high' | 'medium' | 'low';

export interface ApiState<T> {
  status: UiStatus;
  data: T | null;
  error: string | null;
}

export interface SearchIdentifier {
  value: string;
  type: IdentifierType;
}

export interface PersonProfile {
  fullName: string;
  identifier: string;
  birthDate: string;
  age: number;
  address: string;
  locality: string;
  province: string;
  phone: string;
  email: string;
  verified: boolean;
}

export interface FinancialProfile {
  creditScore: number;
  debtRatio: number;
  bancarizationLevel: 'Alta' | 'Media' | 'Baja';
  bouncedChecks: number;
  activeLoans: number;
  observation: string;
}

export interface EmploymentFiscalProfile {
  taxStatus: string;
  mainActivity: string;
  employer: string;
  monthlyIncomeRange: string;
  registeredEmployees?: number;
  observation: string;
}

export interface ClaimHistoryItem {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: 'Aprobado' | 'Observado' | 'Rechazado';
  notes: string;
}

export interface RiskAlert {
  id: string;
  title: string;
  detail: string;
  level: AlertLevel;
}

export interface RiskScoreExplanation {
  score: number;
  level: 'Alto' | 'Medio' | 'Bajo';
  summary: string;
  drivers: Array<{ label: string; impact: 'Positivo' | 'Negativo' | 'Neutro'; weight: number }>;
}

export interface RiskHeatmapCell {
  variable: string;
  value: string;
  intensity: number;
}

export interface RelationshipNode {
  id: string;
  label: string;
  category: 'Titular' | 'Tercero' | 'Siniestro' | 'Cuenta' | 'Empresa';
  riskLevel: AlertLevel;
}

export interface RelationshipEdge {
  source: string;
  target: string;
  reason: string;
}

export interface RiskEvaluation {
  requestedAt: string;
  person: PersonProfile;
  financial: FinancialProfile;
  employmentFiscal: EmploymentFiscalProfile;
  claims: ClaimHistoryItem[];
  alerts: RiskAlert[];
  score: RiskScoreExplanation;
  heatmap: RiskHeatmapCell[];
  relationships: {
    nodes: RelationshipNode[];
    edges: RelationshipEdge[];
  };
}

export interface RiskThresholdConfig {
  reviewThreshold: number;
  autoRejectThreshold: number;
  suspiciousClaimFrequency: number;
  debtRatioThreshold: number;
  updatedBy: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  result: string;
  ip: string;
}
