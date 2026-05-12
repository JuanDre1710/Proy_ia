import { apiBaseUrls } from '../config/apiBaseUrls';
import {
  CommercialClientDetail,
  CommercialClientWithoutPolicy,
  CommercialFilters,
  CommercialListQuery,
  CommercialPagedResult,
  CommercialProductDetail,
  CommercialQuotedNotBoughtClient,
  CommercialSummaryData,
  CommercialSummaryCard,
  CommercialTopProduct
} from '../models/commercialAnalytics';
import { ApiState } from '../models/domain';
import { authService } from './authService';

const sqlApiBaseUrl = apiBaseUrls.sqlBackend;
const commercialRequestTimeoutMs = 45000;

function formatDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('es-AR');
}

function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

function formatInteger(value: number | null | undefined): string {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

function buildQueryString(filters: CommercialFilters, query?: Partial<CommercialListQuery>): string {
  const params = new URLSearchParams();

  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.branchId) params.set('branchId', filters.branchId);
  if (filters.channelId) params.set('channelId', filters.channelId);
  if (filters.productId) params.set('productId', filters.productId);
  if (filters.planId) params.set('planId', filters.planId);
  if (filters.sellerId) params.set('sellerId', filters.sellerId);

  if (typeof query?.take === 'number') params.set('take', String(query.take));
  if (typeof query?.offset === 'number') params.set('offset', String(query.offset));
  if (query?.sortBy) params.set('sortBy', query.sortBy);
  if (query?.sortDirection) params.set('sortDirection', query.sortDirection);

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

async function parseJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

async function fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), commercialRequestTimeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function readConnectionError(error: unknown, fallback: string): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'La consulta comercial supero el tiempo de espera. Ajusta filtros o reintenta.';
  }

  if (error instanceof TypeError) {
    return 'No se pudo conectar con el backend comercial.';
  }

  return fallback;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const errorPayload = await parseJson<{ detail?: string; message?: string; error?: { message?: string } }>(response);

  if (response.status === 401) {
    return 'La sesion no es valida para consultar el modulo comercial.';
  }
  if (response.status === 403) {
    return errorPayload?.error?.message ?? 'No tenes permisos para acceder al modulo comercial.';
  }
  if (response.status === 404) {
    return errorPayload?.detail ?? errorPayload?.message ?? 'No se encontro el recurso comercial solicitado.';
  }
  if (response.status >= 500) {
    return 'El backend comercial devolvio un error interno.';
  }

  return errorPayload?.error?.message ?? errorPayload?.detail ?? errorPayload?.message ?? fallback;
}

function buildSummaryCards(payload: SummaryResponse): CommercialSummaryCard[] {
  const topProduct = payload.summary.mostCommercializedProduct;

  return [
    {
      label: 'Polizas vendidas',
      value: formatInteger(payload.summary.policiesSoldCount),
      detail: 'Conteo operativo sobre emisiones registradas en SQL Server'
    },
    {
      label: 'Producto mas comercializado',
      value: topProduct?.productName?.trim() || 'Sin dato',
      detail: topProduct ? `${formatInteger(topProduct.policiesSold)} polizas emitidas` : 'No hay ventas para el filtro actual'
    },
    {
      label: 'Clientes sin poliza',
      value: formatInteger(payload.summary.clientsWithoutPoliciesCount),
      detail: 'Clientes internos que no figuran como titulares en polizas'
    },
    {
      label: 'Cotizaron y no compraron',
      value: formatInteger(payload.summary.quotedNotBoughtCount),
      detail: 'Clientes con ultima cotizacion sin poliza posterior'
    }
  ];
}

