import { ApiState } from '../models/domain';
import { CaseDecisionAction, CaseEvaluation, CaseResolution, MonitoredCaseListItem } from '../models/cases';
import { apiBaseUrls } from '../config/apiBaseUrls';
import { mockCases } from '../mocks/casesMock';
import { IdentifierType } from '../models/domain';
import { authService } from './authService';

function cloneCaseMap(data: Record<string, CaseEvaluation>): Record<string, CaseEvaluation> {
  return JSON.parse(JSON.stringify(data)) as Record<string, CaseEvaluation>;
}

const caseStore = cloneCaseMap(mockCases);
const apiBaseUrl = apiBaseUrls.backend;
const sqlApiBaseUrl = apiBaseUrls.sqlBackend;

function isSqlCaseId(caseId: string): boolean {
  return /^CASE-/i.test(caseId);
}

function isNumericCaseReference(caseId: string): boolean {
  return /^\d+$/.test(caseId.trim());
}

function mapIdentifierType(value?: string): IdentifierType {
  if (value === 'CUIL' || value === 'CUIT' || value === 'DNI') {
    return value;
  }
  return 'DNI';
}

function translatePriority(value?: 'HIGH' | 'MEDIUM' | 'LOW'): 'HIGH' | 'MEDIUM' | 'LOW' {
  return value ?? 'MEDIUM';
}

function translateAlertSource(value?: string): string {
  switch (value) {
    case 'IDENTITY':
      return 'Validacion de identidad';
    case 'INTERNAL_RULE':
      return 'Regla interna';
    case 'FINANCIAL':
      return 'Perfil financiero';
    case 'LABOR_FISCAL':
      return 'Perfil laboral y fiscal';
    case 'validation':
      return 'Validacion del caso';
    case 'rules':
      return 'Reglas operativas';
    default:
      return value ?? 'Motor operativo';
  }
}

function translateRelatedVariable(value?: string | null): string {
  const normalized = (value ?? '').trim().toLowerCase();
  switch (normalized) {
    case 'pipeline':
      return 'flujo_del_caso';
    case 'ingestion_status':
      return 'estado_de_ingesta';
    case 'total_claims':
      return 'cantidad_total_de_siniestros';
    case 'claims_last_365_days':
      return 'siniestros_ultimos_365_dias';
    case 'average_historical_amount':
      return 'monto_promedio_historico';
    case 'days_since_previous_claim':
      return 'dias_desde_siniestro_anterior';
    case 'days_between_policy_creation_and_claim':
      return 'dias_entre_alta_de_poliza_y_siniestro';
    case 'selected_claim_amount':
      return 'monto_del_siniestro_seleccionado';
    case 'operational_score':
      return 'puntaje_operativo';
    case 'high_claim_frequency':
      return 'frecuencia_alta_de_siniestros';
    case 'short_time_between_claims':
      return 'intervalo_corto_entre_siniestros';
    case 'early_claim_after_policy_start':
      return 'siniestro_temprano_post_alta';
    case 'claim_amount_above_history':
      return 'monto_superior_al_historico';
    case 'inactive_policy_reference':
      return 'referencia_a_poliza_no_vigente';
    case 'missing_claim_date':
      return 'fecha_de_siniestro_faltante';
    case 'missing_policy_reference':
      return 'referencia_de_poliza_faltante';
    case 'case_not_evaluable':
      return 'caso_no_evaluable';
    default:
      return normalized || 'flujo_del_caso';
  }
}

function translateHeatmapLabel(key: string): string {
  switch (key) {
    case 'total_claims':
      return 'Cantidad total de siniestros';
    case 'claims_last_365_days':
      return 'Siniestros en los ultimos 365 dias';
    case 'average_historical_amount':
      return 'Monto promedio historico';
    case 'days_since_previous_claim':
      return 'Dias desde el siniestro anterior';
    case 'days_between_policy_creation_and_claim':
      return 'Dias entre alta de poliza y siniestro';
    case 'selected_claim_amount':
      return 'Monto del siniestro seleccionado';
    case 'operational_score':
      return 'Puntaje operativo';
    default:
      return key.replace(/_/g, ' ');
  }
}

function buildHeatmapDescription(key: string, value: number): string {
  switch (key) {
    case 'total_claims':
      return `Cantidad historica total registrada: ${value}.`;
    case 'claims_last_365_days':
      return `Siniestros registrados durante los ultimos 365 dias: ${value}.`;
    case 'average_historical_amount':
      return `Monto promedio historico observado: ${value}.`;
    case 'days_since_previous_claim':
      return `Dias transcurridos desde el siniestro anterior: ${value}.`;
    case 'days_between_policy_creation_and_claim':
      return `Dias entre el alta de la poliza y el siniestro: ${value}.`;
    case 'selected_claim_amount':
      return `Monto informado para el siniestro seleccionado: ${value}.`;
    case 'operational_score':
      return `Puntaje operativo calculado para este caso: ${value}.`;
    default:
      return `Contribucion relativa ${value}.`;
  }
}

function mapRiskCategory(value?: string): CaseEvaluation['riskScore']['category'] {
  if (value === 'FRAUD_SUSPECT') {
    return 'Sospechoso de fraude';
  }
  if (value === 'NORMAL') {
    return 'Normal';
  }
  return 'Requiere revision';
}

function mapAlertSeverity(value?: string): CaseEvaluation['alerts'][number]['severity'] {
  if (value === 'CRITICAL') {
    return 'error';
  }
  if (value === 'WARNING') {
    return 'warning';
  }
  if (value === 'INFO') {
    return 'info';
  }
  return 'success';
}

function mapGeneralStatus(status: string, category?: string): CaseEvaluation['generalStatus'] {
  if (status === 'excluded') {
    return 'No evaluable';
  }
  if (status === 'not_evaluable') {
    return 'No evaluable';
  }
  if (status === 'ready_for_reasoning') {
    return 'Evaluable';
  }
  if (status === 'ready_for_rules') {
    return 'Evaluable';
  }
  if (status === 'scored' && category === 'FRAUD_SUSPECT') {
    return 'En revision prioritaria';
  }
  if (status === 'scored') {
    return 'Evaluable';
  }
  if (status === 'accepted_for_processing') {
    return 'Evaluable';
  }
  return 'No evaluable';
}

