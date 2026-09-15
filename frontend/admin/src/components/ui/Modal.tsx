import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-backdrop absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`modal-panel relative w-full mx-2 sm:mx-0 ${widths[size]} bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
            <h2 className="font-jakarta font-semibold text-on-surface text-lg">{title}</h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
