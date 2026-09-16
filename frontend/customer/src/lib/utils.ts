import { format, parseISO } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const IST = 'Asia/Kolkata'
const CUTOFF_HOUR = 22 // 10 PM IST

/**
 * Format paise to ₹ string. e.g. 2500 → "₹25.00"
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees)
}

/**
 * Format paise as compact rupees. e.g. 2500 → "₹25"
 */
export function formatPaiseCompact(paise: number): string {
  const rupees = paise / 100
  return `₹${rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}`
}

/**
 * Get current time in IST timezone
 */
export function nowInIST(): Date {
  return toZonedTime(new Date(), IST)
}

/**
 * Returns whether we're currently past the 10 PM IST cutoff
 * NOTE: For display purposes only. Server is authoritative (BR-AUTH-07).
 */
export function isAfterCutoffIST(): boolean {
  const now = nowInIST()
  return now.getHours() >= CUTOFF_HOUR
}

/**
 * Returns the display message for when a subscription change takes effect.
 * For display only — actual effectiveDate comes from server response.
 */
export function getCutoffMessage(): string {
  if (isAfterCutoffIST()) {
    const dayAfterTomorrow = new Date()
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    return `Changes will apply from ${format(toZonedTime(dayAfterTomorrow, IST), 'MMM d, yyyy')}`
  } else {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return `Changes will apply from ${format(toZonedTime(tomorrow, IST), 'MMM d, yyyy')} (Tomorrow)`
  }
}

/**
 * Format ISO date string for display
 */
export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

/**
 * Format ISO datetime string for display
 */
export function formatDateTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    const ist = toZonedTime(date, IST)
    return format(ist, 'MMM d, yyyy h:mm a')
  } catch {
    return dateStr
  }
}

/**
 * Format ISO date to relative label (Today, Tomorrow, etc.)
 */
export function formatDateRelative(dateStr: string): string {
  try {
    const today = toZonedTime(new Date(), IST)
    const target = parseISO(dateStr)
    const todayStr = format(today, 'yyyy-MM-dd')
    const tomorrowStr = format(
      new Date(today.getTime() + 86400000),
      'yyyy-MM-dd'
    )
    if (dateStr === todayStr) return 'Today'
    if (dateStr === tomorrowStr) return 'Tomorrow'
    return format(target, 'EEE, MMM d')
  } catch {
    return dateStr
  }
}

/**
 * Subscription status labels
 */
export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING_START: 'Pending Start',
    ACTIVE: 'Active',
    PAUSED: 'Paused',
    CANCELLED: 'Cancelled',
    SCHEDULED: 'Scheduled',
    LOCKED: 'Locked',
    DELIVERED: 'Delivered',
    SKIPPED: 'Skipped',
  }
  return labels[status] || status
}

/**
 * Status badge color classes — all derived from the custom design-token
 * palette (no raw Tailwind grays/greens) so badges always track the theme.
 */
export function statusColors(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-primary-container text-status-active',
    DELIVERED: 'bg-primary-container text-status-active',
    PENDING_START: 'bg-[#dce9f7] text-status-future',
    SCHEDULED: 'bg-[#dce9f7] text-status-future',
    PAUSED: 'bg-secondary-container text-status-warning',
    LOCKED: 'bg-surface-container-high text-status-locked',
    CANCELLED: 'bg-error-container text-status-error',
    SKIPPED: 'bg-secondary-container text-status-warning',
  }
  return map[status] || 'bg-surface-container text-on-surface-variant'
}
