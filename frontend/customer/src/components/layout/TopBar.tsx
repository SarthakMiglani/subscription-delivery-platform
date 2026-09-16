import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Props {
  title: string
  showBack?: boolean
  rightElement?: React.ReactNode
}

export function TopBar({ title, showBack, rightElement }: Props) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md safe-top">
      <div className="flex items-center h-16 px-4 gap-2 max-w-lg mx-auto">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="focus-ring flex items-center justify-center w-10 h-10 -ml-1 rounded-full bg-surface-container-lowest shadow-card text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ArrowLeft size={19} />
          </button>
        )}
        <h1 className="flex-1 font-jakarta font-semibold text-on-surface text-[19px] truncate">{title}</h1>
        {rightElement}
      </div>
    </header>
  )
}