interface SummaryResponse {
  unsupportedFilters?: string[];
  supportedFilters?: {
    date?: boolean;
    branch?: boolean;
    channel?: boolean;
    product?: boolean;
    seller?: boolean;
  };
  summary: {
    policiesSoldCount?: number;
    clientsWithoutPoliciesCount?: number;
    quotedNotBoughtCount?: number;
    mostCommercializedProduct?: {
      productId?: number;
      productTypeId?: number;
      productName?: string;
      policiesSold?: number;
      uniqueClients?: number;
      totalPremium?: number;
      lastPolicyDate?: string | null;
    } | null;
    policyStatusBreakdown?: Array<{ status?: string; count?: number }>;
    criteria?: {
      policiesSoldRule?: string;
      productCommercializationRule?: string;
      clientsWithoutPoliciesRule?: string;
      quotedNotBoughtRule?: string;
      limitations?: string[];
    };
  };
}

interface TopProductsResponse {
  totalCount?: number;
  offset?: number;
  take?: number;
  items?: Array<{
    productId?: number;
    productTypeId?: number;
    productName?: string;
    policiesSold?: number;
    uniqueClients?: number;
    totalPremium?: number;
    lastPolicyDate?: string | null;
  }>;
}

interface ClientsWithoutPoliciesResponse {
  totalCount?: number;
  withQuotesCount?: number;
  withoutQuotesCount?: number;
  offset?: number;
  take?: number;
  items?: Array<{
    clientId?: number;
    displayName?: string;
    documentNumber?: string | null;
    email?: string | null;
    hasQuotes?: boolean;
    lastQuoteDate?: string | null;
  }>;
}

interface QuotedNotBoughtResponse {
  totalCount?: number;
  boughtAfterQuoteCount?: number;
  neverHadPolicyCount?: number;
  unclassifiedCount?: number;
  offset?: number;
  take?: number;
  items?: Array<{
    clientId?: number;
    displayName?: string;
    documentNumber?: string | null;
    email?: string | null;
    quoteId?: number;
    quoteDate?: string;
    productTypeId?: number;
    productTypeDescription?: string | null;
    boughtPolicyAfterQuote?: boolean;
    neverHadPolicy?: boolean;
  }>;
}

interface ProductDetailResponse {
  productId?: number;
  productName?: string;
  productTypeId?: number;
  policiesSold?: number;
  uniqueClients?: number;
  totalPremium?: number;
  lastPolicyDate?: string | null;
  plans?: Array<{
    planId?: number;
    planName?: string;
    policiesSold?: number;
    uniqueClients?: number;
    totalPremium?: number;
  }>;
  branches?: Array<{
    label?: string;
    value?: number;
    policiesSold?: number;
    uniqueClients?: number;
    totalPremium?: number;
  }>;
  channels?: Array<{
    label?: string;
    value?: number;
    policiesSold?: number;
    uniqueClients?: number;
    totalPremium?: number;
  }>;
  sellers?: Array<{
    label?: string;
    value?: number;
    policiesSold?: number;
    uniqueClients?: number;
    totalPremium?: number;
  }>;
}

interface ClientDetailResponse {
  clientId?: number;
  displayName?: string;
  documentNumber?: string | null;
  email?: string | null;
  totalQuotes?: number;
  lastQuoteDate?: string | null;
  totalPolicies?: number;
  lastPolicyDate?: string | null;
  hasAnyPolicy?: boolean;
  hasQuotesWithoutPurchase?: boolean;
  recentQuotes?: Array<{
    quoteId?: number;
    quoteDate?: string;
    productTypeId?: number;
    productTypeDescription?: string | null;
  }>;
  recentPolicies?: Array<{
    policyId?: number;
    policyDate?: string | null;
    policyStatus?: string | null;
    productId?: number | null;
    productName?: string | null;
    planId?: number | null;
    planName?: string | null;
  }>;
}

function mapTopProduct(item: NonNullable<TopProductsResponse['items']>[number]): CommercialTopProduct {
  return {
    id: item.productId ?? 0,
    productTypeId: item.productTypeId ?? 0,
    name: item.productName?.trim() || 'Producto sin descripcion',
    policiesSold: item.policiesSold ?? 0,
    uniqueClients: item.uniqueClients ?? 0,
    totalPremium: item.totalPremium ?? 0,
    lastPolicyDate: formatDate(item.lastPolicyDate) ?? null
  };
}