function mapInitialCase(payload: {
  caseId: string;
  identifier: string;
  identifierType?: string | null;
  requestedAt: string;
  requestedBy?: string | null;
  status: string;
  validationResults: Record<string, string>;
}): CaseEvaluation {
  const summary =
    payload.status === 'accepted_for_processing'
      ? 'El caso fue aceptado en la etapa de ingesta y quedo listo para procesamiento posterior.'
      : payload.status === 'waiting_for_enrichment'
        ? 'El caso fue creado pero esta esperando enriquecimiento por disponibilidad o estado de integraciones.'
        : payload.status === 'daily_limit_reached'
          ? 'El caso no puede continuar porque se alcanzo el limite diario de evaluaciones.'
          : payload.status === 'insufficient_input'
            ? 'La solicitud no tiene los datos minimos obligatorios para iniciar el caso.'
            : 'El identificador recibido no es valido.';

  return {
    caseId: payload.caseId,
    requestedAt: payload.requestedAt,
    analystSummary: summary,
    generalStatus:
      payload.status === 'accepted_for_processing'
        ? 'Evaluable'
        : payload.status === 'waiting_for_enrichment'
          ? 'No evaluable'
          : 'No evaluable',
    riskScore: {
      score: 0,
      category: 'Requiere revision',
      explanation: 'El pipeline todavia no ejecuto razonamiento ni scoring.'
    },
    alerts: [
      {
        id: `INGEST-${payload.caseId}`,
        type: 'Integridad',
        severity: payload.status === 'accepted_for_processing' ? 'info' : 'warning',
        title: 'Caso en etapa de ingesta',
        shortDescription: payload.status,
        detail: `Validaciones ejecutadas: ${Object.entries(payload.validationResults)
          .map(([key, value]) => `${key}=${value}`)
          .join(', ') || 'sin detalle adicional'}.`,
        source: 'Pipeline ERS',
        relatedVariable: 'ingestion_status',
        recommendation:
          payload.status === 'accepted_for_processing'
            ? 'Continuar con enrichment antes de cualquier analisis IA.'
            : 'Resolver el bloqueo de ingesta antes de continuar.'
      }
    ],
    aiExplanation: {
      totalScore: 0,
      textualClassification: 'Requiere revision',
      executiveSummary: 'La evaluacion se encuentra en una etapa previa a IA.',
      variables: [],
      evidenceForReview: [],
      evidenceAgainstFraud: [],
      inconsistencies: [],
      missingEvidence: [],
      suggestedPriority: 'MEDIUM',
      suggestedNextChecks: ['No ejecutar score ni decision final hasta completar enrichment.'],
      evaluatorRecommendation: 'No ejecutar score ni decision final hasta completar enrichment.'
    },
    riskHeatmap: [],
    relationshipGraph: {
      nodes: [],
      edges: []
    },
    personalInfo: {
      fullName: 'Pendiente de enrichment',
      document: payload.identifier,
      documentType: mapIdentifierType(payload.identifierType ?? undefined),
      birthDate: 'N/D',
      age: 0,
      verified: false,
      deceased: false,
      address: 'N/D',
      locality: 'N/D',
      province: 'N/D',
      phone: 'N/D',
      email: 'N/D'
    },
    financialInfo: {
      creditScore: 0,
      debtRatio: 0,
      bancarizationLevel: 'Baja',
      activeLoans: 0,
      bouncedChecks: 0,
      monthlyIncomeEstimate: 'Sin datos',
      observation: 'Sin enrichment todavia.'
    },
    laborFiscalInfo: {
      taxStatus: 'Sin datos',
      mainActivity: 'Sin datos',
      employerOrCompany: 'Sin datos',
      incomeBracket: 'Sin datos',
      fiscalObservation: 'Sin enrichment todavia.'
    },
    claimsHistory: [],
    resolution: { status: 'Pendiente' }
  };
}

