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

export function statusColors(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-status-active',
    DELIVERED: 'bg-green-100 text-status-active',
    COMPLETED: 'bg-green-100 text-status-active',
    PENDING_START: 'bg-blue-100 text-status-future',
    SCHEDULED: 'bg-blue-100 text-status-future',
    RUNNING: 'bg-blue-100 text-status-future',
    PAUSED: 'bg-orange-100 text-status-warning',
    LOCKED: 'bg-slate-100 text-status-locked',
    CANCELLED: 'bg-red-100 text-status-error',
    SKIPPED: 'bg-orange-100 text-status-warning',
    FAILED: 'bg-red-100 text-status-error',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}
