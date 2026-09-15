export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  PENDING_START: 'Pending Start',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  LOCKED: 'Locked',
  DELIVERED: 'Delivered',
  SKIPPED: 'Skipped',
  CANCELLED: 'Cancelled',
}

export const SKIP_REASONS = [
  { value: 'CUSTOMER_UNAVAILABLE', label: 'Customer Unavailable' },
  { value: 'PRODUCT_UNAVAILABLE', label: 'Product Unavailable' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'OTHER', label: 'Other' },
] as const

export const LEDGER_ENTRY_TYPES = ['REFUND', 'ADJUSTMENT', 'DEBIT'] as const
