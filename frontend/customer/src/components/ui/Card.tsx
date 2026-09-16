interface Props extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  padded?: boolean
}

/**
 * Base surface card. Borderless — elevation comes from shadow alone, not a
 * hairline border, for a softer/more modern "floating" look. `interactive`
 * adds hover/press affordances for card-as-button use cases (still render a
 * real <button>/<a> inside for a11y when the whole card is clickable).
 */
export function Card({ interactive, padded = true, className = '', children, ...rest }: Props) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-[1.75rem] shadow-card ${
        padded ? 'p-5' : ''
      } ${
        interactive
          ? 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0 cursor-pointer'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
