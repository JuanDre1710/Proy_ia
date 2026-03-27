import { IdentifierType } from './domain';

export type SearchOutcome =
  | 'found'
  | 'not_found'
  | 'deceased'
  | 'insufficient_data'
  | 'integration_error';

export interface SearchRequest {
  identifier: string;
  requestedBy: string;
}

export interface SearchResponse {
  caseId?: string;
  identifier: string;
  identifierType: IdentifierType;
  outcome: SearchOutcome;
  message: string;
  canOpenDashboard: boolean;
}

export interface RecentSearch {
  id: string;
  caseId?: string;
  identifier: string;
  identifierType: IdentifierType;
  searchedAt: string;
  outcome: SearchOutcome;
  summary: string;
  userId: string;
}

export interface IdentifierValidationResult {
  isValid: boolean;
  normalizedValue: string;
  identifierType: IdentifierType | null;
  error: string | null;
}
