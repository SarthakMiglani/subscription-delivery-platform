export const SUBSCRIPTION_STATUS = {
  PENDING_START: 'PENDING_START',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED',
} as const

export const ORDER_STATUS = {
  SCHEDULED: 'SCHEDULED',
  LOCKED: 'LOCKED',
  DELIVERED: 'DELIVERED',
  SKIPPED: 'SKIPPED',
  CANCELLED: 'CANCELLED',
} as const

export const SKIP_REASONS = [
  { value: 'CUSTOMER_UNAVAILABLE', label: 'Customer Unavailable' },
  { value: 'PRODUCT_UNAVAILABLE', label: 'Product Unavailable' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'OTHER', label: 'Other' },
] as const

export const LEDGER_ENTRY_TYPES = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT',
} as const

export const LOW_BALANCE_THRESHOLD_PAISE = 20_000

export const RECHARGE_RATE_LIMIT_MS = 60 * 60 * 1000 // 1 hour

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || ''
