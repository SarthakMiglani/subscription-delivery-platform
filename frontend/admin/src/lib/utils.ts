import { format, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const IST = 'Asia/Kolkata'

export function formatPaise(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees)
}

export function formatPaiseCompact(paise: number): string {
  const rupees = paise / 100
  return `₹${rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}`
}

export function formatDate(dateStr: string): string {
  try { return format(parseISO(dateStr), 'MMM d, yyyy') } catch { return dateStr }
}

export function formatDateTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    const ist = toZonedTime(date, IST)
    return format(ist, 'MMM d, yyyy h:mm a') + ' IST'
  } catch { return dateStr }
}

export function todayIST(): string {
  return format(toZonedTime(new Date(), IST), 'yyyy-MM-dd')
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING_START: 'Pending',
    ACTIVE: 'Active',
    PAUSED: 'Paused',
    CANCELLED: 'Cancelled',
    SCHEDULED: 'Scheduled',
    LOCKED: 'Locked',
    DELIVERED: 'Delivered',
    SKIPPED: 'Skipped',
    RUNNING: 'Running',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
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
    COMPLETED: 'bg-primary-container text-status-active',
    PENDING_START: 'bg-[#dce9f7] text-status-future',
    SCHEDULED: 'bg-[#dce9f7] text-status-future',
    RUNNING: 'bg-[#dce9f7] text-status-future',
    PAUSED: 'bg-secondary-container text-status-warning',
    LOCKED: 'bg-surface-container-high text-status-locked',
    CANCELLED: 'bg-error-container text-status-error',
    SKIPPED: 'bg-secondary-container text-status-warning',
    FAILED: 'bg-error-container text-status-error',
  }
  return map[status] || 'bg-surface-container text-on-surface-variant'
}
