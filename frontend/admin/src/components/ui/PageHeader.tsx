import { NotificationBell } from '../layout/NotificationBell'

interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 sm:p-6 border-b border-outline-variant bg-white">
      <div>
        <h1 className="font-jakarta font-bold text-on-surface text-xl sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-on-surface-variant text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        <div className="hidden md:flex border-l border-outline-variant pl-3 ml-1">
          <NotificationBell />
        </div>
      </div>
    </div>
  )
}

