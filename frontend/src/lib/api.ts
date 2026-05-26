const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'hq_admin' | 'store_manager';
  storeId: string | null;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('havenpet_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const msg = err.message;
    throw new Error(
      Array.isArray(msg) ? msg.join(', ') : (msg ?? `Request failed (${res.status})`),
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () =>
    api<AuthUser & { store?: { code: string; name: string; currency: string } }>('/auth/me'),
};

export type Store = {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  address: string;
  currency: string;
  taxRate: string;
  importDutyRate: string;
  contactName: string;
  contactEmail: string;
  isActive: boolean;
};

export const storesApi = {
  list: () => api<Store[]>('/stores'),
  create: (data: Record<string, unknown>) =>
    api<Store>('/stores', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api<Store>(`/stores/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => api<Store>(`/stores/${id}`, { method: 'DELETE' }),
};

export type Sku = {
  id: string;
  skuVariantCode: string;
  flavour: string | null;
  weightLabel: string | null;
  priceUsd: string;
  isActive: boolean;
};

export type Product = {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  basePriceUsd: string;
  isActive: boolean;
  skus: Sku[];
};

export const productsApi = {
  list: () => api<Product[]>('/products'),
  create: (data: Record<string, unknown>) =>
    api<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  createSku: (productId: string, data: Record<string, unknown>) =>
    api<Sku>(`/products/${productId}/skus`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (id: string) => api(`/products/${id}`, { method: 'DELETE' }),
};

export type LowStockItem = {
  store?: { code: string; name: string };
  sku: {
    id: string;
    skuVariantCode: string;
    flavour: string | null;
    product: { name: string };
  };
  quantity: number;
  safetyThreshold: number;
  reorderQty: number;
  isLowStock: boolean;
};

export const inventoryApi = {
  lowStock: () => api<LowStockItem[]>('/inventory/low-stock'),
};

export type CatalogSku = {
  id: string;
  skuVariantCode: string;
  flavour: string | null;
  weightLabel: string | null;
  priceUsd: number;
  priceLocal: number;
  currency: string;
  hqAvailable: number;
};

export type CatalogProduct = {
  id: string;
  skuCode: string;
  name: string;
  category: string;
  skus: CatalogSku[];
};

export type OrderPreview = {
  currency: string;
  exchangeRate: number;
  subtotalUsd: number;
  subtotalLocal: number;
  taxAmount: number;
  dutyAmount: number;
  shippingAmount: number;
  totalAmount: number;
  breakdown: {
    subtotalLocal: number;
    taxRate: number;
    dutyRate: number;
    taxAmount: number;
    dutyAmount: number;
    shippingUsd: number;
    shippingLocal: number;
  };
};

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  exchangeRate: string;
  subtotalUsd: string;
  subtotalLocal: string;
  taxAmount: string;
  dutyAmount: string;
  shippingAmount: string;
  totalAmount: string;
  items: Array<{
    id: string;
    quantity: number;
    lineTotalLocal: string;
    sku: { skuVariantCode: string; flavour: string | null; product: { name: string } };
  }>;
  payments?: Array<{ id: string; method: string; status: string }>;
};

export const catalogApi = {
  list: () => api<CatalogProduct[]>('/catalog'),
};

export const ordersApi = {
  preview: (items: { skuId: string; quantity: number }[]) =>
    api<OrderPreview>('/orders/preview', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  create: (items: { skuId: string; quantity: number }[], notes?: string) =>
    api<Order>('/orders', { method: 'POST', body: JSON.stringify({ items, notes }) }),
  restock: (skuId: string) =>
    api<Order>(`/orders/restock/${skuId}`, { method: 'POST' }),
  list: () => api<Order[]>('/orders'),
  get: (id: string) => api<Order>(`/orders/${id}`),
  submit: (id: string) => api<Order>(`/orders/${id}/submit`, { method: 'POST' }),
  cancel: (id: string) => api<Order>(`/orders/${id}/cancel`, { method: 'POST' }),
};

export type Payment = {
  id: string;
  method: string;
  status: string;
  amount: string;
  currency: string;
  wireReceiptUrl?: string;
  order?: Order & { store?: { code: string; name: string } };
};

export const paymentsApi = {
  create: (orderId: string, method: string, wireReceiptUrl?: string) =>
    api<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify({ orderId, method, wireReceiptUrl }),
    }),
  pendingWire: () => api<Payment[]>('/payments/pending-wire'),
  approve: (id: string) => api<Payment>(`/payments/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason?: string) =>
    api<Payment>(`/payments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

export const exchangeApi = {
  get: (currency: string) =>
    api<{ baseCurrency: string; targetCurrency: string; rate: number }>(
      `/exchange-rates/${currency}`,
    ),
};

export type TrackingResponse = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    currency: string;
    totalAmount: string;
    shippedAt?: string;
    completedAt?: string;
    store?: { code: string; name: string; city: string };
  };
  shipment: {
    carrier: string;
    trackingNumber: string;
    containerId?: string;
    vesselFlight?: string;
    originPort?: string;
    destinationPort?: string;
    estimatedArrival?: string;
    customsNotes?: string;
  } | null;
  timeline: Array<{
    id: string;
    milestone: string;
    title: string;
    description?: string;
    location?: string;
    occurredAt: string;
  }>;
  progress: {
    currentStep: number;
    totalSteps: number;
    steps: Array<{ status: string; label: string; completed: boolean; active: boolean }>;
  };
};

export type FulfillmentOrder = Order & {
  store: { code: string; name: string; city: string; country: string };
  shipment?: { id: string; trackingNumber?: string; carrier?: string } | null;
};

export type AnalyticsOverview = {
  kpis: {
    totalGmvUsd: number;
    b2bGmvUsd: number;
    retailGmvUsd: number;
    totalOrders: number;
    activeStores: number;
    pendingFulfillment: number;
    completedOrders: number;
  };
  salesTrend: Array<{ month: string; gmvUsd: number; orderCount: number }>;
  topSkus: Array<{
    skuVariantCode: string;
    productName: string;
    quantity: number;
    revenueUsd: number;
  }>;
  storeRanking: Array<{
    storeCode: string;
    storeName: string;
    currency: string;
    revenueUsd: number;
    orderCount: number;
  }>;
  storeMap: Array<{
    id: string;
    code: string;
    name: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    revenueUsd: number;
  }>;
};

export const analyticsApi = {
  overview: () => api<AnalyticsOverview>('/analytics/overview'),
};

export const shipmentsApi = {
  fulfillment: () => api<FulfillmentOrder[]>('/shipments/fulfillment'),
  track: (orderId: string) => api<TrackingResponse>(`/shipments/track/${orderId}`),
  ship: (data: Record<string, unknown>) =>
    api<TrackingResponse>('/shipments/ship', { method: 'POST', body: JSON.stringify(data) }),
  advance: (orderId: string, notes?: string) =>
    api<TrackingResponse>(`/shipments/${orderId}/advance`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  addMilestone: (orderId: string, data: Record<string, unknown>) =>
    api<TrackingResponse>(`/shipments/${orderId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
