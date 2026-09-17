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
 * Floating pill nav — frosted glass dark surface, lifted well clear of the
 * screen edge, label visible under the active icon only.
 */
export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className="pointer-events-auto flex items-center gap-0.5 rounded-[2rem] px-2 py-2 shadow-popover"
        style={{
          background: 'rgba(37,29,15,0.88)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className="focus-ring relative flex flex-col items-center justify-center rounded-[1.5rem] transition-all duration-200"
            style={{ width: 56, minHeight: 52 }}
          >
            {({ isActive }) => (
              <>
                {/* Active background pill */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-[1.5rem] pop-in"
                    style={{ background: '#c1502e' }}
                  />
                )}

                {/* Icon */}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className="relative z-10 transition-all duration-200"
                  style={{
                    color: isActive ? '#ffffff' : 'rgba(253,246,232,0.5)',
                    marginTop: isActive ? 4 : 0,
                    marginBottom: isActive ? 0 : 0,
                  }}
                />

                {/* Label — only visible when active */}
                <span
                  className="relative z-10 font-medium leading-none transition-all duration-200 overflow-hidden"
                  style={{
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontSize: 10,
                    color: isActive ? 'rgba(255,255,255,0.9)' : 'transparent',
                    maxHeight: isActive ? 14 : 0,
                    marginTop: isActive ? 2 : 0,
                    opacity: isActive ? 1 : 0,
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
