import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiGetPaged } from '../../lib/api'
import type { AdminNotification } from '../../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`
}

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  WALLET_RECHARGE_REQUESTED: {
    icon: 'account_balance_wallet',
    color: 'text-blue-600 bg-blue-50',
    label: 'Recharge Request',
  },
  LOW_BALANCE: {
    icon: 'warning',
    color: 'text-amber-600 bg-amber-50',
    label: 'Low Balance',
  },
  ORDER_GENERATION_BLOCKED: {
    icon: 'block',
    color: 'text-red-600 bg-red-50',
    label: 'Order Blocked',
  },
}

// ── NotificationPanel ─────────────────────────────────────────────────────────

interface NotificationPanelProps {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on click-outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', page],
    queryFn: () =>
      apiGetPaged<AdminNotification>('/admin/notifications', {
        page,
        size: PAGE_SIZE,
        sort: 'createdAt,desc',
      }),
  })

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread'] })
    },
  })

  const markAll = useMutation({
    mutationFn: () => api.patch('/admin/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread'] })
    },
  })

  function handleNotificationClick(n: AdminNotification) {
    if (!n.read) markOne.mutate(n.id)
    onClose()
    navigate(`/customers/${n.customerId}`)
  }

  const notifications = data?.items ?? []
  const total = data?.meta.total ?? 0
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[22rem] bg-white rounded-2xl shadow-2xl border border-outline-variant z-50 overflow-hidden"
      style={{ animation: 'panel-slide-in 0.18s cubic-bezier(0.34,1.15,0.64,1) both' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px] filled">notifications</span>
          <h3 className="font-jakarta font-bold text-on-surface text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || notifications.every((n) => n.read)}
          className="text-xs text-primary font-medium hover:underline disabled:opacity-40 disabled:no-underline"
        >
          Mark all read
        </button>
      </div>

      {/* List */}
      <div className="max-h-[26rem] overflow-y-auto divide-y divide-outline-variant/50">
        {isLoading && (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 spinner" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl opacity-30">notifications_off</span>
            <p className="text-sm">No notifications yet</p>
          </div>
        )}

        {notifications.map((n) => {
          const meta = TYPE_META[n.type] ?? {
            icon: 'info',
            color: 'text-on-surface-variant bg-surface-container',
            label: n.type,
          }
          return (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-surface-container-low/60 transition-colors group relative ${
                !n.read ? 'bg-primary/[0.03]' : ''
              }`}
            >
              {/* Unread indicator */}
              {!n.read && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}

              {/* Icon */}
              <div
                className={`flex-none w-8 h-8 rounded-xl flex items-center justify-center ${meta.color}`}
              >
                <span className="material-symbols-outlined text-[16px] filled">{meta.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-bold uppercase tracking-wide ${meta.color.split(' ')[0]}`}>
                    {meta.label}
                  </p>
                  <span className="flex-none text-[10px] text-on-surface-variant/70 mt-0.5">
                    {relativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-on-surface mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                {n.amountPaise != null && (
                  <p className="text-xs font-semibold text-on-surface-variant mt-1">
                    Balance: {formatPaise(n.amountPaise)}
                  </p>
                )}
                <p className="text-[11px] text-primary mt-1 font-medium group-hover:underline">
                  View customer →
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Pagination and View All footer */}
      <div className="flex flex-col border-t border-outline-variant bg-surface-container-low/40">
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/30">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs text-primary font-medium disabled:opacity-30 hover:underline"
            >
              ← Newer
            </button>
            <span className="text-[11px] text-on-surface-variant">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <button
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs text-primary font-medium disabled:opacity-30 hover:underline"
            >
              Older →
            </button>
          </div>
        )}
        <button
          onClick={() => {
            onClose()
            navigate('/notifications')
          }}
          className="w-full py-3 text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors"
        >
          View All Notifications
        </button>
      </div>
    </div>
  )
}
