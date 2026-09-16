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
    <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant bg-surface-container-lowest">
      <p className="text-sm text-on-surface-variant">
        Showing {page * size + 1}–{Math.min((page + 1) * size, total)} of {total}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 0}
          className="focus-ring flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-outline-variant rounded-lg disabled:opacity-40 hover:bg-surface-container-low transition-colors"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="focus-ring flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-outline-variant rounded-lg disabled:opacity-40 hover:bg-surface-container-low transition-colors"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
