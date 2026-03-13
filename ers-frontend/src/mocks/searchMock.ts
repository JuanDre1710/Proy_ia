import { RecentSearch, SearchOutcome } from '../models/search';

export const mockSearchOutcomes: Record<string, SearchOutcome> = {
  '30111222': 'found',
  '20333444556': 'found',
  '27123456789': 'found',
  '27222333444': 'deceased',
  '27999888776': 'insufficient_data',
  '20999999999': 'not_found',
  '30000000000': 'integration_error'
};

export const mockRecentSearchesSeed: RecentSearch[] = [
  {
    id: 'REC-1',
    identifier: '30111222',
    identifierType: 'DNI',
    searchedAt: '2026-03-13T08:40:00',
    outcome: 'found',
    summary: 'Caso con riesgo alto y alertas activas.',
    userId: 'usr-eval'
  },
  {
    id: 'REC-2',
    identifier: '27222333444',
    identifierType: 'CUIL',
    searchedAt: '2026-03-13T09:05:00',
    outcome: 'deceased',
    summary: 'Padron informa persona fallecida.',
    userId: 'usr-eval'
  },
  {
    id: 'REC-3',
    identifier: '20333444556',
    identifierType: 'CUIT',
    searchedAt: '2026-03-13T09:22:00',
    outcome: 'found',
    summary: 'Caso apto para revision operativa.',
    userId: 'usr-supervisor'
  }
];
