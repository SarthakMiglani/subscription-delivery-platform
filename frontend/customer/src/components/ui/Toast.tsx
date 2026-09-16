import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem { id: number; kind: ToastKind; message: string }

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const KIND_META: Record<ToastKind, { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'bg-primary text-on-primary' },
  error: { icon: AlertCircle, classes: 'bg-error text-on-error' },
  info: { icon: Info, classes: 'bg-inverse-surface text-inverse-on-surface' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++counter.current
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-0 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4 pointer-events-none safe-top">
        {toasts.map((t) => {
          const meta = KIND_META[t.kind]
          const Icon = meta.icon
          return (
            <div
              key={t.id}
              className={`toast-enter pointer-events-auto max-w-sm w-full flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-popover ${meta.classes}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium leading-snug flex-1">{t.message}</p>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

// Re-export X for consumers that build custom dismissible banners with the same icon set.
export { X }
