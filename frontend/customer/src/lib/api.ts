import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

// In local dev, '/api/v1' is proxied to localhost:8080 by vite.config.ts.
// In production (Vercel), VITE_API_URL must point at the deployed backend
// (e.g. the Render service URL) since the frontend and backend are on
// different domains with no shared reverse proxy.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── Request interceptor: attach Bearer token ────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: unwrap data, handle 401/403 ──────────────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else if (token) resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`
          }
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const { refreshToken, setTokens, logout } = useAuthStore.getState()

      if (!refreshToken) {
        logout()
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/customer/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = res.data.data
        setTokens(accessToken, newRefreshToken)
        processQueue(null, accessToken)
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 403) {
      const data = error.response.data as { error?: { code?: string } }
      const code = data?.error?.code
      if (code === 'ONBOARDING_INCOMPLETE') {
        window.location.href = '/onboarding'
        return Promise.reject(error)
      }
      if (code === 'ACCOUNT_DEACTIVATED') {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

// ─── Typed helper: unwraps response.data.data ────────────────────────────────
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get(url, { params })
  return res.data.data as T
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post(url, body)
  return res.data.data as T
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.put(url, body)
  return res.data.data as T
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.patch(url, body)
  return res.data.data as T
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await api.delete(url)
  return res.data.data as T
}

// ─── Paged response helper ───────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[]
  meta: { page: number; size: number; total: number }
}

export async function apiGetPaged<T>(url: string, params?: Record<string, unknown>): Promise<PagedResult<T>> {
  const res = await api.get(url, { params })
  return {
    items: res.data.data.items as T[],
    meta: res.data.meta,
  }
}

// ─── Error extractor ─────────────────────────────────────────────────────────
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || error.message || 'Something went wrong'
  }
  return 'Something went wrong'
}
