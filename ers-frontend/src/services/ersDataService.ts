import {
  ApiState,
  AuditLogEntry,
  RiskEvaluation,
  RiskThresholdConfig,
  SearchIdentifier
} from '../models/domain';
import { mockAuditLogs, mockEvaluations, mockThresholds } from '../mocks/ersMock';

let thresholdsState: RiskThresholdConfig = mockThresholds;
let logsState: AuditLogEntry[] = [...mockAuditLogs];

export const ersDataService = {
  getEvaluationByIdentifier(identifier: string): RiskEvaluation | null {
    return mockEvaluations[identifier] ?? null;
  },
  getThresholds(): RiskThresholdConfig {
    return thresholdsState;
  },
  getLogs(): AuditLogEntry[] {
    return logsState;
  },
  async evaluate(identifier: SearchIdentifier, actor: { name: string; role: string } | null): Promise<ApiState<RiskEvaluation>> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const result = mockEvaluations[identifier.value];

    logsState = [
      {
        id: `LOG-${logsState.length + 1}`,
        timestamp: new Date().toISOString(),
        actor: actor?.name ?? 'Sistema',
        role: actor?.role ?? 'N/A',
        action: `Consulta por ${identifier.type}`,
        entity: identifier.value,
        result: result ? `RIESGO ${result.score.level.toUpperCase()}` : 'SIN RESULTADOS',
        ip: '10.20.1.99'
      },
      ...logsState
    ];

    if (!result) {
      return { status: 'empty', data: null, error: null };
    }

    return { status: 'success', data: result, error: null };
  },
  updateThresholds(
    payload: Omit<RiskThresholdConfig, 'updatedAt' | 'updatedBy'>,
    actor: { name: string; role: string } | null
  ): RiskThresholdConfig {
    thresholdsState = {
      ...payload,
      updatedAt: new Date().toISOString(),
      updatedBy: actor?.name ?? 'Sistema'
    };

    logsState = [
      {
        id: `LOG-${logsState.length + 1}`,
        timestamp: new Date().toISOString(),
        actor: actor?.name ?? 'Sistema',
        role: actor?.role ?? 'N/A',
        action: 'Actualizacion de umbrales',
        entity: 'risk-thresholds',
        result: 'OK',
        ip: '10.20.1.15'
      },
      ...logsState
    ];

    return thresholdsState;
  }
};
