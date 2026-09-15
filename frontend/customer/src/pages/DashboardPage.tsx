import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatusBadge } from '../components/ui/StatusBadge'
import { apiGet, apiGetPaged } from '../lib/api'
import { formatPaise, formatPaiseCompact, formatDate, formatDateRelative, nowInIST } from '../lib/utils'
import type { CustomerProfile, Subscription, OrderListItem } from '../types'

function getTimeGreeting(): string {
  const hour = nowInIST().getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function DashboardPage() {
  const navigate = useNavigate()

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet<CustomerProfile>('/customer/me'),
  })

  const upcomingOrders = useQuery({
    queryKey: ['orders', 'SCHEDULED'],
    queryFn: () => apiGetPaged<OrderListItem>('/orders', { status: 'SCHEDULED', size: 1 }),
  })

  const activeSubs = useQuery({
    queryKey: ['subscriptions', 'ACTIVE'],
    queryFn: () => apiGetPaged<Subscription>('/subscriptions', { status: 'ACTIVE', size: 5 }),
  })

  const wallet = profile.data?.wallet
  const nextOrder = upcomingOrders.data?.items[0]
  const subs = activeSubs.data?.items ?? []

  const lowBalance = wallet && wallet.balancePaise < wallet.lowBalanceThresholdPaise

  return (
    <>
      <TopBar
        title="FreshFlow"
        rightElement={
          <button
            onClick={() => navigate('/profile')}
            className="p-1.5 -mr-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Profile"
          >
            <span className="material-symbols-outlined text-[24px]">account_circle</span>
          </button>
        }
      />
      <PageWrapper>
        {/* Low balance banner */}
        {lowBalance && (
          <div className="mt-4 mb-0 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-status-warning text-xl mt-0.5 shrink-0">warning</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-status-warning text-sm">Low Balance</p>
              <p className="text-on-surface-variant text-xs mt-0.5">
                {wallet && formatPaise(wallet.balancePaise)} remaining — top up to avoid missed deliveries.
              </p>
            </div>
            <button
              onClick={() => navigate('/wallet')}
              className="text-xs text-status-warning font-semibold underline shrink-0"
            >
              Recharge
            </button>
          </div>
        )}

        {/* Greeting */}
        <div className="mt-6 mb-5">
          {profile.isLoading ? (
            <div className="space-y-1.5">
              <div className="h-7 bg-surface-container rounded-lg w-44 animate-pulse" />
              <div className="h-4 bg-surface-container rounded-lg w-56 animate-pulse" />
            </div>
          ) : (
            <>
              <h2 className="font-jakarta font-bold text-on-surface text-2xl">
                {getTimeGreeting()}, {profile.data?.name?.split(' ')[0] || 'there'}! 👋
              </h2>
              <p className="text-on-surface-variant text-sm mt-0.5">Here's your delivery overview</p>
            </>
          )}
        </div>

        {/* Wallet card */}
        {profile.isLoading ? (
          <div className="rounded-2xl p-5 mb-4 bg-surface-container-high animate-pulse h-28" />
        ) : (
          <div className="bg-primary-container rounded-2xl p-5 mb-4 relative overflow-hidden">
            {/* decorative ring */}
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -right-2 top-8 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-on-primary-container/70 text-xs font-bold uppercase tracking-widest mb-1">Wallet</p>
                <p className="font-mono font-bold text-on-primary-container text-3xl leading-none">
                  {wallet ? formatPaise(wallet.balancePaise) : '—'}
                </p>
                <button
                  onClick={() => navigate('/wallet')}
                  className="mt-3 text-xs text-on-primary-container/80 font-medium underline underline-offset-2"
                >
                  View ledger →
                </button>
              </div>
              <button
                onClick={() => navigate('/wallet')}
                className="shrink-0 px-3 py-2 bg-white/15 hover:bg-white/25 active:bg-white/10 transition-colors rounded-xl text-on-primary-container text-xs font-semibold"
              >
                Top up
              </button>
            </div>
          </div>
        )}

        {/* Next delivery */}
        <div className="mb-4">
          <h3 className="font-jakarta font-semibold text-on-surface text-base mb-3">Next Delivery</h3>
          {upcomingOrders.isLoading ? (
            <div className="bg-white rounded-2xl p-4 border border-outline-variant">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-surface-container rounded w-32 animate-pulse" />
                  <div className="h-3 bg-surface-container rounded w-44 animate-pulse" />
                  <div className="h-3 bg-surface-container rounded w-24 animate-pulse" />
                </div>
                <div className="h-6 bg-surface-container rounded-full w-16 animate-pulse" />
              </div>
            </div>
          ) : nextOrder ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-on-surface">{nextOrder.productName}</p>
                  <p className="text-on-surface-variant text-sm mt-0.5">
                    Qty: {nextOrder.quantity} · Morning Delivery
                  </p>
                  <p className="text-on-surface-variant text-xs mt-1 font-medium">
                    {formatDateRelative(nextOrder.deliveryDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={nextOrder.status} />
                  <p className="text-on-surface-variant text-xs mt-2">
                    {formatPaiseCompact(nextOrder.totalAmountPaise)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-outline-variant text-center">
              <span className="material-symbols-outlined text-outline text-3xl mb-2 block">local_shipping</span>
              <p className="text-on-surface-variant text-sm">No upcoming deliveries</p>
              <button
                onClick={() => navigate('/products')}
                className="text-primary text-sm font-medium underline mt-1.5 block mx-auto"
              >
                Browse products →
              </button>
            </div>
          )}
        </div>

        {/* Active subscriptions */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-jakarta font-semibold text-on-surface text-base">Active Subscriptions</h3>
            <button
              onClick={() => navigate('/subscriptions')}
              className="text-primary text-xs font-medium hover:underline"
            >
              View all
            </button>
          </div>
          {activeSubs.isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-outline-variant p-4 flex items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-surface-container rounded w-28 animate-pulse" />
                    <div className="h-3 bg-surface-container rounded w-36 animate-pulse" />
                  </div>
                  <div className="h-6 bg-surface-container rounded-full w-14 animate-pulse" />
                </div>
              ))}
            </div>
          ) : subs.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 border border-outline-variant text-center">
              <span className="material-symbols-outlined text-outline text-3xl mb-2 block">water_drop</span>
              <p className="text-on-surface-variant text-sm">No active subscriptions</p>
              <button
                onClick={() => navigate('/products')}
                className="text-primary text-sm font-medium underline mt-1.5 block mx-auto"
              >
                Subscribe now →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {subs.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => navigate('/subscriptions')}
                  className="bg-white rounded-2xl p-4 border border-outline-variant flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 active:scale-[0.98] hover:border-primary hover:shadow-sm"
                >
                  <div>
                    <p className="font-medium text-on-surface text-sm">{sub.productName}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">
                      Qty: {sub.quantity} · Starts {formatDate(sub.effectiveStartDate)}
                    </p>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  )
}
