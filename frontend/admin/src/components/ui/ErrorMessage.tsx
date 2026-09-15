interface Props { message: string; onRetry?: () => void }
export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="material-symbols-outlined text-status-error text-4xl">error_outline</span>
      <p className="text-on-surface-variant">{message}</p>
      {onRetry && <button onClick={onRetry} className="text-primary text-sm underline">Try again</button>}
    </div>
  )
}
