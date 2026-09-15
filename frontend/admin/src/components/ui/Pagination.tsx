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
    <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant bg-white">
      <p className="text-sm text-on-surface-variant">
        Showing {page * size + 1}–{Math.min((page + 1) * size, total)} of {total}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 0}
          className="px-3 py-1 text-sm border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container-low transition-colors"
        >
          Prev
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="px-3 py-1 text-sm border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container-low transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
