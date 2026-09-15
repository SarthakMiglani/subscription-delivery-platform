import { useNavigate } from 'react-router-dom'

interface Props {
  title: string
  showBack?: boolean
  rightElement?: React.ReactNode
}

export function TopBar({ title, showBack, rightElement }: Props) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-outline-variant">
      <div className="flex items-center h-14 px-4 gap-2 max-w-lg mx-auto">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        <h1 className="flex-1 font-jakarta font-semibold text-on-surface text-base truncate">{title}</h1>
        {rightElement}
      </div>
    </header>
  )
}
