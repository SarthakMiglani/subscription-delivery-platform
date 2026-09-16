import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BellOff } from 'lucide-react'
import { api, apiGetPaged } from '../lib/api'
import { notificationMeta, relativeTime } from '../lib/notifications'
import { formatPaise } from '../lib/utils'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import type { AdminNotification } from '../types'

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
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jakarta font-bold text-on-surface text-2xl">Notifications</h1>
          <p className="text-on-surface-variant text-sm mt-1">View and manage all system alerts</p>
        </div>
        <button
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || notifications.every((n) => n.read)}
          className="focus-ring text-sm font-semibold text-primary hover:underline disabled:opacity-40 rounded"
        >
          Mark all as read
        </button>
      </div>

      <Card padded={false} className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-on-surface-variant">
            <BellOff size={44} className="opacity-30 mb-4" strokeWidth={1.5} />
            <p>No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {notifications.map((n) => {
              const meta = notificationMeta(n.type)
              const Icon = meta.icon
              return (
                <div key={n.id} className={`flex items-start justify-between gap-4 p-5 transition-colors hover:bg-surface-container-low/40 ${!n.read ? 'bg-primary/[0.02]' : ''}`}>
                  <div className="flex gap-4">
                    <div className={`flex-none w-10 h-10 rounded-xl flex items-center justify-center ${meta.classes}`}>
                      <Icon size={18} strokeWidth={1.9} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-bold uppercase tracking-wide ${meta.classes.split(' ')[0]}`}>{meta.label}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-on-surface mt-1">{n.message}</p>
                      {n.amountPaise != null && (
                        <p className="text-sm font-semibold text-on-surface-variant mt-1.5">Amount: {formatPaise(n.amountPaise)}</p>
                      )}
                      <p className="text-xs text-on-surface-variant mt-2 font-medium">{relativeTime(n.createdAt)}</p>
                    </div>
                  </div>
                  {n.customerId && (
                    <Button size="sm" variant="outline" className="flex-none" onClick={() => handleNotificationClick(n)}>
                      View Customer
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <Pagination page={page} total={total} size={PAGE_SIZE} onChange={setPage} />
      </Card>
    </div>
  )
}
