// ─── Admin Auth ──────────────────────────────────────────────────────────────
export interface AdminLoginResponse {
  accessToken: string
  refreshToken: string
}

// ─── Customer (Admin View) ───────────────────────────────────────────────────
export interface AdminCustomerListItem {
  id: string
  name: string
  email: string
  phone: string
  isActive: boolean
  onboardingComplete: boolean
  walletBalancePaise: number
  activeSubscriptionCount: number
  createdAt: string
}

export interface Address {
  id?: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  deliveryNotes?: string
}

export interface AdminCustomerDetail {
  id: string
  name: string
  email: string
  phone: string
  isActive: boolean
  onboardingComplete: boolean
  address: Address | null
  walletBalancePaise: number
  createdAt: string
}

// ─── Products ────────────────────────────────────────────────────────────────
export interface AdminProduct {
  id: string
  name: string
  description: string
  pricePerUnitPaise: number
  unitLabel: string
  isAvailable: boolean
  imageUrl?: string
  createdAt: string
}

// ─── Subscriptions ───────────────────────────────────────────────────────────
export type SubscriptionStatus = 'PENDING_START' | 'ACTIVE' | 'PAUSED' | 'CANCELLED'

export interface AdminSubscriptionListItem {
  id: string
  customerId: string
  customerName: string
  productId: string
  productName: string
  quantity: number
  status: SubscriptionStatus
  effectiveStartDate: string
  createdAt: string
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderStatus = 'SCHEDULED' | 'LOCKED' | 'DELIVERED' | 'SKIPPED' | 'CANCELLED'
export type SkipReason = 'CUSTOMER_UNAVAILABLE' | 'PRODUCT_UNAVAILABLE' | 'DAMAGED' | 'OTHER'

export interface AdminOrderListItem {
  id: string
  customerId: string
  customerName: string
  productName: string
  quantity: number
  totalAmountPaise: number
  deliveryDate: string
  status: OrderStatus
  isLocked: boolean
}

export interface AdminOrderDetail extends AdminOrderListItem {
  subscriptionId: string
  productId: string
  unitPricePaise: number
  cancellationComment: string | null
  deliveryAddress: Address
  createdAt: string
}

// ─── Delivery Sheet ───────────────────────────────────────────────────────────
export type DeliveryRecordStatus = 'PENDING' | 'DELIVERED' | 'SKIPPED' | 'CANCELLED'

export interface DeliverySheetOrder {
  orderId: string
  customerName: string
  phone: string
  address: string
  deliveryNotes: string
  productName: string
  quantity: number
  /** Null in pre-V109 snapshots — treat null as PENDING */
  deliveryStatus?: DeliveryRecordStatus | null
}

export interface JuiceSummaryEntry {
  productName: string
  totalQuantity: number
}

export interface IngredientSummaryEntry {
  ingredientId: string
  ingredientName: string
  totalQuantity: number
  unit: string
}

export interface DeliverySheet {
  deliveryDate: string
  generatedAt: string
  orders: DeliverySheetOrder[]
  juiceSummary: JuiceSummaryEntry[]
  ingredientSummary?: IngredientSummaryEntry[] | null
  productsWithoutRecipe?: string[] | null
}

// ─── Ingredients ─────────────────────────────────────────────────────────────
export interface Ingredient {
  id: string
  name: string
  defaultUnit: string
  createdAt: string
}

export interface ProductIngredientEntry {
  ingredientId: string
  ingredientName?: string
  quantityPerUnit: number
  unit: string
}

export interface IngredientsReport {
  targetDate: string
  ingredients: IngredientSummaryEntry[]
  productsWithoutRecipe: string[]
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
export type LedgerEntryType = 'CREDIT' | 'DEBIT' | 'REFUND' | 'ADJUSTMENT'
export type LedgerSourceType =
  | 'ADMIN_CREDIT'
  | 'DELIVERY_DEBIT'
  | 'REFUND'
  | 'MANUAL_DEBIT'
  | 'MANUAL_ADJUSTMENT'
  | 'HISTORICAL_CORRECTION'
  | 'SYSTEM_ADJUSTMENT'

export interface AdminLedgerEntry {
  id: string
  entryType: LedgerEntryType
  sourceType: LedgerSourceType
  amountPaise: number
  balanceAfterPaise: number
  description: string
  orderId?: string
  createdAt: string
}

// ─── Holidays ─────────────────────────────────────────────────────────────────
export interface Holiday {
  id: string
  date: string
  name: string
  createdAt: string
}

// ─── Scheduler ───────────────────────────────────────────────────────────────
export type SchedulerJobStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface SchedulerJobLog {
  id: string
  jobName: string
  status: SchedulerJobStatus
  targetDate: string
  ordersGenerated?: number
  errorMessage?: string | null
  ranAt: string
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AdminAuditLog {
  id: string
  actionType: string
  targetEntity: string
  targetId: string
  actingAdmin: string
  notes: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number
  size: number
  total: number
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type AdminNotificationType =
  | 'WALLET_RECHARGE_REQUESTED'
  | 'LOW_BALANCE'
  | 'ORDER_GENERATION_BLOCKED'
  | 'WALLET_CREDITED'
  | 'SCHEDULER_JOB_FAILURE'
  | 'PRODUCT_AUTO_PAUSE'
  | 'SUBSCRIPTION_CANCELLED'

export interface AdminNotification {
  id: string
  type: AdminNotificationType
  // null for system-level events with no associated customer (e.g. scheduler failures)
  customerId: string | null
  customerName: string | null
  message: string
  amountPaise: number | null
  read: boolean
  createdAt: string
}

