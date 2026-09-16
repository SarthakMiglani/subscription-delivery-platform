import type { LucideIcon } from 'lucide-react'
import { Wallet, AlertTriangle, Ban, CircleDollarSign, ServerCrash, PauseCircle, XCircle, Info } from 'lucide-react'
import type { AdminNotificationType } from '../types'

export interface NotificationTypeMeta {
  icon: LucideIcon
  classes: string
  label: string
}

/**
 * Single source of truth for how each notification type is rendered —
 * previously duplicated (and out of sync) between NotificationBell's
 * dropdown panel and the full NotificationsPage.
 */
export const NOTIFICATION_TYPE_META: Record<AdminNotificationType, NotificationTypeMeta> = {
  WALLET_RECHARGE_REQUESTED: { icon: Wallet, classes: 'text-status-future bg-[#dce9f7]', label: 'Recharge Request' },
  LOW_BALANCE: { icon: AlertTriangle, classes: 'text-status-warning bg-secondary-container', label: 'Low Balance' },
  ORDER_GENERATION_BLOCKED: { icon: Ban, classes: 'text-status-error bg-error-container', label: 'Order Blocked' },
  WALLET_CREDITED: { icon: CircleDollarSign, classes: 'text-status-active bg-primary-container', label: 'Wallet Credited' },
  SCHEDULER_JOB_FAILURE: { icon: ServerCrash, classes: 'text-status-error bg-error-container', label: 'Job Failed' },
  PRODUCT_AUTO_PAUSE: { icon: PauseCircle, classes: 'text-status-warning bg-secondary-container', label: 'Product Paused' },
  SUBSCRIPTION_CANCELLED: { icon: XCircle, classes: 'text-status-locked bg-surface-container-high', label: 'Subscription Cancelled' },
}

export const DEFAULT_NOTIFICATION_META: NotificationTypeMeta = {
  icon: Info,
  classes: 'text-on-surface-variant bg-surface-container',
  label: 'Notification',
}

export function notificationMeta(type: string): NotificationTypeMeta {
  return NOTIFICATION_TYPE_META[type as AdminNotificationType] ?? DEFAULT_NOTIFICATION_META
}

export function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
