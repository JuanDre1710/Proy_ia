import { ApiState } from '../models/domain';
import { CaseEvaluation } from '../models/cases';
import { mockCases } from '../mocks/casesMock';

export const caseService = {
  // TODO: replace this mock lookup with GET /api/cases/:caseId in the .NET backend.
  async getCaseById(caseId: string): Promise<ApiState<CaseEvaluation>> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const found = mockCases[caseId];

    if (!found) {
      return {
        status: 'empty',
        data: null,
        error: 'No se encontro un caso consolidado para el identificador solicitado.'
      };
    }

    return {
      status: 'success',
      data: found,
      error: null
    };
  },
  getFeaturedCaseIds(): string[] {
    return Object.keys(mockCases);
  }
};
