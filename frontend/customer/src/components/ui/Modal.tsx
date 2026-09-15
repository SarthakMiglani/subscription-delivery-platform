import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="modal-backdrop absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-panel relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 pb-8 sm:pb-6 max-h-[90vh] overflow-y-auto">
        {/* drag handle — mobile only */}
        <div className="sm:hidden w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4" />
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-jakarta font-semibold text-on-surface text-lg">{title}</h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