function mapBackendCase(payload: {
  caseId: string;
  identifier: string;
  identifierType?: string | null;
  requestedAt: string;
  requestedBy?: string | null;
  status: string;
  validationResults: Record<string, string>;
  metadata: Record<string, unknown>;
  subject: {
    fullName: string;
    birthDate?: string | null;
    age?: number | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    locality?: string | null;
    province?: string | null;
    verified: boolean;
    deceased: boolean;
  };
  financialInfo?: {
    creditScore?: number | null;
    debtRatio?: number | null;
    bancarizationLevel?: 'Alta' | 'Media' | 'Baja' | null;
    activeLoans?: number | null;
    bouncedChecks?: number | null;
    monthlyIncomeEstimate?: string | null;
    observation?: string | null;
  } | null;
  laborFiscalInfo?: {
    taxStatus?: string | null;
    mainActivity?: string | null;
    employerOrCompany?: string | null;
    incomeBracket?: string | null;
    registeredEmployees?: number | null;
    fiscalObservation?: string | null;
  } | null;
  claimsHistory?: Array<{
    id: string;
    date: string;
    type: string;
    amount: number;
    status: 'Aprobado' | 'Observado' | 'Rechazado';
    counterpart: string;
    notes: string;
  }>;
  evidenceSummary?: {
    readyForRules: boolean;
    providerStatuses: Record<string, string>;
    warnings: string[];
    evidenceCount: number;
  } | null;
  alerts?: Array<{
    id: string;
    severity: string;
    title: string;
    shortDescription: string;
    detail: string;
    source: string;
    relatedVariable?: string | null;
    recommendation?: string | null;
  }>;
  score?: {
    value: number;
    category: string;
    confidence?: number | null;
    modelVersion?: string | null;
    topFactors: Array<{
      feature: string;
      label: string;
      impact: string;
      weight: number;
    }>;
    featureContributions: Record<string, number>;
  } | null;
  reasoning?: {
    summary: string;
    reasoningSummary?: string;
    hypothesis: string;
    evidenceForReview: string[];
    evidenceAgainstFraud: string[];
    inconsistencies: string[];
    missingEvidence: string[];
    suggestedPriority: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestedNextChecks: string[];
    confidence?: number | null;
    unresolvedQuestions: string[];
  } | null;
  finalAssessment?: {
    finalStatus: string;
    finalPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendedAction: string;
    confidence?: number | null;
    summaryForAnalyst: string;
    evidenceQuality?: string | null;
    requiresManualReview: boolean;
    blockedByHardRules: boolean;
    hardRuleReasons: string[];
  } | null;
  decision?: {
    status: 'ACCEPTED' | 'DENIED' | 'ESCALATED' | 'PENDING' | 'CANCELLED';
    decidedAt: string;
    decidedById?: string | null;
    decidedBy?: string | null;
    decidedByRole?: string | null;
    comment?: string | null;
    rationale?: string | null;
  } | null;
}): CaseEvaluation {
  if (
    payload.status !== 'scored' &&
    payload.status !== 'ready_for_rules' &&
    payload.status !== 'ready_for_reasoning' &&
    payload.status !== 'excluded' &&
    payload.status !== 'not_evaluable'
  ) {
    return mapInitialCase(payload);
  }

  const category = mapRiskCategory(payload.score?.category);
  const metadataSummary = typeof payload.metadata.analystSummary === 'string' ? payload.metadata.analystSummary : null;
  const explanation =
    payload.finalAssessment?.summaryForAnalyst ??
    metadataSummary ??
    (payload.status === 'excluded'
      ? 'Las reglas duras excluyeron el caso antes de reasoning y scoring.'
      : payload.status === 'not_evaluable'
        ? 'Las reglas duras marcaron el caso como no evaluable por cobertura o calidad insuficiente.'
        : payload.status === 'ready_for_reasoning'
          ? 'Las reglas duras no bloquearon el caso y el expediente puede pasar a reasoning.'
          : payload.status === 'ready_for_rules'
            ? payload.evidenceSummary?.readyForRules
              ? 'La evidencia del caso fue consolidada y quedo lista para reglas duras.'
              : 'La evidencia del caso es parcial y requiere completar enrichment.'
            : payload.reasoning?.reasoningSummary ?? payload.reasoning?.summary ?? 'El backend completo el enrichment y scoring del caso.');

  return {
    caseId: payload.caseId,
    requestedAt: payload.requestedAt,
    analystSummary: explanation,
    generalStatus: mapGeneralStatus(payload.status, payload.score?.category),
    riskScore: {
      score: Math.round(payload.score?.value ?? 0),
      category:
        payload.status === 'ready_for_rules' || payload.status === 'ready_for_reasoning' || payload.status === 'excluded' || payload.status === 'not_evaluable'
          ? 'Requiere revision'
          : category,
      explanation
    },
    alerts: (payload.alerts ?? []).map((alert) => ({
      id: alert.id,
      type:
        alert.source === 'FINANCIAL'
          ? 'Financiera'
          : alert.source === 'LABOR_FISCAL'
            ? 'Fiscal'
            : alert.source === 'IDENTITY' || alert.source === 'INTERNAL_RULE'
              ? 'Integridad'
              : 'Conductual',
      severity: mapAlertSeverity(alert.severity),
      title: alert.title,
      shortDescription: alert.shortDescription,
      detail: alert.detail,
      source: translateAlertSource(alert.source),
      relatedVariable: translateRelatedVariable(alert.relatedVariable),
      recommendation: alert.recommendation ?? undefined
    })),
    aiExplanation: {
      totalScore: Math.round(payload.score?.value ?? 0),
      textualClassification:
        payload.status === 'ready_for_rules' || payload.status === 'ready_for_reasoning' || payload.status === 'excluded' || payload.status === 'not_evaluable'
          ? 'Requiere revision'
          : category,
      executiveSummary: explanation,
      variables: (payload.score?.topFactors ?? []).map((factor, index) => ({
        id: `factor-${index + 1}`,
        name: factor.label,
        impact:
          factor.impact === 'Sin factores destacados'
            ? 'Neutro'
            : category === 'Normal'
              ? 'Neutro'
              : 'Positivo',
        weight: Math.round((factor.weight ?? 0) * 100),
        description: factor.impact
      })),
      evidenceForReview: payload.reasoning?.evidenceForReview ?? [],
      evidenceAgainstFraud: payload.reasoning?.evidenceAgainstFraud ?? [],
      inconsistencies: payload.reasoning?.inconsistencies ?? [],
      missingEvidence: payload.reasoning?.missingEvidence ?? [],
      suggestedPriority: translatePriority(payload.reasoning?.suggestedPriority),
      suggestedNextChecks: payload.reasoning?.suggestedNextChecks ?? [],
      evaluatorRecommendation:
        payload.finalAssessment?.recommendedAction
          ? `Accion recomendada por el backend: ${payload.finalAssessment.recommendedAction}.`
          : payload.status === 'excluded'
            ? 'No continuar a reasoning ni scoring. Revisar exclusiones y auditoria.'
            : payload.status === 'not_evaluable'
              ? 'Completar evidencia o corregir datos antes de cualquier etapa posterior.'
              : payload.status === 'ready_for_reasoning'
                ? 'Continuar con reasoning sobre alertas y calidad de datos ya calculadas.'
                : payload.status === 'ready_for_rules'
                  ? payload.evidenceSummary?.readyForRules
                    ? 'Continuar con reglas duras sobre la evidencia consolidada.'
                    : 'Completar enrichment de proveedores antes de reglas duras.'
                  : category === 'Sospechoso de fraude'
                    ? 'Escalar a revision manual prioritaria.'
                    : category === 'Requiere revision'
                      ? 'Solicitar validaciones manuales complementarias.'
                      : 'No se detectan bloqueos fuertes para continuar.'
    },
    riskHeatmap: Object.entries(payload.score?.featureContributions ?? {}).map(([key, value]) => ({
      key,
      label: translateHeatmapLabel(key),
      value: typeof value === 'number' ? value.toFixed(2) : value,
      impactLevel: value >= 18 ? 'critical' : value >= 12 ? 'high' : value >= 6 ? 'medium' : 'low',
      impactScore: value,
      description: buildHeatmapDescription(key, value)
    })),
    relationshipGraph: {
      nodes: [],
      edges: []
    },
    personalInfo: {
      fullName: payload.subject.fullName,
      document: payload.identifier,
      documentType: mapIdentifierType(payload.identifierType ?? undefined),
      birthDate: payload.subject.birthDate ?? 'N/D',
      age: payload.subject.age ?? 0,
      verified: payload.subject.verified,
      deceased: payload.subject.deceased,
      address: payload.subject.address ?? 'N/D',
      locality: payload.subject.locality ?? 'N/D',
      province: payload.subject.province ?? 'N/D',
      phone: payload.subject.phone ?? 'N/D',
      email: payload.subject.email ?? 'N/D'
    },
    financialInfo: {
      creditScore: payload.financialInfo?.creditScore ?? 0,
      debtRatio: payload.financialInfo?.debtRatio ?? 0,
      bancarizationLevel: payload.financialInfo?.bancarizationLevel ?? 'Baja',
      activeLoans: payload.financialInfo?.activeLoans ?? 0,
      bouncedChecks: payload.financialInfo?.bouncedChecks ?? 0,
      monthlyIncomeEstimate: payload.financialInfo?.monthlyIncomeEstimate ?? 'Sin datos',
      observation: payload.financialInfo?.observation ?? 'Sin observaciones'
    },
    laborFiscalInfo: {
      taxStatus: payload.laborFiscalInfo?.taxStatus ?? 'Sin datos',
      mainActivity: payload.laborFiscalInfo?.mainActivity ?? 'Sin datos',
      employerOrCompany: payload.laborFiscalInfo?.employerOrCompany ?? 'Sin datos',
      incomeBracket: payload.laborFiscalInfo?.incomeBracket ?? 'Sin datos',
      registeredEmployees: payload.laborFiscalInfo?.registeredEmployees ?? undefined,
      fiscalObservation: payload.laborFiscalInfo?.fiscalObservation ?? 'Sin observaciones'
    },
    claimsHistory: payload.claimsHistory ?? [],
    resolution: mapDecisionValueToResolution(payload.decision?.status, {
      decidedAt: payload.decision?.decidedAt,
      decidedBy: payload.decision?.decidedBy ?? payload.decision?.decidedById ?? undefined,
      decidedByRole: payload.decision?.decidedByRole ?? undefined,
      comment: payload.decision?.comment ?? undefined
    }),
    operationalCaseStatus: undefined,
    finalAssessment: payload.finalAssessment
      ? {
          finalStatus: payload.finalAssessment.finalStatus,
          finalPriority: payload.finalAssessment.finalPriority,
          recommendedAction: payload.finalAssessment.recommendedAction,
          confidence: payload.finalAssessment.confidence ?? 0,
          summaryForAnalyst: payload.finalAssessment.summaryForAnalyst,
          evidenceQuality: payload.finalAssessment.evidenceQuality ?? undefined,
          requiresManualReview: payload.finalAssessment.requiresManualReview,
          blockedByHardRules: payload.finalAssessment.blockedByHardRules,
          hardRuleReasons: payload.finalAssessment.hardRuleReasons
        }
      : undefined
  };
}

