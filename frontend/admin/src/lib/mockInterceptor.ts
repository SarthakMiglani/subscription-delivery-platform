/**
 * Mock Axios interceptor for admin app — intercepts all API requests and returns
 * static mock data so the app is fully navigable without a backend.
 * Enabled when VITE_MOCK=true in .env
 */
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import {
  MOCK_ADMIN_CUSTOMERS,
  MOCK_ADMIN_CUSTOMER_DETAIL,
  MOCK_ADMIN_PRODUCTS,
  MOCK_ADMIN_SUBSCRIPTIONS,
  MOCK_ADMIN_ORDERS,
  MOCK_DELIVERY_SHEET,
  MOCK_ADMIN_LEDGER,
  MOCK_SCHEDULER_HISTORY,
  MOCK_HOLIDAYS,
  MOCK_INGREDIENTS,
  MOCK_PRODUCT_RECIPES,
  MOCK_INGREDIENTS_REPORT,
} from './mockData'

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

async function getMockResponse(
  method: string,
  url: string,
  params?: Record<string, unknown>
): Promise<Partial<AxiosResponse> | null> {
  await delay(DELAY)
  const m = method.toLowerCase()
  const u = url.replace(/^\/api\/v1/, '')

  // ── Auth ───────────────────────────────────────────────────────────────
  if (m === 'post' && u === '/auth/admin/login') {
    return makeResponse(ok({ accessToken: 'mock-admin-access-token', refreshToken: 'mock-admin-refresh-token' }))
  }
  if (m === 'post' && u === '/auth/admin/refresh') {
    return makeResponse(ok({ accessToken: 'mock-admin-access-token', refreshToken: 'mock-admin-refresh-token' }))
  }

  // ── Customers ──────────────────────────────────────────────────────────
  if (m === 'get' && u === '/admin/customers') {
    const search = (params?.search as string | undefined)?.toLowerCase()
    const page = Number(params?.page ?? 0)
    const size = Number(params?.size ?? 20)
    const items = search
      ? MOCK_ADMIN_CUSTOMERS.items.filter(c =>
          c.name.toLowerCase().includes(search) ||
          c.phone.includes(search) ||
          c.email.toLowerCase().includes(search)
        )
      : MOCK_ADMIN_CUSTOMERS.items
    return makeResponse(paged(items, page, size))
  }
  if (m === 'get' && /^\/admin\/customers\/[^/]+$/.test(u)) {
    return makeResponse(ok(MOCK_ADMIN_CUSTOMER_DETAIL))
  }
  if (m === 'post' && /^\/admin\/customers\/[^/]+\/deactivate$/.test(u)) {
    return makeResponse(ok({ message: 'Customer deactivated' }))
  }
  if (m === 'post' && /^\/admin\/customers\/[^/]+\/reactivate$/.test(u)) {
    return makeResponse(ok({ message: 'Customer reactivated' }))
  }

  // ── Customer Wallet ────────────────────────────────────────────────────
  if (m === 'post' && /^\/admin\/customers\/[^/]+\/wallet\/credit$/.test(u)) {
    return makeResponse(ok({ newBalancePaise: 65000, creditedAt: new Date().toISOString() }))
  }
  if (m === 'post' && /^\/admin\/customers\/[^/]+\/wallet\/adjust$/.test(u)) {
    return makeResponse(ok({ newBalancePaise: 55000, adjustedAt: new Date().toISOString() }))
  }
  if (m === 'post' && /^\/admin\/customers\/[^/]+\/wallet\/set-balance$/.test(u)) {
    return makeResponse(ok({ newBalancePaise: 50000, setAt: new Date().toISOString() }))
  }
  if (m === 'get' && /^\/admin\/customers\/[^/]+\/wallet\/ledger$/.test(u)) {
    const page = Number(params?.page ?? 0)
    return makeResponse(paged(MOCK_ADMIN_LEDGER.items, page))
  }

  // ── Products ───────────────────────────────────────────────────────────
  if (m === 'get' && u === '/admin/products') {
    const page = Number(params?.page ?? 0)
    const size = Number(params?.size ?? 20)
    return makeResponse(paged(MOCK_ADMIN_PRODUCTS.items, page, size))
  }
  if (m === 'post' && u === '/admin/products') {
    return makeResponse(ok({
      id: 'prod-new-' + Date.now(),
      name: 'New Product',
      description: '',
      pricePerUnitPaise: 0,
      unitLabel: '',
      isAvailable: true,
      createdAt: new Date().toISOString(),
    }), 201)
  }
  if (m === 'put' && /^\/admin\/products\/[^/]+$/.test(u)) {
    return makeResponse(ok({ ...MOCK_ADMIN_PRODUCTS.items[0], updatedAt: new Date().toISOString() }))
  }
  if (m === 'patch' && /^\/admin\/products\/[^/]+\/availability$/.test(u)) {
    return makeResponse(ok({ updated: true }))
  }
  if (m === 'post' && /^\/admin\/products\/[^/]+\/disable$/.test(u)) {
    return makeResponse(ok({ updated: true }))
  }
  if (m === 'post' && /^\/admin\/products\/[^/]+\/enable$/.test(u)) {
    return makeResponse(ok({ updated: true }))
  }
  if (m === 'get' && /^\/admin\/products\/([^/]+)\/ingredients$/.test(u)) {
    const productId = u.match(/^\/admin\/products\/([^/]+)\/ingredients$/)![1]
    const recipe = MOCK_PRODUCT_RECIPES[productId] ?? []
    return makeResponse(ok(recipe))
  }
  if (m === 'put' && /^\/admin\/products\/[^/]+\/ingredients$/.test(u)) {
    return makeResponse(ok([]))
  }

  // ── Ingredients ────────────────────────────────────────────────────────
  if (m === 'get' && u === '/admin/ingredients') {
    return makeResponse(ok(MOCK_INGREDIENTS.items))
  }
  if (m === 'post' && u === '/admin/ingredients') {
    return makeResponse(ok({
      id: 'ing-new-' + Date.now(),
      name: 'New Ingredient',
      defaultUnit: 'pieces',
      createdAt: new Date().toISOString(),
    }), 201)
  }
  if (m === 'delete' && /^\/admin\/ingredients\/[^/]+$/.test(u)) {
    return makeResponse(ok({ deleted: true }))
  }
  if (m === 'get' && /^\/admin\/ingredients-report/.test(u)) {
    return makeResponse(ok(MOCK_INGREDIENTS_REPORT))
  }

  // ── Subscriptions ──────────────────────────────────────────────────────
  if (m === 'get' && u === '/admin/subscriptions') {
    const statusFilter = params?.status as string | undefined
    const page = Number(params?.page ?? 0)
    const size = Number(params?.size ?? 20)
    const items = statusFilter
      ? MOCK_ADMIN_SUBSCRIPTIONS.items.filter(s => s.status === statusFilter)
      : MOCK_ADMIN_SUBSCRIPTIONS.items
    return makeResponse(paged(items, page, size))
  }

  // ── Orders ─────────────────────────────────────────────────────────────
  if (m === 'get' && u === '/admin/orders') {
    const statusFilter = params?.status as string | undefined
    const page = Number(params?.page ?? 0)
    const size = Number(params?.size ?? 20)
    const items = statusFilter
      ? MOCK_ADMIN_ORDERS.items.filter(o => o.status === statusFilter)
      : MOCK_ADMIN_ORDERS.items
    return makeResponse(paged(items, page, size))
  }
  if (m === 'post' && /^\/admin\/orders\/[^/]+\/deliver$/.test(u)) {
    return makeResponse(ok({ status: 'DELIVERED', deliveredAt: new Date().toISOString() }))
  }
  if (m === 'post' && /^\/admin\/orders\/[^/]+\/skip$/.test(u)) {
    return makeResponse(ok({ status: 'SKIPPED', skippedAt: new Date().toISOString() }))
  }

  // ── Delivery Sheets ────────────────────────────────────────────────────
  if (m === 'get' && /^\/admin\/delivery-sheets\/[^/]+$/.test(u)) {
    return makeResponse(ok(MOCK_DELIVERY_SHEET))
  }

  // ── Scheduler ──────────────────────────────────────────────────────────
  if (m === 'get' && u === '/admin/scheduler/history') {
    const page = Number(params?.page ?? 0)
    const size = Number(params?.size ?? 20)
    return makeResponse(paged(MOCK_SCHEDULER_HISTORY.items, page, size))
  }
  if (m === 'post' && u === '/admin/scheduler/freeze') {
    return makeResponse(ok({ jobId: 'job-' + Date.now(), status: 'COMPLETED', targetDate: new Date().toISOString().split('T')[0] }))
  }
  if (m === 'post' && u === '/admin/scheduler/generate') {
    return makeResponse(ok({ jobId: 'job-' + Date.now(), status: 'COMPLETED', ordersGenerated: 4, targetDate: new Date().toISOString().split('T')[0] }))
  }
  if (m === 'post' && u === '/admin/scheduler/delivery-sheet') {
    return makeResponse(ok({ jobId: 'job-' + Date.now(), status: 'COMPLETED', targetDate: new Date().toISOString().split('T')[0] }))
  }

  // ── Holidays ───────────────────────────────────────────────────────────
  if (m === 'get' && u === '/admin/holidays') {
    return makeResponse(paged(MOCK_HOLIDAYS.items))
  }
  if (m === 'post' && u === '/admin/holidays') {
    return makeResponse(ok({ id: 'hol-' + Date.now(), date: '', name: '', createdAt: new Date().toISOString() }), 201)
  }
  if (m === 'delete' && /^\/admin\/holidays\/[^/]+$/.test(u)) {
    return makeResponse(ok({ deleted: true }))
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
      config.adapter = () =>
        Promise.resolve({
          ...mockResponse,
          config,
        } as AxiosResponse)
    }
    return config
  })
}