function mapClientWithoutPolicy(item: NonNullable<ClientsWithoutPoliciesResponse['items']>[number]): CommercialClientWithoutPolicy {
  return {
    clientId: item.clientId ?? 0,
    displayName: item.displayName?.trim() || 'Cliente sin nombre',
    documentNumber: item.documentNumber?.trim() || 'Sin documento',
    email: item.email?.trim() || 'Sin email',
    hasQuotes: Boolean(item.hasQuotes),
    lastQuoteDate: formatDate(item.lastQuoteDate) ?? null
  };
}

function mapQuotedNotBought(item: NonNullable<QuotedNotBoughtResponse['items']>[number]): CommercialQuotedNotBoughtClient {
  return {
    clientId: item.clientId ?? 0,
    displayName: item.displayName?.trim() || 'Cliente sin nombre',
    documentNumber: item.documentNumber?.trim() || 'Sin documento',
    email: item.email?.trim() || 'Sin email',
    quoteId: item.quoteId ?? 0,
    quoteDate: formatDate(item.quoteDate) ?? 'Sin fecha',
    productTypeId: item.productTypeId ?? 0,
    productTypeDescription: item.productTypeDescription?.trim() || `Tipo ${item.productTypeId ?? 0}`,
    boughtPolicyAfterQuote: Boolean(item.boughtPolicyAfterQuote),
    neverHadPolicy: Boolean(item.neverHadPolicy)
  };
}

function mapPagedResult<TResponseItem, TItem>(
  payload: { totalCount?: number; offset?: number; take?: number; items?: TResponseItem[] },
  mapper: (item: TResponseItem) => TItem
): CommercialPagedResult<TItem> {
  return {
    items: (payload.items ?? []).map(mapper),
    totalCount: payload.totalCount ?? 0,
    offset: payload.offset ?? 0,
    take: payload.take ?? 0
  };
}

