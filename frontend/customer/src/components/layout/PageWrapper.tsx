interface Props {
  children: React.ReactNode
  className?: string
  noPad?: boolean
}

export function PageWrapper({ children, className = '', noPad }: Props) {
  return (
    <main className={`page-enter max-w-lg mx-auto pb-32 min-h-dvh ${noPad ? '' : 'px-4'} ${className}`}>
      {children}
    </main>
  )
}
