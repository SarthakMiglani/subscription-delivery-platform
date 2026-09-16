import { forwardRef, useId } from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  required?: boolean
  error?: string
  hint?: string
}

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, required, error, hint, id, className = '', ...rest },
  ref
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-1.5">
        {label} {required && <span className="text-secondary">*</span>}
      </label>
      <input
        ref={ref}
        id={fieldId}
        className={`focus-ring w-full h-12 px-4 rounded-xl border bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 transition-colors ${
          error ? 'border-error focus-visible:outline-error' : 'border-outline-variant focus:border-primary'
        } ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...rest}
      />
      {error && <p id={`${fieldId}-error`} className="text-xs text-error mt-1.5">{error}</p>}
      {!error && hint && <p id={`${fieldId}-hint`} className="text-xs text-on-surface-variant mt-1.5">{hint}</p>}
    </div>
  )
})

export function TextAreaField({
  label,
  required,
  hint,
  id,
  className = '',
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; required?: boolean; hint?: string }) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-1.5">
        {label} {required && <span className="text-secondary">*</span>}
      </label>
      <textarea
        id={fieldId}
        className={`focus-ring w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary transition-colors resize-none ${className}`}
        aria-describedby={hint ? `${fieldId}-hint` : undefined}
        {...rest}
      />
      {hint && <p id={`${fieldId}-hint`} className="text-xs text-on-surface-variant mt-1.5">{hint}</p>}
    </div>
  )
}