type DecisionRequest = {
  action: CaseDecisionAction;
  comment?: string;
};

type ResolutionRequest = {
  fraudeConfirmado: boolean;
  comment?: string;
};

type InternalJsonUploadRequest = {
  requestedBy: string;
  sourceChannel?: string;
  caseData: Record<string, unknown>;
};

type InternalJsonUploadResponse = {
  caseId: string;
  identifier: string;
  status: string;
  message: string;
};

type CaseFromClaimResponse = {
  caseKey: string;
  message: string;
};

type CaseFromClaimUiResponse = {
  caseId: string;
  claimId: string;
  status: string;
  message: string;
  canOpenDashboard: boolean;
};

type MonitoredCaseApiResponse = {
  caseId?: string;
  case_id?: string;
  sinId?: number;
  sin_id?: number;
  nroSiniestro?: string | null;
  nro_siniestro?: string | null;
  cliente?: string | null;
  customerName?: string | null;
  customer_name?: string | null;
  fechaSiniestro?: string | null;
  fecha_siniestro?: string | null;
  score?: number | null;
  nivelRiesgo?: string | null;
  nivel_riesgo?: string | null;
  prioridad?: string | null;
  priority?: string | null;
  estadoCaso?: string | null;
  estado_caso?: string | null;
  resumenPreview?: string | null;
  resumen_preview?: string | null;
  principalesAlertas?: string | null;
  principales_alertas?: string | null;
  topAlerts?: string[] | null;
  top_alerts?: string[] | null;
  recommendedAction?: string | null;
  recommended_action?: string | null;
  isPersisted?: boolean | null;
  isPendingAnalysis?: boolean | null;
};

type MonitoredCaseDetailApiResponse = {
  caseId: string;
  sinId: number;
  cliId?: number | null;
  cliente?: string | null;
  pzaNroSol?: string | null;
  pviId?: string | null;
  psiId?: string | null;
  nroSiniestro?: string | null;
  nroPoliza?: string | null;
  nroCertificado?: string | null;
  fechaSiniestro?: string | null;
  montoReclamo?: number | null;
  montoPagado?: number | null;
  score: number;
  nivelRiesgo?: string | null;
  prioridad?: string | null;
  estadoCaso?: string | null;
  decision?: string | null;
  fraudeConfirmado?: boolean | null;
  usuarioDecision?: string | null;
  fechaDecision?: string | null;
  comentario?: string | null;
  resumenPreview?: string | null;
  alertas?: Array<{
    code: string;
    severity: string;
    title: string;
    detail: string;
    source: string;
  }>;
  recommendedAction?: string | null;
  caseSnapshot?: {
    caseKey: string;
    person: {
      personId: string;
      displayName: string;
      documentNumber?: string | null;
      taxId?: string | null;
      email?: string | null;
      birthDate?: string | null;
      activity?: string | null;
      clientStatus?: string | null;
    };
    activeAddress: {
      street?: string | null;
      number?: string | null;
      locality?: string | null;
      province?: string | null;
      postalCode?: string | null;
    };
    policy: {
      policyNumber?: string | null;
      certificateNumber?: string | null;
      proposalNumber?: string | null;
      policyStatus?: string | null;
      linkStatus?: string | null;
      policyPremium?: number | null;
    };
    selectedClaim: {
      claimId: string;
      claimNumber: string;
      claimDate?: string | null;
      statusCode: string;
      claimType?: string | null;
      claimAmount?: number | null;
      claimedAmount?: number | null;
      occurrenceAddress?: string | null;
    };
    claimHistory?: Array<{
      claimId: string;
      claimNumber: string;
      claimDate?: string | null;
      statusCode: string;
      claimType?: string | null;
      claimAmount?: number | null;
      claimedAmount?: number | null;
      policyNumber?: string | null;
      certificateNumber?: string | null;
    }>;
    historicalFeatures?: {
      totalClaims: number;
    };
  } | null;
  analysisSnapshot?: {
    processingState: string;
    score: number;
    riskClass: string;
    alerts: Array<{
      code: string;
      severity: string;
      title: string;
      detail: string;
      source: string;
    }>;
    summaryForAnalyst: string;
    recommendedAction: string;
    isEvaluable: boolean;
  } | null;
};

