import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { apiGet } from '../../lib/api'
import { NotificationPanel } from './NotificationPanel'

export function NotificationBell() {
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['admin-notifications-unread'],
    queryFn: () => apiGet<{ count: number }>('/admin/notifications/unread-count'),
    refetchInterval: 30_000,
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
        className={`focus-ring relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
          open ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <Bell size={19} strokeWidth={1.75} className={unread > 0 && !open ? 'bell-ring' : ''} fill={open ? 'currentColor' : 'none'} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-secondary text-on-secondary text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && <NotificationPanel onClose={handleClose} />}
    </div>
  )
}
