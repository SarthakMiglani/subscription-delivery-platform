import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  total: number
  size: number
  onChange: (page: number) => void
}

export function Pagination({ page, total, size, onChange }: Props) {
  const totalPages = Math.ceil(total / size)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between py-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="focus-ring flex items-center gap-1 px-3.5 py-2 text-sm font-semibold border border-outline-variant rounded-xl disabled:opacity-40 hover:bg-surface-container-low transition-colors"
      >
        <ChevronLeft size={15} /> Prev
      </button>
      <span className="text-xs text-on-surface-variant font-medium">
        {page * size + 1}–{Math.min((page + 1) * size, total)} of {total}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={(page + 1) * size >= total}
        className="focus-ring flex items-center gap-1 px-3.5 py-2 text-sm font-semibold border border-outline-variant rounded-xl disabled:opacity-40 hover:bg-surface-container-low transition-colors"
      >
        Next <ChevronRight size={15} />
      </button>
    </div>
  )
}