function normalizeRiskLevel(value?: string | null): MonitoredCaseListItem['riskLevel'] {
  const normalized = (value ?? '').trim().toUpperCase();

  if (normalized.includes('CRIT')) {
    return 'CRITICO';
  }
  if (normalized.includes('MED')) {
    return 'MEDIO';
  }
  if (normalized.includes('LEV')) {
    return 'LEVE';
  }

  return 'NORMAL';
}

function resolveReviewBadge(
  riskLevel: MonitoredCaseListItem['riskLevel']
): MonitoredCaseListItem['reviewBadge'] {
  if (riskLevel === 'CRITICO') {
    return 'Sospechoso';
  }

  if (riskLevel === 'MEDIO' || riskLevel === 'LEVE') {
    return 'Requiere revision';
  }

  return 'Normal';
}

function normalizeAlerts(payload: MonitoredCaseApiResponse): string[] {
  const rawArray = payload.topAlerts ?? payload.top_alerts;
  if (Array.isArray(rawArray)) {
    return rawArray.filter((item): item is string => Boolean(item && item.trim()));
  }

  const rawString = payload.principalesAlertas ?? payload.principales_alertas;
  if (!rawString) {
    return [];
  }

  return rawString
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/D';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value);
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return 'N/D';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('es-AR');
}

function mapRiskClassToCategory(value?: string | null): CaseEvaluation['riskScore']['category'] {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized.includes('sospech')) {
    return 'Sospechoso de fraude';
  }
  if (normalized.includes('revision')) {
    return 'Requiere revision';
  }
  return 'Normal';
}

function mapDecisionActionToBackendValue(action: CaseDecisionAction): string {
  switch (action) {
    case 'accept':
      return 'aceptado';
    case 'deny':
      return 'denegado';
    case 'review':
      return 'revisar';
    default:
      return action;
  }
}

function mapDecisionValueToResolution(
  decision?: string | null,
  metadata?: {
    decidedAt?: string | null;
    decidedBy?: string | null;
    decidedByRole?: string | null;
    comment?: string | null;
    fraudOutcome?: boolean | null;
  }
): CaseResolution {
  const normalized = (decision ?? '').trim().toLowerCase();
  const fraudOutcome =
    metadata?.fraudOutcome === true ? 'FRAUDE' : metadata?.fraudOutcome === false ? 'NO FRAUDE' : undefined;

  if (normalized === 'aceptado' || normalized === 'accepted' || normalized === 'accept') {
    return {
      status: 'Cerrado',
      decision: 'Aceptado',
      fraudOutcome,
      decidedAt: metadata?.decidedAt ?? undefined,
      decidedBy: metadata?.decidedBy ?? undefined,
      decidedByRole: metadata?.decidedByRole ?? undefined,
      comment: metadata?.comment ?? undefined
    };
  }

  if (normalized === 'denegado' || normalized === 'denied' || normalized === 'deny') {
    return {
      status: 'Cerrado',
      decision: 'Denegado',
      fraudOutcome,
      decidedAt: metadata?.decidedAt ?? undefined,
      decidedBy: metadata?.decidedBy ?? undefined,
      decidedByRole: metadata?.decidedByRole ?? undefined,
      comment: metadata?.comment ?? undefined
    };
  }

  if (normalized === 'revisar' || normalized === 'review' || normalized === 'in_review') {
    return {
      status: 'En revision',
      decision: 'Revisar',
      fraudOutcome,
      decidedAt: metadata?.decidedAt ?? undefined,
      decidedBy: metadata?.decidedBy ?? undefined,
      decidedByRole: metadata?.decidedByRole ?? undefined,
      comment: metadata?.comment ?? undefined
    };
  }

  return {
    status: 'Pendiente',
    fraudOutcome,
    decidedAt: metadata?.decidedAt ?? undefined,
    decidedBy: metadata?.decidedBy ?? undefined,
    decidedByRole: metadata?.decidedByRole ?? undefined,
    comment: metadata?.comment ?? undefined
  };
}

function mapOperationalGeneralStatus(payload: MonitoredCaseDetailApiResponse): CaseEvaluation['generalStatus'] {
  if (payload.analysisSnapshot?.isEvaluable === false) {
    return 'No evaluable';
  }

  const normalizedRisk = (payload.nivelRiesgo ?? '').trim().toLowerCase();
  if (normalizedRisk.includes('crit')) {
    return 'En revision prioritaria';
  }

  return 'Evaluable';
}

