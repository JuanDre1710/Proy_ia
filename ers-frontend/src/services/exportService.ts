import { CaseEvaluation } from '../models/cases';
import { RiskEvaluation } from '../models/domain';
import { ExportRequest, ExportResult } from '../models/export';

function sanitizeSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function buildFilename(request: ExportRequest): string {
  const date = new Date().toISOString().slice(0, 10);
  const identifier = request.evaluation.personalInfo.document;
  const result = sanitizeSegment(request.evaluation.riskScore.category);
  return `${date}_${identifier}_${result}.${request.format}`;
}

function download(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildCsvContent(evaluation: CaseEvaluation): string {
  const rows = [
    ['campo', 'valor'],
    ['identificador', evaluation.personalInfo.document],
    ['nombre', evaluation.personalInfo.fullName],
    ['scoreIA', String(evaluation.riskScore.score)],
    ['resultado', evaluation.riskScore.category],
    ['alertas', String(evaluation.alerts.length)],
    ['justificaciones', evaluation.aiExplanation.executiveSummary],
    ['timestamp', new Date().toISOString()],
    ['firmaDigital', 'pendiente-futuro']
  ];

  return rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function buildMockPdfContent(evaluation: CaseEvaluation): string {
  return [
    'ERS - Informe de Evaluacion',
    '',
    `Identificador: ${evaluation.personalInfo.document}`,
    `Nombre: ${evaluation.personalInfo.fullName}`,
    `Score IA: ${evaluation.riskScore.score}`,
    `Resultado: ${evaluation.riskScore.category}`,
    `Alertas: ${evaluation.alerts.length}`,
    `Justificaciones: ${evaluation.aiExplanation.executiveSummary}`,
    `Timestamp: ${new Date().toISOString()}`,
    'Firma digital: soporte futuro'
  ].join('\n');
}

function mapLegacyEvaluation(evaluation: RiskEvaluation): CaseEvaluation {
  return {
    caseId: evaluation.person.identifier,
    requestedAt: evaluation.requestedAt,
    analystSummary: evaluation.score.summary,
    generalStatus: 'Evaluable',
    riskScore: {
      score: evaluation.score.score,
      category:
        evaluation.score.level === 'Alto'
          ? 'Sospechoso de fraude'
          : evaluation.score.level === 'Medio'
            ? 'Requiere revision'
            : 'Normal',
      explanation: evaluation.score.summary
    },
    alerts: evaluation.alerts.map((alert) => ({
      id: alert.id,
      type: 'Conductual',
      severity: alert.level === 'high' ? 'error' : alert.level === 'medium' ? 'warning' : 'info',
      title: alert.title,
      shortDescription: alert.detail,
      detail: alert.detail,
      source: 'Motor ERS',
      relatedVariable: alert.title
    })),
    aiExplanation: {
      totalScore: evaluation.score.score,
      textualClassification:
        evaluation.score.level === 'Alto'
          ? 'Sospechoso de fraude'
          : evaluation.score.level === 'Medio'
            ? 'Requiere revision'
            : 'Normal',
      executiveSummary: evaluation.score.summary,
      variables: evaluation.score.drivers.map((driver, index) => ({
        id: `driver-${index + 1}`,
        name: driver.label,
        impact: driver.impact,
        weight: driver.weight,
        description: driver.label
      })),
      evaluatorRecommendation: evaluation.score.summary
    },
    riskHeatmap: evaluation.heatmap.map((cell) => ({
      key: cell.variable,
      label: cell.variable,
      value: cell.value,
      impactLevel:
        cell.intensity >= 85 ? 'critical' : cell.intensity >= 65 ? 'high' : cell.intensity >= 35 ? 'medium' : 'low',
      impactScore: cell.intensity,
      description: cell.variable
    })),
    relationshipGraph: {
      nodes: evaluation.relationships.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        type: node.category === 'Empresa' ? 'Empresa' : node.category === 'Cuenta' ? 'Cuenta' : 'Persona',
        riskLevel:
          node.riskLevel === 'high' ? 'high' : node.riskLevel === 'medium' ? 'medium' : 'low',
        metadata: {}
      })),
      edges: evaluation.relationships.edges.map((edge, index) => ({
        id: `edge-${index + 1}`,
        source: edge.source,
        target: edge.target,
        relationshipType: edge.reason,
        severity: 'medium'
      }))
    },
    personalInfo: {
      fullName: evaluation.person.fullName,
      document: evaluation.person.identifier,
      documentType: 'DNI',
      birthDate: evaluation.person.birthDate,
      age: evaluation.person.age,
      verified: evaluation.person.verified,
      deceased: false,
      address: evaluation.person.address,
      locality: evaluation.person.locality,
      province: evaluation.person.province,
      phone: evaluation.person.phone,
      email: evaluation.person.email
    },
    financialInfo: {
      creditScore: evaluation.financial.creditScore,
      debtRatio: evaluation.financial.debtRatio,
      bancarizationLevel: evaluation.financial.bancarizationLevel,
      activeLoans: evaluation.financial.activeLoans,
      bouncedChecks: evaluation.financial.bouncedChecks,
      monthlyIncomeEstimate: evaluation.employmentFiscal.monthlyIncomeRange,
      observation: evaluation.financial.observation
    },
    laborFiscalInfo: {
      taxStatus: evaluation.employmentFiscal.taxStatus,
      mainActivity: evaluation.employmentFiscal.mainActivity,
      employerOrCompany: evaluation.employmentFiscal.employer,
      incomeBracket: evaluation.employmentFiscal.monthlyIncomeRange,
      registeredEmployees: evaluation.employmentFiscal.registeredEmployees,
      fiscalObservation: evaluation.employmentFiscal.observation
    },
    claimsHistory: evaluation.claims.map((claim) => ({
      id: claim.id,
      date: claim.date,
      type: claim.type,
      amount: claim.amount,
      status: claim.status,
      counterpart: 'N/A',
      notes: claim.notes
    }))
  };
}

export const exportService = {
  async exportEvaluation(request: ExportRequest): Promise<ExportResult> {
    await new Promise((resolve) => setTimeout(resolve, request.format === 'pdf' ? 900 : 650));

    const filename = buildFilename(request);
    const content = request.format === 'csv'
      ? buildCsvContent(request.evaluation)
      : buildMockPdfContent(request.evaluation);
    const type = request.format === 'csv' ? 'text/csv;charset=utf-8' : 'application/pdf';

    download(content, filename, type);

    return {
      success: true,
      filename,
      format: request.format,
      message: `Informe ${request.format.toUpperCase()} exportado correctamente: ${filename}`
    };
  },
  exportCsv(evaluation: RiskEvaluation): void {
    void this.exportEvaluation({ format: 'csv', evaluation: mapLegacyEvaluation(evaluation) });
  },
  exportPdf(evaluation: RiskEvaluation): void {
    void this.exportEvaluation({ format: 'pdf', evaluation: mapLegacyEvaluation(evaluation) });
  }
};
