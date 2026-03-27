import { IdentifierType } from '../models/domain';
import {
  IdentifierValidationResult,
  RecentSearch,
  SearchRequest,
  SearchResponse
} from '../models/search';
import { runtimeFlags } from '../config/runtimeFlags';
import { mockSearchOutcomes, mockRecentSearchesSeed } from '../mocks/searchMock';
import { authService } from './authService';
import { validateIdentifierWithFeedback } from '../utils/identifier';

const dailyLimit = 12;
let recentSearchesState: RecentSearch[] = [...mockRecentSearchesSeed];
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

function buildSummary(outcome: SearchResponse['outcome']): string {
  switch (outcome) {
    case 'found':
      return 'Caso evaluable disponible para apertura.';
    case 'deceased':
      return 'Padron informa persona fallecida.';
    case 'insufficient_data':
      return 'No hay suficientes datos consolidados.';
    case 'integration_error':
      return 'La integracion demo devolvio un error tecnico.';
    case 'not_found':
    default:
      return 'No se encontro informacion asociada.';
  }
}

function buildMessage(outcome: SearchResponse['outcome'], type: IdentifierType): string {
  switch (outcome) {
    case 'found':
      return `${type} validado. La evaluacion esta lista para abrirse en el dashboard del caso.`;
    case 'deceased':
      return 'La persona figura como fallecida en la fuente consultada.';
    case 'insufficient_data':
      return 'La identidad existe, pero no hay datos suficientes para una evaluacion confiable.';
    case 'integration_error':
      return 'Se produjo un error tecnico al consultar el backend demo. Reintenta mas tarde.';
    case 'not_found':
    default:
      return 'No se encontraron datos para el identificador consultado.';
  }
}

function isSameDay(dateIso: string, referenceIso: string): boolean {
  return dateIso.slice(0, 10) === referenceIso.slice(0, 10);
}

function registerRecentSearch(entry: Omit<RecentSearch, 'id'>): void {
  recentSearchesState = [
    {
      id: `REC-${recentSearchesState.length + 1}`,
      ...entry
    },
    ...recentSearchesState
  ];
}

export const searchService = {
  validateIdentifier(value: string): IdentifierValidationResult {
    return validateIdentifierWithFeedback(value);
  },
  async evaluateIdentifier(request: SearchRequest): Promise<SearchResponse> {
    const validation = validateIdentifierWithFeedback(request.identifier);

    if (!validation.isValid || !validation.identifierType) {
      throw new Error(validation.error ?? 'Identificador invalido.');
    }

    if (runtimeFlags.useBackendSearch) {
      try {
        const backendResponse = await fetch(`${apiBaseUrl}/cases/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authService.getActorHeaders()
          },
          body: JSON.stringify({
            identifier: validation.normalizedValue,
            requestedBy: request.requestedBy,
            sourceChannel: 'frontend'
          })
        });

        if (!backendResponse.ok) {
          throw new Error(`HTTP ${backendResponse.status}`);
        }

        const payload = (await backendResponse.json()) as {
          caseId: string;
          identifier: string;
          identifierType?: IdentifierType;
          status: string;
          message: string;
          canOpenDashboard: boolean;
        };

        const outcome: SearchResponse['outcome'] =
          payload.status === 'accepted_for_processing' ||
          payload.status === 'ready_for_rules' ||
          payload.status === 'ready_for_reasoning' ||
          payload.status === 'scored'
            ? 'found'
            : payload.status === 'waiting_for_enrichment'
              ? 'insufficient_data'
              : payload.status === 'daily_limit_reached'
                ? 'integration_error'
                : 'not_found';

        const response: SearchResponse = {
          caseId: payload.caseId,
          identifier: payload.identifier,
          identifierType: payload.identifierType ?? validation.identifierType,
          outcome,
          message: payload.message,
          canOpenDashboard: payload.canOpenDashboard
        };

        registerRecentSearch({
          caseId: response.caseId,
          identifier: response.identifier,
          identifierType: response.identifierType,
          searchedAt: new Date().toISOString(),
          outcome: response.outcome,
          summary: buildSummary(response.outcome),
          userId: request.requestedBy
        });

        return response;
      } catch (_error) {
        if (!runtimeFlags.allowMockSearchFallback) {
          throw new Error('No se pudo consultar el backend demo para evaluar el identificador.');
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 700));

    const outcome = mockSearchOutcomes[validation.normalizedValue] ?? 'not_found';
    const response: SearchResponse = {
      caseId: validation.normalizedValue,
      identifier: validation.normalizedValue,
      identifierType: validation.identifierType,
      outcome,
      message: buildMessage(outcome, validation.identifierType),
      canOpenDashboard:
        outcome === 'found' || outcome === 'deceased' || outcome === 'insufficient_data'
    };

    registerRecentSearch({
      caseId: response.caseId,
      identifier: response.identifier,
      identifierType: response.identifierType,
      searchedAt: new Date().toISOString(),
      outcome: response.outcome,
      summary: buildSummary(response.outcome),
      userId: request.requestedBy
    });

    return response;
  },
  getRecentSearches(userId: string): RecentSearch[] {
    // TODO: replace with a paginated recent-searches endpoint per authenticated user.
    return recentSearchesState
      .filter((item) => item.userId === userId)
      .sort((left, right) => right.searchedAt.localeCompare(left.searchedAt))
      .slice(0, 6);
  },
  getDailyUsage(userId: string): { used: number; limit: number; remaining: number } {
    // TODO: replace with backend quota metadata when daily limits become server-driven.
    const today = new Date().toISOString();
    const used = recentSearchesState.filter(
      (item) => item.userId === userId && isSameDay(item.searchedAt, today)
    ).length;

    return {
      used,
      limit: dailyLimit,
      remaining: Math.max(dailyLimit - used, 0)
    };
  }
};