function mapMonitoredCaseDetail(payload: MonitoredCaseDetailApiResponse): CaseEvaluation {
  const snapshot = payload.caseSnapshot;
  const analysis = payload.analysisSnapshot;
  const alerts = (payload.alertas ?? analysis?.alerts ?? []).map((alert, index) => ({
    id: `${alert.code}-${index + 1}`,
    type: alert.source === 'validation' ? 'Integridad' : 'Siniestros',
    severity: mapAlertSeverity(alert.severity),
    title: alert.title,
    shortDescription: alert.title,
    detail: alert.detail,
    source: translateAlertSource(alert.source),
    relatedVariable: translateRelatedVariable(alert.code),
    recommendation: undefined
  })) as CaseEvaluation['alerts'];

  const claimHistory = (snapshot?.claimHistory ?? []).map((claim) => ({
    id: claim.claimId,
    date: claim.claimDate ? formatDateTime(claim.claimDate) : 'N/D',
    type: claim.claimType ?? 'Siniestro',
    amount: Number(claim.claimedAmount ?? claim.claimAmount ?? 0),
    status:
      claim.statusCode?.toUpperCase() === 'RECHAZADO'
        ? 'Rechazado'
        : claim.statusCode?.toUpperCase() === 'OBSERVADO'
          ? 'Observado'
          : 'Aprobado',
    counterpart: claim.policyNumber ?? 'Poliza no informada',
    notes: claim.certificateNumber ?? 'Sin certificado'
  })) as CaseEvaluation['claimsHistory'];

  return {
    caseId: payload.caseId,
    sinId: payload.sinId,
    requestedAt: formatDateTime(payload.fechaSiniestro),
    analystSummary: analysis?.summaryForAnalyst ?? payload.resumenPreview ?? 'Sin resumen disponible.',
    generalStatus: mapOperationalGeneralStatus(payload),
    riskScore: {
      score: Math.round(analysis?.score ?? payload.score ?? 0),
      category: mapRiskClassToCategory(analysis?.riskClass ?? payload.nivelRiesgo),
      explanation: analysis?.summaryForAnalyst ?? payload.resumenPreview ?? 'Sin explicacion disponible.'
    },
    alerts,
    aiExplanation: {
      totalScore: Math.round(analysis?.score ?? payload.score ?? 0),
      textualClassification: mapRiskClassToCategory(analysis?.riskClass ?? payload.nivelRiesgo),
      executiveSummary: analysis?.summaryForAnalyst ?? payload.resumenPreview ?? 'Sin resumen disponible.',
      variables: [],
      evidenceForReview: alerts.map((alert) => alert.title),
      evidenceAgainstFraud: [],
      inconsistencies: [],
      missingEvidence: [],
      suggestedPriority:
        payload.prioridad?.toLowerCase() === 'critica'
          ? 'HIGH'
          : payload.prioridad?.toLowerCase() === 'baja'
            ? 'LOW'
            : 'MEDIUM',
      suggestedNextChecks: analysis?.recommendedAction ? [analysis.recommendedAction] : [],
      evaluatorRecommendation: analysis?.recommendedAction ?? payload.recommendedAction ?? 'Sin accion sugerida.'
    },
    riskHeatmap: [],
    relationshipGraph: {
      nodes: [],
      edges: []
    },
    operationalInfo: {
      policyNumber: snapshot?.policy.policyNumber ?? payload.nroPoliza ?? 'N/D',
      certificateNumber: snapshot?.policy.certificateNumber ?? payload.nroCertificado ?? 'N/D',
      proposalNumber: snapshot?.policy.proposalNumber ?? payload.pzaNroSol ?? 'N/D',
      policyStatus: snapshot?.policy.policyStatus ?? 'N/D',
      linkStatus: snapshot?.policy.linkStatus ?? 'N/D',
      claimNumber: snapshot?.selectedClaim.claimNumber ?? payload.nroSiniestro ?? 'N/D',
      claimDate: snapshot?.selectedClaim.claimDate ? formatDateTime(snapshot.selectedClaim.claimDate) : formatDateTime(payload.fechaSiniestro),
      claimType: snapshot?.selectedClaim.claimType ?? 'N/D',
      claimStatus: snapshot?.selectedClaim.statusCode ?? payload.estadoCaso ?? 'N/D',
      claimedAmount: formatCurrency(snapshot?.selectedClaim.claimedAmount ?? payload.montoReclamo),
      paidAmount: formatCurrency(snapshot?.selectedClaim.claimAmount ?? payload.montoPagado),
      occurrenceAddress: snapshot?.selectedClaim.occurrenceAddress ?? 'N/D'
    },
    personalInfo: {
      fullName: snapshot?.person.displayName ?? payload.cliente ?? 'Cliente sin nombre',
      document: snapshot?.person.documentNumber ?? snapshot?.person.taxId ?? String(payload.cliId ?? 'N/D'),
      documentType: snapshot?.person.documentNumber ? 'DNI' : 'CUIT',
      birthDate: snapshot?.person.birthDate ? formatDateTime(snapshot.person.birthDate) : 'N/D',
      age: 0,
      verified: true,
      deceased: false,
      address: [snapshot?.activeAddress.street, snapshot?.activeAddress.number].filter(Boolean).join(' ') || 'N/D',
      locality: snapshot?.activeAddress.locality ?? 'N/D',
      province: snapshot?.activeAddress.province ?? 'N/D',
      phone: 'N/D',
      email: snapshot?.person.email ?? 'N/D'
    },
    financialInfo: {
      creditScore: 0,
      debtRatio: 0,
      bancarizationLevel: 'Baja',
      activeLoans: 0,
      bouncedChecks: 0,
      monthlyIncomeEstimate: snapshot?.policy.policyPremium ? formatCurrency(snapshot.policy.policyPremium) : 'Sin datos',
      observation: `Poliza ${snapshot?.policy.policyStatus ?? 'sin estado'} y vinculo ${snapshot?.policy.linkStatus ?? 'sin estado'}.`
    },
    laborFiscalInfo: {
      taxStatus: snapshot?.person.clientStatus ?? 'Sin datos',
      mainActivity: snapshot?.person.activity ?? 'Sin datos',
      employerOrCompany: payload.cliente ?? snapshot?.person.displayName ?? 'Sin datos',
      incomeBracket: 'Sin datos',
      fiscalObservation: 'Detalle operativo reconstruido desde el backend SQL.'
    },
    claimsHistory: claimHistory,
    resolution: mapDecisionValueToResolution(payload.decision, {
      decidedAt: payload.fechaDecision,
      decidedBy: payload.usuarioDecision,
      decidedByRole: 'Supervisor',
      comment: payload.comentario,
      fraudOutcome: payload.fraudeConfirmado
    }),
    operationalCaseStatus: payload.estadoCaso ?? undefined,
    finalAssessment: {
      finalStatus: analysis?.riskClass ?? payload.nivelRiesgo ?? 'Normal',
      finalPriority:
        payload.prioridad?.toLowerCase() === 'critica'
          ? 'CRITICAL'
          : payload.prioridad?.toLowerCase() === 'alta'
            ? 'HIGH'
            : payload.prioridad?.toLowerCase() === 'baja'
              ? 'LOW'
              : 'MEDIUM',
      recommendedAction: analysis?.recommendedAction ?? payload.recommendedAction ?? 'Sin accion sugerida',
      confidence: 0.7,
      summaryForAnalyst: analysis?.summaryForAnalyst ?? payload.resumenPreview ?? 'Sin resumen disponible.',
      evidenceQuality: 'MEDIA',
      requiresManualReview: true,
      blockedByHardRules: false,
      hardRuleReasons: []
    }
  };
}

function mapMonitoredCase(payload: MonitoredCaseApiResponse): MonitoredCaseListItem {
  const riskLevel = normalizeRiskLevel(payload.nivelRiesgo ?? payload.nivel_riesgo);
  const alerts = normalizeAlerts(payload);
  const isPersisted = Boolean(payload.isPersisted);
  const isPendingAnalysis = Boolean(payload.isPendingAnalysis);

  return {
    caseId: payload.caseId ?? payload.case_id ?? String(payload.sinId ?? payload.sin_id ?? ''),
    sinId: Number(payload.sinId ?? payload.sin_id ?? 0),
    claimNumber: payload.nroSiniestro ?? payload.nro_siniestro ?? 'Sin numero',
    customerName: payload.cliente ?? payload.customerName ?? payload.customer_name ?? 'Cliente sin nombre',
    claimDate: payload.fechaSiniestro ?? payload.fecha_siniestro ?? null,
    score: Number(payload.score ?? 0),
    riskLevel,
    reviewBadge: resolveReviewBadge(riskLevel),
    priority: payload.prioridad ?? payload.priority ?? 'sin prioridad',
    caseStatus: payload.estadoCaso ?? payload.estado_caso ?? 'pendiente',
    summaryPreview:
      payload.resumenPreview ??
      payload.resumen_preview ??
      (isPendingAnalysis ? 'Siniestro pendiente de analisis automatico.' : 'Sin resumen disponible.'),
    topAlerts: alerts.slice(0, 2),
    allAlerts: alerts,
    suggestedAction:
      payload.recommendedAction ??
      payload.recommended_action ??
      (isPendingAnalysis ? 'Registrar decision operativa o pasar a revision.' : 'Sin accion sugerida'),
    isPersisted,
    isPendingAnalysis
  };
}

