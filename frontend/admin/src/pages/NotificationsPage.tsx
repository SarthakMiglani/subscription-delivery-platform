import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiGetPaged } from '../lib/api'
import type { AdminNotification } from '../types'

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
  WALLET_CREDITED: {
    icon: 'payments',
    color: 'text-green-600 bg-green-50',
    label: 'Wallet Credited',
  },
  SCHEDULER_JOB_FAILURE: {
    icon: 'error',
    color: 'text-red-600 bg-red-50',
    label: 'Scheduler Failure',
  },
  PRODUCT_AUTO_PAUSE: {
    icon: 'pause_circle',
    color: 'text-amber-600 bg-amber-50',
    label: 'Auto-Paused',
  },
  SUBSCRIPTION_CANCELLED: {
    icon: 'cancel',
    color: 'text-on-surface-variant bg-surface-container',
    label: 'Subscription Cancelled',
  },
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications-full', page],
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
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-full'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread'] })
    },
  })

  const markAll = useMutation({
    mutationFn: () => api.patch('/admin/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-full'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread'] })
    },
  })

  function handleNotificationClick(n: AdminNotification) {
    if (!n.read) markOne.mutate(n.id)
    if (n.customerId) navigate(`/customers/${n.customerId}`)
  }

  const notifications = data?.items ?? []
  const total = data?.meta.total ?? 0

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jakarta font-bold text-on-surface text-2xl">Notifications</h1>
          <p className="text-on-surface-variant text-sm mt-1">View and manage all system alerts</p>
        </div>
        <button
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || notifications.every(n => n.read)}
          className="text-sm font-semibold text-primary hover:underline disabled:opacity-40"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-30 mb-4">notifications_off</span>
            <p>No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {notifications.map((n) => {
              const meta = TYPE_META[n.type] ?? {
                icon: 'info',
                color: 'text-on-surface-variant bg-surface-container',
                label: n.type,
              }
              return (
                <div
                  key={n.id}
                  className={`flex items-start justify-between p-5 transition-colors hover:bg-surface-container-low/40 ${
                    !n.read ? 'bg-primary/[0.02]' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex-none w-10 h-10 rounded-xl flex items-center justify-center ${meta.color}`}
                    >
                      <span className="material-symbols-outlined text-[20px] filled">{meta.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-bold uppercase tracking-wide ${meta.color.split(' ')[0]}`}>
                          {meta.label}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-on-surface mt-1">{n.message}</p>
                      {n.amountPaise != null && (
                        <p className="text-sm font-semibold text-on-surface-variant mt-1.5">
                          Amount: {formatPaise(n.amountPaise)}
                        </p>
                      )}
                      <p className="text-xs text-on-surface-variant mt-2 font-medium">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNotificationClick(n)}
                    className="flex-none px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    View Customer
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between p-4 border-t border-outline-variant bg-surface-container-low/30">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-surface-container-low"
            >
              Previous
            </button>
            <span className="text-sm text-on-surface-variant font-medium">
              Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-surface-container-low"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
