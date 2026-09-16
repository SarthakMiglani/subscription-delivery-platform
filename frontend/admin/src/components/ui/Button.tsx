import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary shadow-card hover:shadow-card-hover hover:brightness-[1.04] active:brightness-95',
  secondary:
    'bg-secondary text-on-secondary shadow-card hover:shadow-card-hover hover:brightness-[1.04] active:brightness-95',
  outline:
    'bg-surface-container text-on-surface hover:bg-surface-container-high active:bg-surface-container-highest',
  ghost:
    'bg-transparent text-primary hover:bg-primary-container/60 active:bg-primary-container',
  danger:
    'bg-error-container text-status-error hover:brightness-95 active:brightness-90',
}

const SIZES: Record<Size, string> = {
  sm: 'h-[34px] px-3.5 text-[13px] gap-1.5 rounded-full',
  md: 'h-10 px-5 text-sm gap-2 rounded-full',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-full',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', fullWidth, loading, icon, disabled, children, className = '', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      // min-w-0 is deliberate: without it, a whitespace-nowrap button placed
      // next to sibling fullWidth buttons in a flex row can force the row
      // (and any grid/card containing it) wider than its container, since
      // flex/grid items default to an automatic minimum size based on their
      // unshrinkable content. This lets the button shrink and its label
      // ellipsize instead of blowing out the layout.
      className={`focus-ring inline-flex items-center justify-center min-w-0 font-semibold transition-all duration-150 disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98] whitespace-nowrap ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : 16} /> : icon}
      <span className="truncate">{children}</span>
    </button>
  )
})