const placeholderSummaries = new Set([
  'Siniestro pendiente de analisis automatico.',
  'Caso pendiente de analisis automatico. Se registro decision operativa manual.',
  'Sin resumen disponible.'
]);

function hasMeaningfulSummary(item: MonitoredCaseListItem): boolean {
  const summary = item.summaryPreview.trim();
  return summary.length > 0 && !placeholderSummaries.has(summary);
}

function scoreCaseRichness(item: MonitoredCaseListItem): number {
  let score = 0;

  if (item.isPersisted) {
    score += 2;
  }

  if (!item.isPendingAnalysis) {
    score += 3;
  }

  if (item.score > 0) {
    score += 2;
  }

  if (item.allAlerts.length > 0) {
    score += 2;
  }

  if (hasMeaningfulSummary(item)) {
    score += 3;
  }

  if (item.suggestedAction.trim().length > 0 && item.suggestedAction !== 'Sin accion sugerida') {
    score += 1;
  }

  return score;
}

function mergeCaseItem(current: MonitoredCaseListItem | undefined, candidate: MonitoredCaseListItem): MonitoredCaseListItem {
  if (!current) {
    return candidate;
  }

  const currentRichness = scoreCaseRichness(current);
  const candidateRichness = scoreCaseRichness(candidate);

  if (candidateRichness > currentRichness) {
    return candidate;
  }

  if (candidateRichness < currentRichness) {
    return current;
  }

  if (candidate.isPersisted && !current.isPersisted) {
    return candidate;
  }

  return current;
}

