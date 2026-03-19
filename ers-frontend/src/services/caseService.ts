import { ApiState } from '../models/domain';
import { CaseDecisionAction, CaseEvaluation, CaseResolution } from '../models/cases';
import { mockCases } from '../mocks/casesMock';

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

export const caseService = {
  // TODO: replace this mock lookup with GET /api/cases/:caseId in the .NET backend.
  async getCaseById(caseId: string): Promise<ApiState<CaseEvaluation>> {
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
  async decideCase(caseId: string, action: CaseDecisionAction): Promise<ApiState<CaseResolution>> {
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
      status: action === 'accept' ? 'Aceptado' : 'Denegado',
      decidedAt: new Date().toISOString(),
      decidedBy: 'Supervisor mock'
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
