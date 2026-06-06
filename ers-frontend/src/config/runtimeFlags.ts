function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export const runtimeFlags = {
  useBackendSearch: parseBooleanFlag(import.meta.env.VITE_USE_DEMO_BACKEND_SEARCH, true),
  useBackendCases: parseBooleanFlag(import.meta.env.VITE_USE_DEMO_BACKEND_CASES, true),
  useBackendCaseDecision: parseBooleanFlag(import.meta.env.VITE_USE_DEMO_BACKEND_CASE_DECISION, true),
  allowMockSearchFallback: parseBooleanFlag(import.meta.env.VITE_ALLOW_MOCK_SEARCH_FALLBACK, true),
  allowMockCaseFallback: parseBooleanFlag(import.meta.env.VITE_ALLOW_MOCK_CASE_FALLBACK, true),
  allowMockDecisionFallback: parseBooleanFlag(import.meta.env.VITE_ALLOW_MOCK_DECISION_FALLBACK, true)
};
