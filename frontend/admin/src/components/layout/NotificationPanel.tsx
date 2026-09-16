import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BellOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, apiGetPaged } from '../../lib/api'
import { notificationMeta, relativeTime } from '../../lib/notifications'
import { formatPaise } from '../../lib/utils'
import type { AdminNotification } from '../../types'

interface NotificationPanelProps {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const panelRef = useRef<HTMLDivElement>(null)

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
    if (n.customerId) navigate(`/customers/${n.customerId}`)
  }

  const notifications = data?.items ?? []
  const total = data?.meta.total ?? 0
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div
      ref={panelRef}
      className="panel-enter absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-2xl shadow-popover border border-outline-variant z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <h3 className="font-jakarta font-bold text-on-surface text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-secondary text-on-secondary rounded-full px-1.5 py-0.5 leading-none">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || notifications.every((n) => n.read)}
          className="focus-ring text-xs text-primary font-semibold hover:underline disabled:opacity-40 disabled:no-underline rounded"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-[26rem] overflow-y-auto divide-y divide-outline-variant/50">
        {isLoading && (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 spinner" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3 text-on-surface-variant">
            <BellOff size={32} className="opacity-30" strokeWidth={1.5} />
            <p className="text-sm">No notifications yet</p>
          </div>
        )}

        {notifications.map((n) => {
          const meta = notificationMeta(n.type)
          const Icon = meta.icon
          return (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`focus-ring w-full text-left flex gap-3 px-4 py-3 hover:bg-surface-container-low/60 transition-colors group relative ${
                !n.read ? 'bg-primary/[0.04]' : ''
              }`}
            >
              {!n.read && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />}

              <div className={`flex-none w-8 h-8 rounded-xl flex items-center justify-center ${meta.classes}`}>
                <Icon size={15} strokeWidth={1.9} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-bold uppercase tracking-wide ${meta.classes.split(' ')[0]}`}>{meta.label}</p>
                  <span className="flex-none text-[10px] text-on-surface-variant/70 mt-0.5">{relativeTime(n.createdAt)}</span>
                </div>
                <p className="text-xs text-on-surface mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                {n.amountPaise != null && (
                  <p className="text-xs font-semibold text-on-surface-variant mt-1">Balance: {formatPaise(n.amountPaise)}</p>
                )}
                {n.customerId && (
                  <p className="text-[11px] text-primary mt-1 font-medium group-hover:underline">View customer →</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col border-t border-outline-variant bg-surface-container-low/40">
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/30">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="focus-ring flex items-center gap-0.5 text-xs text-primary font-semibold disabled:opacity-30 hover:underline rounded"
            >
              <ChevronLeft size={13} /> Newer
            </button>
            <span className="text-[11px] text-on-surface-variant">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <button
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
              className="focus-ring flex items-center gap-0.5 text-xs text-primary font-semibold disabled:opacity-30 hover:underline rounded"
            >
              Older <ChevronRight size={13} />
            </button>
          </div>
        )}
        <button
          onClick={() => {
            onClose()
            navigate('/notifications')
          }}
          className="focus-ring w-full py-3 text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors"
        >
          View All Notifications
        </button>
      </div>
    </div>
  )
}
