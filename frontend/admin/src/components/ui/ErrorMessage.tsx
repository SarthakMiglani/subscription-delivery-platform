import { AlertTriangle } from 'lucide-react'

interface Props { message: string; onRetry?: () => void }
export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
        <AlertTriangle size={22} className="text-status-error" strokeWidth={1.75} />
      </div>
      <p className="text-on-surface-variant">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="focus-ring text-primary text-sm font-semibold rounded-lg px-3 py-1.5 hover:bg-primary-container/60 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}