export const commercialAnalyticsService = {
  async getSummary(filters: CommercialFilters): Promise<ApiState<CommercialSummaryData>> {
    try {
      const response = await fetchWithTimeout(`${sqlApiBaseUrl}/commercial/summary${buildQueryString(filters)}`, {
        headers: authService.getActorHeaders()
      });

      if (!response.ok) {
        return {
          status: response.status === 404 ? 'empty' : 'error',
          data: null,
          error: await readErrorMessage(response, 'No se pudo recuperar el resumen comercial.')
        };
      }

      const payload = await parseJson<{
        unsupportedFilters?: string[];
        supportedFilters?: SummaryResponse['supportedFilters'];
        summary: SummaryResponse['summary'];
      }>(response);

      if (!payload) {
        return {
          status: 'empty',
          data: null,
          error: 'No se recibio informacion util del resumen comercial.'
        };
      }

      const topProduct = payload.summary.mostCommercializedProduct
        ? mapTopProduct(payload.summary.mostCommercializedProduct)
        : null;

      return {
        status: 'success',
        data: {
          summaryCards: buildSummaryCards(payload as SummaryResponse),
          topProduct,
          policyStatusBreakdown: (payload.summary.policyStatusBreakdown ?? []).map((item) => ({
            status: item.status?.trim() || 'Sin estado',
            count: item.count ?? 0
          })),
          appliedFilters: {
            date: Boolean(payload.supportedFilters?.date),
            branch: Boolean(payload.supportedFilters?.branch),
            channel: Boolean(payload.supportedFilters?.channel),
            product: Boolean(payload.supportedFilters?.product),
            seller: Boolean(payload.supportedFilters?.seller)
          },
          unsupportedFilters: payload.unsupportedFilters ?? [],
          criteria: {
            policiesSoldRule: payload.summary.criteria?.policiesSoldRule ?? 'Sin criterio documentado.',
            productCommercializationRule: payload.summary.criteria?.productCommercializationRule ?? 'Sin criterio documentado.',
            clientsWithoutPoliciesRule: payload.summary.criteria?.clientsWithoutPoliciesRule ?? 'Sin criterio documentado.',
            quotedNotBoughtRule: payload.summary.criteria?.quotedNotBoughtRule ?? 'Sin criterio documentado.',
            limitations: payload.summary.criteria?.limitations ?? []
          },
          totals: {
            policiesSold: payload.summary.policiesSoldCount ?? 0,
            clientsWithoutPolicies: payload.summary.clientsWithoutPoliciesCount ?? 0,
            quotedNotBought: payload.summary.quotedNotBoughtCount ?? 0
          }
        },
        error: null
      };
    } catch (error) {
      return {
        status: 'error',
        data: null,
        error: readConnectionError(error, 'No se pudo recuperar el resumen comercial.')
      };
    }
  },

  async getTopProducts(filters: CommercialFilters, query: CommercialListQuery): Promise<ApiState<CommercialPagedResult<CommercialTopProduct>>> {
    try {
      const response = await fetchWithTimeout(`${sqlApiBaseUrl}/commercial/top-products${buildQueryString(filters, query)}`, {
        headers: authService.getActorHeaders()
      });

      if (!response.ok) {
        return {
          status: response.status === 404 ? 'empty' : 'error',
          data: null,
          error: await readErrorMessage(response, 'No se pudo recuperar el ranking de productos.')
        };
      }

      const payload = await parseJson<TopProductsResponse>(response);
      const data = mapPagedResult(payload ?? {}, mapTopProduct);
      return {
        status: data.items.length > 0 ? 'success' : 'empty',
        data: data.items.length > 0 ? data : null,
        error: data.items.length > 0 ? null : 'No hay productos para los filtros seleccionados.'
      };
    } catch (error) {
      return {
        status: 'error',
        data: null,
        error: readConnectionError(error, 'No se pudo recuperar el ranking de productos.')
      };
    }
  },

  async getClientsWithoutPolicies(filters: CommercialFilters, query: CommercialListQuery): Promise<ApiState<CommercialPagedResult<CommercialClientWithoutPolicy>>> {
    try {
      const response = await fetchWithTimeout(`${sqlApiBaseUrl}/commercial/clients/without-policies${buildQueryString(filters, query)}`, {
        headers: authService.getActorHeaders()
      });

      if (!response.ok) {
        return {
          status: response.status === 404 ? 'empty' : 'error',
          data: null,
          error: await readErrorMessage(response, 'No se pudo recuperar el listado de clientes sin poliza.')
        };
      }

      const payload = await parseJson<ClientsWithoutPoliciesResponse>(response);
      const data = mapPagedResult(payload ?? {}, mapClientWithoutPolicy);
      if (payload && (payload.withQuotesCount !== undefined || payload.withoutQuotesCount !== undefined)) {
        data.aggregateCounts = {
          withQuotes: payload.withQuotesCount ?? 0,
          withoutQuotes: payload.withoutQuotesCount ?? 0
        };
      }
      return {
        status: data.items.length > 0 ? 'success' : 'empty',
        data: data.items.length > 0 ? data : null,
        error: data.items.length > 0 ? null : 'No hay clientes sin poliza para este recorte.'
      };
    } catch (error) {
      return {
        status: 'error',
        data: null,
        error: readConnectionError(error, 'No se pudo recuperar el listado de clientes sin poliza.')
      };
    }
  },

  async getQuotedNotBought(filters: CommercialFilters, query: CommercialListQuery): Promise<ApiState<CommercialPagedResult<CommercialQuotedNotBoughtClient>>> {
    try {
      const response = await fetchWithTimeout(`${sqlApiBaseUrl}/commercial/clients/quoted-not-bought${buildQueryString(filters, query)}`, {
        headers: authService.getActorHeaders()
      });

      if (!response.ok) {
        return {
          status: response.status === 404 ? 'empty' : 'error',
          data: null,
          error: await readErrorMessage(response, 'No se pudo recuperar el listado de clientes cotizados.')
        };
      }

      const payload = await parseJson<QuotedNotBoughtResponse>(response);
      const data = mapPagedResult(payload ?? {}, mapQuotedNotBought);
      if (
        payload &&
        (
          payload.boughtAfterQuoteCount !== undefined ||
          payload.neverHadPolicyCount !== undefined ||
          payload.unclassifiedCount !== undefined
        )
      ) {
        data.aggregateCounts = {
          boughtAfterQuote: payload.boughtAfterQuoteCount ?? 0,
          neverHadPolicy: payload.neverHadPolicyCount ?? 0,
          unclassified: payload.unclassifiedCount ?? 0
        };
      }
      return {
        status: data.items.length > 0 ? 'success' : 'empty',
        data: data.items.length > 0 ? data : null,
        error: data.items.length > 0 ? null : 'No hay clientes cotizados para este recorte.'
      };
    } catch (error) {
      return {
        status: 'error',
        data: null,
        error: readConnectionError(error, 'No se pudo recuperar el listado de clientes cotizados.')
      };
    }
  },

  async getProductDetail(productId: number, filters: CommercialFilters): Promise<ApiState<CommercialProductDetail>> {
    try {
      const response = await fetchWithTimeout(`${sqlApiBaseUrl}/commercial/products/${productId}/detail${buildQueryString(filters)}`, {
        headers: authService.getActorHeaders()
      });

      if (!response.ok) {
        return {
          status: response.status === 404 ? 'empty' : 'error',
          data: null,
          error: await readErrorMessage(response, 'No se pudo recuperar el detalle del producto.')
        };
      }

      const payload = await parseJson<ProductDetailResponse>(response);
      if (!payload) {
        return {
          status: 'empty',
          data: null,
          error: 'No se encontro detalle para el producto seleccionado.'
        };
      }

      return {
        status: 'success',
        data: {
          productId: payload.productId ?? productId,
          productName: payload.productName?.trim() || 'Producto sin descripcion',
          productTypeId: payload.productTypeId ?? 0,
          policiesSold: payload.policiesSold ?? 0,
          uniqueClients: payload.uniqueClients ?? 0,
          totalPremium: payload.totalPremium ?? 0,
          lastPolicyDate: formatDate(payload.lastPolicyDate) ?? null,
          plans: (payload.plans ?? []).map((item) => ({
            planId: item.planId ?? 0,
            planName: item.planName?.trim() || 'Plan sin descripcion',
            policiesSold: item.policiesSold ?? 0,
            uniqueClients: item.uniqueClients ?? 0,
            totalPremium: item.totalPremium ?? 0
          })),
          branches: (payload.branches ?? []).map((item) => ({
            label: item.label?.trim() || 'Sin dato',
            value: item.value ?? 0,
            policiesSold: item.policiesSold ?? 0,
            uniqueClients: item.uniqueClients ?? 0,
            totalPremium: item.totalPremium ?? 0
          })),
          channels: (payload.channels ?? []).map((item) => ({
            label: item.label?.trim() || 'Sin dato',
            value: item.value ?? 0,
            policiesSold: item.policiesSold ?? 0,
            uniqueClients: item.uniqueClients ?? 0,
            totalPremium: item.totalPremium ?? 0
          })),
          sellers: (payload.sellers ?? []).map((item) => ({
            label: item.label?.trim() || 'Sin dato',
            value: item.value ?? 0,
            policiesSold: item.policiesSold ?? 0,
            uniqueClients: item.uniqueClients ?? 0,
            totalPremium: item.totalPremium ?? 0
          }))
        },
        error: null
      };
    } catch (error) {
      return {
        status: 'error',
        data: null,
        error: readConnectionError(error, 'No se pudo recuperar el detalle del producto.')
      };
    }
  },

  async getClientDetail(clientId: number): Promise<ApiState<CommercialClientDetail>> {
    try {
      const response = await fetchWithTimeout(`${sqlApiBaseUrl}/commercial/clients/${clientId}/detail`, {
        headers: authService.getActorHeaders()
      });

      if (!response.ok) {
        return {
          status: response.status === 404 ? 'empty' : 'error',
          data: null,
          error: await readErrorMessage(response, 'No se pudo recuperar el detalle del cliente.')
        };
      }

      const payload = await parseJson<ClientDetailResponse>(response);
      if (!payload) {
        return {
          status: 'empty',
          data: null,
          error: 'No se encontro detalle para el cliente seleccionado.'
        };
      }

      return {
        status: 'success',
        data: {
          clientId: payload.clientId ?? clientId,
          displayName: payload.displayName?.trim() || 'Cliente sin nombre',
          documentNumber: payload.documentNumber?.trim() || 'Sin documento',
          email: payload.email?.trim() || 'Sin email',
          totalQuotes: payload.totalQuotes ?? 0,
          lastQuoteDate: formatDate(payload.lastQuoteDate) ?? null,
          totalPolicies: payload.totalPolicies ?? 0,
          lastPolicyDate: formatDate(payload.lastPolicyDate) ?? null,
          hasAnyPolicy: Boolean(payload.hasAnyPolicy),
          hasQuotesWithoutPurchase: Boolean(payload.hasQuotesWithoutPurchase),
          recentQuotes: (payload.recentQuotes ?? []).map((item) => ({
            quoteId: item.quoteId ?? 0,
            quoteDate: formatDate(item.quoteDate) ?? 'Sin fecha',
            productTypeId: item.productTypeId ?? 0,
            productTypeDescription: item.productTypeDescription?.trim() || `Tipo ${item.productTypeId ?? 0}`
          })),
          recentPolicies: (payload.recentPolicies ?? []).map((item) => ({
            policyId: item.policyId ?? 0,
            policyDate: formatDate(item.policyDate) ?? null,
            policyStatus: item.policyStatus?.trim() || 'Sin estado',
            productId: item.productId ?? null,
            productName: item.productName?.trim() || 'Sin producto',
            planId: item.planId ?? null,
            planName: item.planName?.trim() || 'Sin plan'
          }))
        },
        error: null
      };
    } catch (error) {
      return {
        status: 'error',
        data: null,
        error: readConnectionError(error, 'No se pudo recuperar el detalle del cliente.')
      };
    }
  },

  async exportCsv(kind: 'summary' | 'clients-without-policies' | 'quoted-not-bought', filters: CommercialFilters): Promise<ApiState<string>> {
    const path =
      kind === 'summary'
        ? '/commercial/exports/summary.csv'
        : kind === 'clients-without-policies'
          ? '/commercial/exports/clients-without-policies.csv'
          : '/commercial/exports/quoted-not-bought.csv';

    try {
      const response = await fetchWithTimeout(`${sqlApiBaseUrl}${path}${buildQueryString(filters)}`, {
        headers: authService.getActorHeaders()
      });

      if (!response.ok) {
        return {
          status: 'error',
          data: null,
          error: await readErrorMessage(response, 'No se pudo exportar la informacion comercial.')
        };
      }

      const blob = await response.blob();
      const fileName =
        response.headers.get('Content-Disposition')?.match(/filename="?([^"]+)"?/)?.[1] ??
        `commercial_${kind}.csv`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);

      return {
        status: 'success',
        data: fileName,
        error: null
      };
    } catch (error) {
      return {
        status: 'error',
        data: null,
        error: readConnectionError(error, 'No se pudo exportar la informacion comercial.')
      };
    }
  },

  formatCurrency,
  formatInteger
};
