import { statusColors, statusLabel } from '../../lib/utils'

interface Props {
  status: string
  className?: string
}

export function StatusBadge({ status, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors(status)} ${className}`}>
      {statusLabel(status)}
    </span>
  )
}
