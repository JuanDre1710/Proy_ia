import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UiStatus } from '../../../models/domain';
import { IdentifierValidationResult, RecentSearch, SearchResponse } from '../../../models/search';
import { searchService } from '../../../services/searchService';
import { useAuth } from '../../../state/AuthContext';

interface SearchFlowState {
  status: UiStatus;
  response: SearchResponse | null;
  error: string | null;
}

export function useSearchFlow(): {
  flow: SearchFlowState;
  recentSearches: RecentSearch[];
  dailyUsage: { used: number; limit: number; remaining: number };
  validateInput: (value: string) => IdentifierValidationResult;
  submitSearch: (identifier: string) => Promise<void>;
  openRecentSearch: (search: RecentSearch) => void;
} {
  const { session } = useAuth();
  const navigate = useNavigate();
  const userId = session.user?.id ?? 'anonymous';
  const [flow, setFlow] = useState<SearchFlowState>({
    status: 'idle',
    response: null,
    error: null
  });
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() =>
    searchService.getRecentSearches(userId)
  );
  const [dailyUsage, setDailyUsage] = useState(() => searchService.getDailyUsage(userId));

  const refreshSidebarState = (): void => {
    setRecentSearches(searchService.getRecentSearches(userId));
    setDailyUsage(searchService.getDailyUsage(userId));
  };

  const submitSearch = async (identifier: string): Promise<void> => {
    const validation = searchService.validateIdentifier(identifier);

    if (!validation.isValid) {
      setFlow({
        status: 'error',
        response: null,
        error: validation.error
      });
      return;
    }

    setFlow({
      status: 'loading',
      response: null,
      error: null
    });

    try {
      const response = await searchService.evaluateIdentifier({
        identifier: validation.normalizedValue,
        requestedBy: userId
      });

      refreshSidebarState();

      if (response.canOpenDashboard) {
        setFlow({
          status: 'success',
          response,
          error: null
        });
        navigate(`/cases/${response.caseId ?? response.identifier}`);
        return;
      }

      setFlow({
        status: response.outcome === 'not_found' ? 'empty' : 'error',
        response,
        error: response.message
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado en la busqueda.';
      setFlow({
        status: 'error',
        response: null,
        error: message
      });
    }
  };

  const openRecentSearch = (search: RecentSearch): void => {
    if (
      search.outcome === 'found' ||
      search.outcome === 'deceased' ||
      search.outcome === 'insufficient_data'
    ) {
      navigate(`/cases/${search.caseId ?? search.identifier}`);
      return;
    }

    setFlow({
      status: search.outcome === 'not_found' ? 'empty' : 'error',
      response: {
        identifier: search.identifier,
        identifierType: search.identifierType,
        outcome: search.outcome,
        message: search.summary,
        canOpenDashboard: false
      },
      error: search.summary
    });
  };

  return {
    flow,
    recentSearches,
    dailyUsage,
    validateInput: searchService.validateIdentifier,
    submitSearch,
    openRecentSearch
  };
}
