// ─── Auth ───────────────────────────────────────────────────────────────────
export interface CustomerLoginResponse {
  accessToken: string
  refreshToken: string
  customerId: string
  onboardingComplete: boolean
}

export interface TokenRefreshResponse {
  accessToken: string
  refreshToken: string
}

// ─── Customer ───────────────────────────────────────────────────────────────
export interface Address {
  id?: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  deliveryNotes?: string
}

export interface WalletSummary {
  balancePaise: number
  lowBalanceWarning: boolean
  lowBalanceThresholdPaise: number
}

export interface CustomerProfile {
  id: string
  name: string
  email: string
  phone: string
  onboardingComplete: boolean
  address: Address | null
  wallet: WalletSummary
  createdAt: string
}

// ─── Products ────────────────────────────────────────────────────────────────
export interface Product {
  id: string
  name: string
  description: string
  pricePerUnitPaise: number
  unitLabel: string
  imageUrl?: string
}

// ─── Subscriptions ───────────────────────────────────────────────────────────
export type SubscriptionStatus = 'PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CANCELLED'
export type ChangeRequestType = 'QUANTITY' | 'PRODUCT'
export type ChangeRequestStatus = 'APPROVED' | 'APPLIED' | 'SUPERSEDED'

export interface PendingChangeRequest {
  type: ChangeRequestType
  newQuantity?: number
  newProductId?: string
  newProductName?: string
  effectiveDate: string
  status: ChangeRequestStatus
}

export interface Subscription {
  id: string
  productId: string
  productName: string
  quantity: number
  status: SubscriptionStatus
  effectiveStartDate: string
  pendingChangeRequests?: PendingChangeRequest[]
  createdAt: string
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderStatus = 'SCHEDULED' | 'LOCKED' | 'DELIVERED' | 'SKIPPED' | 'CANCELLED'

export interface OrderListItem {
  id: string
  subscriptionId: string
  productName: string
  quantity: number
  totalAmountPaise: number
  deliveryDate: string
  status: OrderStatus
  isLocked: boolean
}

export interface OrderDetail extends OrderListItem {
  productId: string
  unitPricePaise: number
  deliveryAddress: Address
  createdAt: string
}

// ─── Wallet Ledger ───────────────────────────────────────────────────────────
export type LedgerEntryType = 'CREDIT' | 'DEBIT' | 'REFUND' | 'ADJUSTMENT'
export type LedgerSourceType =
  | 'ADMIN_CREDIT'
  | 'DELIVERY_DEBIT'
  | 'REFUND'
  | 'MANUAL_DEBIT'
  | 'MANUAL_ADJUSTMENT'
  | 'HISTORICAL_CORRECTION'
  | 'SYSTEM_ADJUSTMENT'

export interface LedgerEntry {
  id: string
  entryType: LedgerEntryType
  sourceType: LedgerSourceType
  amountPaise: number
  balanceAfterPaise: number
  description: string
  createdAt: string
}

// ─── API Envelopes ───────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number
  size: number
  total: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: PaginationMeta
}

export interface PagedData<T> {
  items: T[]
}
