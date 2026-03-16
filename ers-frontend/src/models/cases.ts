export type RiskCategory = 'Normal' | 'Requiere revision' | 'Sospechoso de fraude';
export type CaseStatus =
  | 'Evaluable'
  | 'Fallecido'
  | 'No evaluable'
  | 'En revision prioritaria';
export type AlertSeverity = 'success' | 'warning' | 'error' | 'info';
export type AlertType =
  | 'RENAPER'
  | 'Financiera'
  | 'Fiscal'
  | 'Siniestros'
  | 'Conductual'
  | 'Integridad';
export type NodeType =
  | 'Persona'
  | 'Empresa'
  | 'Siniestro'
  | 'Taller'
  | 'Abogado'
  | 'Medico'
  | 'Testigo'
  | 'Familiar'
  | 'Cuenta';
export type RelationshipSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RiskScore {
  score: number;
  category: RiskCategory;
  explanation: string;
}

export interface FraudAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  shortDescription: string;
  detail: string;
  source: string;
  relatedVariable: string;
  recommendation?: string;
}

export interface ExplanationVariable {
  id: string;
  name: string;
  impact: 'Positivo' | 'Negativo' | 'Neutro';
  weight: number;
  description: string;
}

export interface AIExplanation {
  totalScore: number;
  textualClassification: RiskCategory;
  executiveSummary: string;
  variables: ExplanationVariable[];
  evaluatorRecommendation: string;
}

export interface RiskVariableImpact {
  key: string;
  label: string;
  value?: string | number;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  impactScore?: number;
  description?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  riskLevel: RelationshipSeverity;
  metadata: Record<string, string | number | boolean | undefined>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  severity: RelationshipSeverity;
}

export interface PersonalInfo {
  fullName: string;
  document: string;
  documentType: 'DNI' | 'CUIL' | 'CUIT';
  birthDate: string;
  age: number;
  verified: boolean;
  deceased: boolean;
  address: string;
  locality: string;
  province: string;
  phone: string;
  email: string;
}

export interface FinancialInfo {
  creditScore: number;
  debtRatio: number;
  bancarizationLevel: 'Alta' | 'Media' | 'Baja';
  activeLoans: number;
  bouncedChecks: number;
  monthlyIncomeEstimate: string;
  observation: string;
}

export interface LaborFiscalInfo {
  taxStatus: string;
  mainActivity: string;
  employerOrCompany: string;
  incomeBracket: string;
  registeredEmployees?: number;
  fiscalObservation: string;
}

export interface ClaimRecord {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: 'Aprobado' | 'Observado' | 'Rechazado';
  counterpart: string;
  notes: string;
}

export interface CaseEvaluation {
  caseId: string;
  requestedAt: string;
  analystSummary: string;
  generalStatus: CaseStatus;
  riskScore: RiskScore;
  alerts: FraudAlert[];
  aiExplanation: AIExplanation;
  riskHeatmap: RiskVariableImpact[];
  relationshipGraph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  personalInfo: PersonalInfo;
  financialInfo: FinancialInfo;
  laborFiscalInfo: LaborFiscalInfo;
  claimsHistory: ClaimRecord[];
}
