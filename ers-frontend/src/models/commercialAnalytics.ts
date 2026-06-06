export interface CommercialFilters {
  startDate: string;
  endDate: string;
  branchId: string;
  channelId: string;
  productId: string;
  planId: string;
  sellerId: string;
}

export interface CommercialListQuery {
  take: number;
  offset: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CommercialSummaryCard {
  label: string;
  value: string;
  detail: string;
}

export interface CommercialTopProduct {
  id: number;
  productTypeId: number;
  name: string;
  policiesSold: number;
  uniqueClients: number;
  totalPremium: number;
  lastPolicyDate: string | null;
}

export interface CommercialClientWithoutPolicy {
  clientId: number;
  displayName: string;
  documentNumber: string;
  email: string;
  hasQuotes: boolean;
  lastQuoteDate: string | null;
}

export interface CommercialQuotedNotBoughtClient {
  clientId: number;
  displayName: string;
  documentNumber: string;
  email: string;
  quoteId: number;
  quoteDate: string;
  productTypeId: number;
  productTypeDescription: string;
  boughtPolicyAfterQuote: boolean;
  neverHadPolicy: boolean;
}

export interface CommercialAppliedFilterInfo {
  date: boolean;
  branch: boolean;
  channel: boolean;
  product: boolean;
  seller: boolean;
}

export interface CommercialBusinessCriteria {
  policiesSoldRule: string;
  productCommercializationRule: string;
  clientsWithoutPoliciesRule: string;
  quotedNotBoughtRule: string;
  limitations: string[];
}

export interface CommercialSummaryData {
  summaryCards: CommercialSummaryCard[];
  topProduct: CommercialTopProduct | null;
  policyStatusBreakdown: Array<{ status: string; count: number }>;
  appliedFilters: CommercialAppliedFilterInfo;
  unsupportedFilters: string[];
  criteria: CommercialBusinessCriteria;
  totals: {
    policiesSold: number;
    clientsWithoutPolicies: number;
    quotedNotBought: number;
  };
}

export interface CommercialPagedResult<T> {
  items: T[];
  totalCount: number;
  aggregateCounts?: Record<string, number>;
  offset: number;
  take: number;
}

export interface CommercialProductDetail {
  productId: number;
  productName: string;
  productTypeId: number;
  policiesSold: number;
  uniqueClients: number;
  totalPremium: number;
  lastPolicyDate: string | null;
  plans: Array<{
    planId: number;
    planName: string;
    policiesSold: number;
    uniqueClients: number;
    totalPremium: number;
  }>;
  branches: Array<{
    label: string;
    value: number;
    policiesSold: number;
    uniqueClients: number;
    totalPremium: number;
  }>;
  channels: Array<{
    label: string;
    value: number;
    policiesSold: number;
    uniqueClients: number;
    totalPremium: number;
  }>;
  sellers: Array<{
    label: string;
    value: number;
    policiesSold: number;
    uniqueClients: number;
    totalPremium: number;
  }>;
}

export interface CommercialClientDetail {
  clientId: number;
  displayName: string;
  documentNumber: string;
  email: string;
  totalQuotes: number;
  lastQuoteDate: string | null;
  totalPolicies: number;
  lastPolicyDate: string | null;
  hasAnyPolicy: boolean;
  hasQuotesWithoutPurchase: boolean;
  recentQuotes: Array<{
    quoteId: number;
    quoteDate: string;
    productTypeId: number;
    productTypeDescription: string;
  }>;
  recentPolicies: Array<{
    policyId: number;
    policyDate: string | null;
    policyStatus: string;
    productId: number | null;
    productName: string;
    planId: number | null;
    planName: string;
  }>;
}
