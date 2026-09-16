import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
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
    // Focus the panel so Escape/keyboard interaction works immediately.
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="modal-backdrop absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className="modal-panel relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl shadow-popover p-6 pb-8 sm:pb-6 max-h-[90vh] overflow-y-auto outline-none"
      >
        <div className="sm:hidden w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4" />
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 id="modal-title" className="font-jakarta font-semibold text-on-surface text-lg">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="focus-ring text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
