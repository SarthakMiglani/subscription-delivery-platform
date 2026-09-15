interface Props {
  size?: number
  className?: string
}

export function Spinner({ size = 24, className = '' }: Props) {
  return (
    <div
      className={`spinner ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  )
}
