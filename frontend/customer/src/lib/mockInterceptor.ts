/**
 * Mock Axios interceptor — intercepts all API requests and returns
 * static mock data so the app is fully navigable without a backend.
 * Enabled when VITE_MOCK=true in .env
 */
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import {
  MOCK_PROFILE,
  MOCK_PRODUCTS,
  MOCK_SUBSCRIPTIONS,
  MOCK_ORDERS,
  MOCK_WALLET,
  MOCK_LEDGER,
} from './mockData'

// Simulate network delay (ms)
const DELAY = 300

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function paged<T>(items: T[], page = 0, size = 20) {
  const start = page * size
  return {
    success: true,
    data: { items: items.slice(start, start + size) },
    meta: { page, size, total: items.length },
  }
}

function ok(data: unknown) {
  return { success: true, data }
}

function makeResponse(data: unknown, status = 200): Partial<AxiosResponse> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  }
}

/**
 * Match a URL pattern and return mock data.
 * Returns null if no mock matches (will pass through to real network).
 */
async function getMockResponse(
  method: string,
  url: string,
  _params?: Record<string, unknown>
): Promise<Partial<AxiosResponse> | null> {
  await delay(DELAY)
  const m = method.toLowerCase()
  const u = url.replace(/^\/api\/v1/, '')

  // ── Auth ───────────────────────────────────────────────────────────────
  if (m === 'post' && u === '/dev/token/customer') {
    return makeResponse(ok({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' }))
  }
  if (m === 'post' && u === '/auth/customer/refresh') {
    return makeResponse(ok({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' }))
  }

  // ── Profile ────────────────────────────────────────────────────────────
  if (m === 'get' && u === '/customer/me') {
    return makeResponse(ok(MOCK_PROFILE))
  }
  if (m === 'put' && u === '/customer/address') {
    return makeResponse(ok({ ...MOCK_PROFILE.address, updatedAt: new Date().toISOString() }))
  }

  // ── Onboarding ─────────────────────────────────────────────────────────
  if (m === 'post' && u === '/onboarding') {
    return makeResponse(ok({ customerId: MOCK_PROFILE.id, phone: '9876543210', onboardingComplete: true, address: MOCK_PROFILE.address }))
  }

  // ── Products ───────────────────────────────────────────────────────────
  if (m === 'get' && u === '/products') {
    return makeResponse(paged(MOCK_PRODUCTS.items))
  }

  // ── Subscriptions ──────────────────────────────────────────────────────
  if (m === 'get' && u === '/subscriptions') {
    const statusFilter = (_params as Record<string, string>)?.status
    const items = statusFilter
      ? MOCK_SUBSCRIPTIONS.items.filter(s => s.status === statusFilter)
      : MOCK_SUBSCRIPTIONS.items
    return makeResponse(paged(items))
  }
  if (m === 'post' && u === '/subscriptions') {
    return makeResponse(ok({
      id: 'sub-new-' + Date.now(),
      productId: 'prod-uuid-1',
      productName: 'New Product',
      quantity: 1,
      status: 'PENDING_START',
      effectiveStartDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    }), 201)
  }
  if (m === 'post' && /^\/subscriptions\/[^/]+\/pause$/.test(u)) {
    return makeResponse(ok({ subscriptionId: 'sub-uuid-1', status: 'PAUSED', pauseEffectiveDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] }))
  }
  if (m === 'post' && /^\/subscriptions\/[^/]+\/resume$/.test(u)) {
    return makeResponse(ok({ subscriptionId: 'sub-uuid-1', status: 'ACTIVE', resumeEffectiveDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] }))
  }
  if (m === 'post' && /^\/subscriptions\/[^/]+\/cancel$/.test(u)) {
    return makeResponse(ok({ subscriptionId: 'sub-uuid-1', status: 'CANCELLED', cancelEffectiveDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], cancelledAt: new Date().toISOString() }))
  }
  if (m === 'post' && /^\/subscriptions\/[^/]+\/change-quantity$/.test(u)) {
    return makeResponse(ok({ changeRequestId: 'cr-' + Date.now(), type: 'QUANTITY', newQuantity: 3, status: 'APPROVED', effectiveDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] }), 201)
  }
  if (m === 'post' && /^\/subscriptions\/[^/]+\/change-product$/.test(u)) {
    return makeResponse(ok({ changeRequestId: 'cr-' + Date.now(), type: 'PRODUCT', status: 'APPROVED', effectiveDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] }), 201)
  }

  // ── Orders ─────────────────────────────────────────────────────────────
  if (m === 'get' && u === '/orders') {
    const statusFilter = (_params as Record<string, string>)?.status
    const items = statusFilter
      ? MOCK_ORDERS.items.filter(o => o.status === statusFilter)
      : MOCK_ORDERS.items
    const page = Number((_params as Record<string, string>)?.page ?? 0)
    return makeResponse(paged(items, page))
  }

  // ── Wallet ─────────────────────────────────────────────────────────────
  if (m === 'get' && u === '/wallet') {
    return makeResponse(ok(MOCK_WALLET))
  }
  if (m === 'get' && u === '/wallet/ledger') {
    const page = Number((_params as Record<string, string>)?.page ?? 0)
    return makeResponse(paged(MOCK_LEDGER.items, page))
  }
  if (m === 'post' && u === '/wallet/recharge-request') {
    return makeResponse(ok({ status: 'REQUESTED', requestedAt: new Date().toISOString() }))
  }

  return null
}

export function setupMockInterceptor(axiosInstance: import('axios').AxiosInstance) {
  axiosInstance.interceptors.request.use(async (config) => {
    const url = (config.url ?? '').replace(/^\/api\/v1/, '')
    const method = (config.method ?? 'get').toLowerCase()
    const params = config.params as Record<string, unknown> | undefined

    const mockResponse = await getMockResponse(method, url, params)
    if (mockResponse) {
      // Abort the real request by throwing a "resolved" mock
      config.adapter = () =>
        Promise.resolve({
          ...mockResponse,
          config,
        } as AxiosResponse)
    }
    return config
  })
}