export const caseService = {
  async getMonitoredCases(): Promise<ApiState<MonitoredCaseListItem[]>> {
    const headers = authService.getActorHeaders();
    const take = 60;
    const urls = [`${sqlApiBaseUrl}/monitoring/cases?take=${take}`, `${sqlApiBaseUrl}/cases?take=${take}`];
    const merged = new Map<string, MonitoredCaseListItem>();
    let hasSuccessfulResponse = false;

    for (const url of urls) {
      try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          continue;
        }

        hasSuccessfulResponse = true;
        const payload = (await response.json()) as MonitoredCaseApiResponse[];

        for (const item of payload.map(mapMonitoredCase)) {
          const key = item.sinId > 0 ? `sin-${item.sinId}` : `case-${item.caseId}`;
          const current = merged.get(key);
          merged.set(key, mergeCaseItem(current, item));
        }
      } catch (_error) {
        continue;
      }
    }

    if (hasSuccessfulResponse) {
      const data = Array.from(merged.values())
        .sort((left, right) => {
          const priorityCompare = left.priority.localeCompare(right.priority, 'es', { sensitivity: 'base' });
          if (priorityCompare !== 0) {
            return priorityCompare;
          }

          const leftTime = left.claimDate ? new Date(left.claimDate).getTime() : 0;
          const rightTime = right.claimDate ? new Date(right.claimDate).getTime() : 0;
          return rightTime - leftTime;
        });

      return {
        status: data.length === 0 ? 'empty' : 'success',
        data,
        error: null
      };
    }

    return {
      status: 'error',
      data: null,
      error: 'No se pudo recuperar la bandeja de casos antifraude desde el backend.'
    };
  },
  async createCaseFromClaim(request: {
    claimId: string;
    requestedBy: string;
    sourceChannel?: string;
  }): Promise<ApiState<CaseFromClaimUiResponse>> {
    try {
      const response = await fetch(`${sqlApiBaseUrl}/cases/from-claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getActorHeaders()
        },
        body: JSON.stringify({
          claimId: request.claimId,
          requestedBy: request.requestedBy,
          sourceChannel: request.sourceChannel ?? 'frontend'
        })
      });

      if (response.ok) {
        const payload = (await response.json()) as CaseFromClaimResponse;
        return {
          status: 'success',
          data: {
            caseId: payload.caseKey,
            claimId: request.claimId,
            status: 'assembled',
            message: payload.message,
            canOpenDashboard: true
          },
          error: null
        };
      }

      const errorPayload = (await response.json().catch(() => null)) as { detail?: string; error?: { message?: string } } | null;
      return {
        status: 'error',
        data: null,
        error: errorPayload?.detail ?? errorPayload?.error?.message ?? 'No se pudo armar el caso desde el siniestro seleccionado.'
      };
    } catch (_error) {
      return {
        status: 'error',
        data: null,
        error: 'No se pudo conectar con el backend para armar el caso desde el siniestro.'
      };
    }
  },
  async uploadInternalJsonCase(request: InternalJsonUploadRequest): Promise<ApiState<InternalJsonUploadResponse>> {
    try {
      const response = await fetch(`${apiBaseUrl}/cases/evaluate/internal-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getActorHeaders()
        },
        body: JSON.stringify({
          requestedBy: request.requestedBy,
          sourceChannel: request.sourceChannel ?? 'frontend-upload',
          caseData: request.caseData
        })
      });

      if (response.ok) {
        const payload = (await response.json()) as InternalJsonUploadResponse;
        return {
          status: 'success',
          data: payload,
          error: null
        };
      }

      const errorPayload = (await response.json().catch(() => null)) as { detail?: string; error?: { message?: string } } | null;
      return {
        status: 'error',
        data: null,
        error: errorPayload?.detail ?? errorPayload?.error?.message ?? 'No se pudo crear el caso interno desde JSON.'
      };
    } catch (_error) {
      return {
        status: 'error',
        data: null,
        error: 'No se pudo conectar con el backend demo para cargar el caso JSON.'
      };
    }
  },
  async getCaseById(caseId: string): Promise<ApiState<CaseEvaluation>> {
    try {
      const headers = authService.getActorHeaders();
      const baseUrl = isSqlCaseId(caseId) ? sqlApiBaseUrl : sqlApiBaseUrl;
      const urls = [`${baseUrl}/cases/${caseId}`];

      if (isNumericCaseReference(caseId)) {
        urls.push(`${sqlApiBaseUrl}/monitoring/cases/${caseId}`);
      }

      for (const url of urls) {
        const response = await fetch(url, {
          headers
        });

        if (response.status === 404) {
          continue;
        }

        if (!response.ok) {
          return {
            status: 'error',
            data: null,
            error: 'No se pudo recuperar el detalle del caso desde el backend.'
          };
        }

        const payload = (await response.json()) as Parameters<typeof mapBackendCase>[0] | MonitoredCaseDetailApiResponse;
        const mapped =
          'subject' in payload || 'score' in payload && 'metadata' in payload
            ? mapBackendCase(payload as Parameters<typeof mapBackendCase>[0])
            : mapMonitoredCaseDetail(payload as MonitoredCaseDetailApiResponse);

        return {
          status: 'success',
          data: mapped,
          error: null
        };
      }

      return {
        status: 'empty',
        data: null,
        error: 'No se encontro un caso consolidado para el identificador solicitado.'
      };
    } catch (_error) {
      return {
        status: 'error',
        data: null,
        error: 'No se pudo conectar con el backend para recuperar el detalle del caso.'
      };
    }
  },
  async decideCase(caseId: string | number, request: DecisionRequest): Promise<ApiState<CaseResolution>> {
    const session = authService.getSession();
    const actor = session.user;
    const normalizedCaseId = String(caseId);
    const urls = [
      `${sqlApiBaseUrl}/cases/${normalizedCaseId}/decision`,
      `${sqlApiBaseUrl}/monitoring/cases/${normalizedCaseId}/decision`
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authService.getActorHeaders()
          },
          body: JSON.stringify({
            decision: mapDecisionActionToBackendValue(request.action),
            action: request.action,
            comment: request.comment?.trim() || null,
            comentario: request.comment?.trim() || null,
            actorId: actor?.id ?? 'frontend-user',
            actorName: actor?.name ?? 'Usuario frontend',
            actorRole: actor?.role ?? 'Supervisor',
            usuarioDecision: actor?.name ?? 'Usuario frontend',
            usuario: actor?.name ?? 'Usuario frontend'
          })
        });

        if (response.status === 404) {
          continue;
        }

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as { detail?: string; message?: string } | null;
          return {
            status: 'error',
            data: null,
            error: errorPayload?.detail ?? errorPayload?.message ?? 'No se pudo registrar la decision del caso.'
          };
        }

        const payload = (await response.json().catch(() => null)) as
          | {
              decision?: string | null;
              status?: string | null;
              workflowStatus?: string | null;
              decidedAt?: string | null;
              fechaDecision?: string | null;
              decidedBy?: string | null;
              usuarioDecision?: string | null;
              decidedByRole?: string | null;
              comment?: string | null;
              comentario?: string | null;
            }
          | null;

        return {
          status: 'success',
          data: mapDecisionValueToResolution(payload?.decision ?? payload?.status ?? request.action, {
            decidedAt: payload?.decidedAt ?? payload?.fechaDecision ?? new Date().toISOString(),
            decidedBy: payload?.decidedBy ?? payload?.usuarioDecision ?? actor?.name ?? 'Usuario frontend',
            decidedByRole: payload?.decidedByRole ?? actor?.role ?? 'Supervisor',
            comment: payload?.comment ?? payload?.comentario ?? request.comment ?? undefined
          }),
          error: null
        };
      } catch (_error) {
        continue;
      }
    }

    return {
      status: 'error',
      data: null,
      error: 'No se pudo registrar la decision del caso en el backend.'
    };
  },
  async resolveCase(caseId: string | number, request: ResolutionRequest): Promise<ApiState<CaseResolution>> {
    const session = authService.getSession();
    const actor = session.user;
    const normalizedCaseId = String(caseId);
    const urls = [
      `${sqlApiBaseUrl}/cases/${normalizedCaseId}/resolution`,
      `${sqlApiBaseUrl}/monitoring/cases/${normalizedCaseId}/resolution`
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authService.getActorHeaders()
          },
          body: JSON.stringify({
            fraudeConfirmado: request.fraudeConfirmado,
            comment: request.comment?.trim() || null,
            comentario: request.comment?.trim() || null,
            usuario: actor?.name ?? 'Usuario frontend',
            usuarioDecision: actor?.name ?? 'Usuario frontend',
            actorId: actor?.id ?? 'frontend-user',
            actorName: actor?.name ?? 'Usuario frontend',
            actorRole: actor?.role ?? 'Supervisor'
          })
        });

        if (response.status === 404) {
          continue;
        }

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as { detail?: string; message?: string } | null;
          return {
            status: 'error',
            data: null,
            error: errorPayload?.detail ?? errorPayload?.message ?? 'No se pudo registrar la resolucion final del caso.'
          };
        }

        const payload = (await response.json().catch(() => null)) as
          | {
              decision?: string | null;
              fechaDecision?: string | null;
              decidedAt?: string | null;
              usuarioDecision?: string | null;
              decidedBy?: string | null;
              decidedByRole?: string | null;
              comentario?: string | null;
              comment?: string | null;
              fraudeConfirmado?: boolean | null;
            }
          | null;

        return {
          status: 'success',
          data: {
            ...mapDecisionValueToResolution(payload?.decision, {
              decidedAt: payload?.decidedAt ?? payload?.fechaDecision ?? new Date().toISOString(),
              decidedBy: payload?.decidedBy ?? payload?.usuarioDecision ?? actor?.name ?? 'Usuario frontend',
              decidedByRole: payload?.decidedByRole ?? actor?.role ?? 'Supervisor',
              comment: payload?.comment ?? payload?.comentario ?? request.comment ?? undefined,
              fraudOutcome: payload?.fraudeConfirmado ?? request.fraudeConfirmado
            }),
            status: 'Cerrado',
            fraudOutcome: (payload?.fraudeConfirmado ?? request.fraudeConfirmado) ? 'FRAUDE' : 'NO FRAUDE'
          },
          error: null
        };
      } catch (_error) {
        continue;
      }
    }

    return {
      status: 'error',
      data: null,
      error: 'No se pudo registrar la resolucion final del caso en el backend.'
    };
  },
  getFeaturedCaseIds(): string[] {
    return Object.keys(caseStore);
  }
};
