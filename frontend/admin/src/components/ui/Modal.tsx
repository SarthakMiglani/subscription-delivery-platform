import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Escape-to-close listener + initial focus. Deliberately keyed on `open`
  // only (not `onClose`) — callers pass a fresh inline arrow function on
  // every render (e.g. onClose={() => setModal(null)}), so including it in
  // the deps array reran this effect on every keystroke typed into any
  // input inside the modal (each keystroke updates state -> parent
  // re-renders -> new onClose reference -> effect reruns -> focus() steals
  // focus back to the panel, away from the input, right after each
  // character). A ref keeps the latest onClose available without that.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-backdrop absolute inset-0 bg-inverse-surface/45 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'admin-modal-title' : undefined}
        tabIndex={-1}
        className={`modal-panel relative w-full mx-2 sm:mx-0 ${widths[size]} bg-surface-container-lowest rounded-2xl shadow-popover max-h-[90vh] overflow-y-auto outline-none`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
            <h2 id="admin-modal-title" className="font-jakarta font-semibold text-on-surface text-lg">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="focus-ring text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
