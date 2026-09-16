import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
        <Icon size={26} className="text-outline" strokeWidth={1.75} />
      </div>
      <h3 className="font-jakarta font-semibold text-on-surface text-base">{title}</h3>
      {description && <p className="text-on-surface-variant text-sm max-w-xs leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}
