interface Props {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = 'inbox', title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      <span className="material-symbols-outlined text-outline text-5xl">{icon}</span>
      <h3 className="font-jakarta font-semibold text-on-surface">{title}</h3>
      {description && <p className="text-on-surface-variant text-sm max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
