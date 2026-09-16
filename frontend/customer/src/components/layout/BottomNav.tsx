import { NavLink } from 'react-router-dom'
import { Home, Repeat, Store, Truck, Wallet } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/subscriptions', icon: Repeat, label: 'Subs' },
  { to: '/products', icon: Store, label: 'Shop' },
  { to: '/orders', icon: Truck, label: 'Orders' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
]

/**
 * Floating pill nav — detached from the screen edge, dark surface with a
 * solid primary-colored circle behind the active icon. Icon-only (no labels)
 * to match a denser, more modern app-shell feel.
 */
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4 safe-bottom pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 bg-inverse-surface rounded-full shadow-popover px-2 py-2 max-w-fit">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className="focus-ring relative flex items-center justify-center w-12 h-12 rounded-full"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-primary pop-in" />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className={`relative z-10 transition-colors duration-200 ${
                    isActive ? 'text-on-primary' : 'text-inverse-on-surface/60'
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
