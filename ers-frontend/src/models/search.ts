import { IdentifierType } from './domain';

export type SearchOutcome =
  | 'found'
  | 'not_found'
  | 'deceased'
  | 'insufficient_data'
  | 'integration_error';

export type IdentitySearchStatus =
  | 'not_found'
  | 'person_without_claims'
  | 'single_claim'
  | 'multiple_claims';

export interface ActiveClaimSummary {
  claimId: string;
  claimNumber: string;
  occurredAt?: string | null;
  statusCode: string;
  statusLabel: string;
  claimedAmount?: number | null;
  estimatedAmount?: number | null;
  claimTypeId?: string | null;
  policyNumber?: string | null;
  certificateNumber?: string | null;
}

export interface SearchPerson {
  personId: string;
  identifierValue: string;
  identifierType: IdentifierType;
  documentType?: string | null;
  documentNumber?: string | null;
  taxId?: string | null;
  displayName: string;
  email?: string | null;
}

export interface SearchRequest {
  identifier: string;
  requestedBy: string;
}

export interface SearchResponse {
  caseId?: string;
  identifier: string;
  identifierType: IdentifierType;
  searchStatus: IdentitySearchStatus;
  outcome: SearchOutcome;
  message: string;
  canOpenDashboard: boolean;
  person?: SearchPerson | null;
  activeClaims: ActiveClaimSummary[];
  totalClaims: number;
  canAutoAnalyze: boolean;
  requiresClaimSelection: boolean;
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
