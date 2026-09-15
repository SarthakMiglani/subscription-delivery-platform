import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'home', label: 'Home' },
  { to: '/subscriptions', icon: 'repeat', label: 'Subs' },
  { to: '/products', icon: 'storefront', label: 'Shop' },
  { to: '/orders', icon: 'local_shipping', label: 'Orders' },
  { to: '/wallet', icon: 'account_balance_wallet', label: 'Wallet' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-outline-variant safe-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0 flex-1 ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[22px] ${isActive ? 'filled' : ''}`}>{icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
