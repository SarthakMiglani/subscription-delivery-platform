interface Props extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  padded?: boolean
}

export function Card({ interactive, padded = true, className = '', children, ...rest }: Props) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-[1.5rem] shadow-card ${
        padded ? 'p-5' : ''
      } ${
        interactive
          ? 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
