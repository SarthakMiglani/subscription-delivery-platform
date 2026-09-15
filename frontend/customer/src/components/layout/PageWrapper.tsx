interface Props {
  children: React.ReactNode
  className?: string
  noPad?: boolean
}

export function PageWrapper({ children, className = '', noPad }: Props) {
  return (
    <main className={`max-w-lg mx-auto pb-24 min-h-dvh ${noPad ? '' : 'px-4'} ${className}`}>
      {children}
    </main>
  )
}
