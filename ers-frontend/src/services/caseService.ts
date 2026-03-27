import { ApiState } from '../models/domain';
import { CaseDecisionAction, CaseEvaluation, CaseResolution } from '../models/cases';
import { runtimeFlags } from '../config/runtimeFlags';
import { mockCases } from '../mocks/casesMock';
import { IdentifierType } from '../models/domain';
import { authService } from './authService';

function cloneCaseMap(data: Record<string, CaseEvaluation>): Record<string, CaseEvaluation> {
  return JSON.parse(JSON.stringify(data)) as Record<string, CaseEvaluation>;
}

function withDefaultResolution(caseData: CaseEvaluation): CaseEvaluation {
  return {
    ...caseData,
    resolution: caseData.resolution ?? { status: 'Pendiente' }
  };
}

const caseStore = cloneCaseMap(mockCases);
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

function mapIdentifierType(value?: string): IdentifierType {
  if (value === 'CUIL' || value === 'CUIT' || value === 'DNI') {
    return value;
  }
  return 'DNI';
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

function mapGraphNodeType(value: string): CaseEvaluation['relationshipGraph']['nodes'][number]['type'] {
  if (value === 'Empresa') {
    return 'Empresa';
  }
  if (value === 'Siniestro') {
    return 'Siniestro';
  }
  if (value === 'Cuenta') {
    return 'Cuenta';
  }
  if (value === 'Familiar') {
    return 'Familiar';
  }
  return 'Persona';
}

function mapGraphRiskLevel(value: string): CaseEvaluation['relationshipGraph']['nodes'][number]['riskLevel'] {
  if (value === 'critical') {
    return 'critical';
  }
  if (value === 'high') {
    return 'high';
  }
  if (value === 'medium') {
    return 'medium';
  }
  return 'low';
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
      source: alert.source,
      relatedVariable: alert.relatedVariable ?? 'pipeline',
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
      suggestedPriority: payload.reasoning?.suggestedPriority ?? 'MEDIUM',
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
      label: key.replace(/_/g, ' '),
      value: typeof value === 'number' ? value.toFixed(2) : value,
      impactLevel: value >= 18 ? 'critical' : value >= 12 ? 'high' : value >= 6 ? 'medium' : 'low',
      impactScore: value,
      description: `Contribucion relativa ${value}`
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
    claimsHistory: [],
    resolution: payload.decision
      ? {
          status:
            payload.decision.status === 'ACCEPTED'
              ? 'Aceptado'
              : payload.decision.status === 'DENIED'
                ? 'Denegado'
                : payload.decision.status === 'ESCALATED'
                  ? 'Escalado'
                  : 'Pendiente',
          decidedAt: payload.decision.decidedAt,
          decidedBy: payload.decision.decidedBy ?? payload.decision.decidedById ?? undefined,
          decidedByRole: payload.decision.decidedByRole ?? undefined,
          comment: payload.decision.comment ?? undefined
        }
      : { status: 'Pendiente' },
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
  comment: string;
};

export const caseService = {
  async getCaseById(caseId: string): Promise<ApiState<CaseEvaluation>> {
    if (runtimeFlags.useBackendCases) {
      try {
        const headers = authService.getActorHeaders();
        const [caseResponse, graphResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/cases/${caseId}`, {
            headers
          }),
          fetch(`${apiBaseUrl}/cases/${caseId}/graph`, {
            headers
          })
        ]);
        if (caseResponse.ok) {
          const payload = (await caseResponse.json()) as Parameters<typeof mapBackendCase>[0];
          const graphPayload = graphResponse.ok
            ? (await graphResponse.json()) as {
                caseId: string;
                nodes: Array<{
                  id: string;
                  label: string;
                  type: string;
                  riskLevel: string;
                  metadata: Record<string, string | number | boolean | undefined>;
                }>;
                edges: Array<{
                  id: string;
                  source: string;
                  target: string;
                  relationshipType: string;
                  severity: 'low' | 'medium' | 'high' | 'critical';
                }>;
              }
            : null;
          const mapped = mapBackendCase(payload);
          const relationshipGraph = graphPayload
            ? {
                nodes: graphPayload.nodes.map((node) => ({
                  id: node.id,
                  label: node.label,
                  type: mapGraphNodeType(node.type),
                  riskLevel: mapGraphRiskLevel(node.riskLevel),
                  metadata: node.metadata
                })),
                edges: graphPayload.edges.map((edge) => ({
                  id: edge.id,
                  source: edge.source,
                  target: edge.target,
                  relationshipType: edge.relationshipType,
                  severity: edge.severity
                }))
              }
            : mapped.relationshipGraph;

          return {
            status: 'success',
            data: {
              ...mapped,
              relationshipGraph
            },
            error: null
          };
        }
      } catch (_error) {
        if (!runtimeFlags.allowMockCaseFallback) {
          return {
            status: 'error',
            data: null,
            error: 'No se pudo recuperar el detalle del caso desde el backend demo.'
          };
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    const found = caseStore[caseId];

    if (!found) {
      return {
        status: 'empty',
        data: null,
        error: 'No se encontro un caso consolidado para el identificador solicitado.'
      };
    }

    return {
      status: 'success',
      data: withDefaultResolution(found),
      error: null
    };
  },
  async decideCase(caseId: string, request: DecisionRequest): Promise<ApiState<CaseResolution>> {
    const session = authService.getSession();
    const actor = session.user;

    if (runtimeFlags.useBackendCaseDecision) {
      try {
        const response = await fetch(`${apiBaseUrl}/cases/${caseId}/decision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authService.getActorHeaders()
          },
          body: JSON.stringify({
            action: request.action,
            comment: request.comment,
            actorId: actor?.id ?? 'frontend-user',
            actorName: actor?.name ?? 'Usuario frontend',
            actorRole: actor?.role ?? 'Supervisor'
          })
        });

        if (response.ok) {
          const payload = (await response.json()) as {
            status: 'ACCEPTED' | 'DENIED' | 'ESCALATED';
            decidedAt: string;
            decidedBy?: string | null;
            decidedByRole?: string | null;
            comment?: string | null;
          };
          return {
            status: 'success',
            data: {
              status:
                payload.status === 'ACCEPTED'
                  ? 'Aceptado'
                  : payload.status === 'DENIED'
                    ? 'Denegado'
                    : 'Escalado',
              decidedAt: payload.decidedAt,
              decidedBy: payload.decidedBy ?? actor?.name ?? 'Usuario frontend',
              decidedByRole: payload.decidedByRole ?? actor?.role ?? 'Supervisor',
              comment: payload.comment ?? request.comment
            },
            error: null
          };
        }

        const errorPayload = (await response.json().catch(() => null)) as { detail?: string } | null;
        return {
          status: 'error',
          data: null,
          error: errorPayload?.detail ?? 'No se pudo resolver el caso en backend.'
        };
      } catch (_error) {
        if (!runtimeFlags.allowMockDecisionFallback) {
          return {
            status: 'error',
            data: null,
            error: 'No se pudo registrar la resolucion manual en el backend demo.'
          };
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    const found = caseStore[caseId];

    if (!found) {
      return {
        status: 'error',
        data: null,
        error: 'No se encontro el caso a resolver.'
      };
    }

    const nextResolution: CaseResolution = {
      status:
        request.action === 'accept' ? 'Aceptado' : request.action === 'deny' ? 'Denegado' : 'Escalado',
      decidedAt: new Date().toISOString(),
      decidedBy: actor?.name ?? 'Supervisor mock',
      decidedByRole: actor?.role ?? 'Supervisor',
      comment: request.comment
    };

    caseStore[caseId] = {
      ...found,
      resolution: nextResolution
    };

    return {
      status: 'success',
      data: nextResolution,
      error: null
    };
  },
  getFeaturedCaseIds(): string[] {
    return Object.keys(caseStore);
  }
};
