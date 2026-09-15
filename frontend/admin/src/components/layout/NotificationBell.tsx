import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { NotificationPanel } from './NotificationPanel'

export function NotificationBell() {
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['admin-notifications-unread'],
    queryFn: () => apiGet<{ count: number }>('/admin/notifications/unread-count'),
    refetchInterval: 30_000, // poll every 30 s
    refetchIntervalInBackground: true,
  })

  const unread = data?.count ?? 0
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <div className="relative">
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread > 0 ? ` — ${unread} unread` : ''}`}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
          open
            ? 'bg-primary/15 text-primary'
            : 'text-on-primary-container hover:bg-on-primary-container/10'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] ${
            unread > 0 && !open ? 'bell-ring' : ''
          } ${open ? 'filled' : ''}`}
        >
          notifications
        </span>

        {/* Unread badge */}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && <NotificationPanel onClose={handleClose} />}
    </div>
  )
}
