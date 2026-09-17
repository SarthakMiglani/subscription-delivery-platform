import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
    // Rendered via React Portal directly into document.body.
    // This escapes the page-enter animation container (which temporarily
    // makes fixed-position descendants relative to it instead of the
    // viewport during its translateY transform), and clears the sidebar
    // (z-30) with z-[60].
    createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <div
          className="modal-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Panel — flex column so the title bar never scrolls away */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'admin-modal-title' : undefined}
          tabIndex={-1}
          className={`modal-panel relative w-full ${widths[size]} bg-surface-container-lowest rounded-2xl shadow-popover flex flex-col outline-none`}
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
        >
          {/* Sticky title bar */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
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
          {/* Scrollable content — only this zone scrolls when content is tall */}
          <div className="p-6 overflow-y-auto">{children}</div>
        </div>
      </div>,
      document.body
    )
  )
}
