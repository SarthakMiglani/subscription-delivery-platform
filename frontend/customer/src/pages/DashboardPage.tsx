import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { UserCircle2, AlertTriangle, Truck, Droplets, ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Card } from '../components/ui/Card'
import { apiGet, apiGetPaged } from '../lib/api'
import { formatPaise, formatPaiseCompact, formatDate, formatDateRelative, nowInIST } from '../lib/utils'
import type { CustomerProfile, Subscription, OrderListItem } from '../types'

function getTimeGreeting(): string {
  const hour = nowInIST().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
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
      {/* Hero panel — replaces the plain TopBar on this page for a bolder first impression */}
      <div className="bg-primary rounded-b-[2.5rem] px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-on-primary/[0.07] pointer-events-none" />
        <div className="absolute right-16 top-20 w-20 h-20 rounded-full bg-on-primary/[0.07] pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/profile')}
              aria-label="Profile"
              className="focus-ring w-11 h-11 rounded-full bg-on-primary/10 flex items-center justify-center text-on-primary hover:bg-on-primary/20 transition-colors"
            >
              <UserCircle2 size={24} strokeWidth={1.6} />
            </button>
            <span className="text-xs font-bold text-on-primary/70 uppercase tracking-widest">FreshFlow</span>
          </div>

          {profile.isLoading ? (
            <div className="h-8 skeleton rounded-lg w-48 mb-1" />
          ) : (
            <h2 className="font-jakarta font-semibold text-on-primary text-2xl leading-tight mb-0.5">
              {getTimeGreeting()}, {profile.data?.name?.split(' ')[0] || 'there'}
            </h2>
          )}
          <p className="text-on-primary/65 text-sm mb-6">Here's your delivery overview</p>

          {/* Wallet */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-on-primary/60 text-xs font-bold uppercase tracking-widest mb-1.5">Wallet balance</p>
              <p className="font-mono font-bold text-on-primary text-4xl leading-none">
                {wallet ? formatPaise(wallet.balancePaise) : '—'}
              </p>
            </div>
            <button
              onClick={() => navigate('/wallet')}
              className="focus-ring shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-on-primary text-primary rounded-full text-sm font-bold shadow-card hover:brightness-95 transition-all"
            >
              Top up <Plus size={15} />
            </button>
          </div>
        </div>
      </div>

      <PageWrapper className="!pt-5">
        {lowBalance && (
          <div className="mb-5 p-4 bg-secondary-container rounded-2xl flex items-start gap-3">
            <AlertTriangle size={20} className="text-secondary mt-0.5 shrink-0" strokeWidth={1.75} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-secondary text-sm">Low balance</p>
              <p className="text-on-secondary-container/80 text-xs mt-0.5">
                {wallet && formatPaise(wallet.balancePaise)} remaining — top up to avoid missed deliveries.
              </p>
            </div>
          </div>
        )}

        {/* Next delivery */}
        <div className="mb-6">
          <h3 className="font-jakarta font-semibold text-on-surface text-base mb-3">Next delivery</h3>
          {upcomingOrders.isLoading ? (
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 skeleton rounded w-32" />
                  <div className="h-3 skeleton rounded w-44" />
                  <div className="h-3 skeleton rounded w-24" />
                </div>
                <div className="h-6 skeleton rounded-full w-16" />
              </div>
            </Card>
          ) : nextOrder ? (
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-tertiary-container flex items-center justify-center shrink-0">
                    <Truck size={19} className="text-tertiary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">{nextOrder.productName}</p>
                    <p className="text-on-surface-variant text-sm mt-0.5">Qty {nextOrder.quantity} · Morning delivery</p>
                    <p className="text-on-surface-variant text-xs mt-1 font-medium">{formatDateRelative(nextOrder.deliveryDate)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={nextOrder.status} />
                  <p className="text-on-surface-variant text-xs mt-2 font-mono">{formatPaiseCompact(nextOrder.totalAmountPaise)}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-container mx-auto flex items-center justify-center mb-2.5">
                <Truck size={21} className="text-outline" strokeWidth={1.75} />
              </div>
              <p className="text-on-surface-variant text-sm">No upcoming deliveries</p>
              <button
                onClick={() => navigate('/products')}
                className="focus-ring text-primary text-sm font-semibold mt-2 inline-flex items-center gap-0.5 rounded"
              >
                Browse products <ArrowRight size={14} />
              </button>
            </Card>
          )}
        </div>

        {/* Active subscriptions — horizontal scroll row */}
        <div className="mb-4 -mx-4">
          <div className="flex items-center justify-between mb-3 px-4">
            <h3 className="font-jakarta font-semibold text-on-surface text-base">Active subscriptions</h3>
            <button onClick={() => navigate('/subscriptions')} className="focus-ring text-primary text-xs font-bold rounded flex items-center gap-0.5">
              View all <ArrowUpRight size={13} />
            </button>
          </div>

          {activeSubs.isLoading ? (
            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar">
              {[1, 2].map((i) => <div key={i} className="h-32 w-52 skeleton rounded-[1.75rem] shrink-0" />)}
            </div>
          ) : subs.length === 0 ? (
            <div className="px-4">
              <Card className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-container mx-auto flex items-center justify-center mb-2.5">
                  <Droplets size={21} className="text-outline" strokeWidth={1.75} />
                </div>
                <p className="text-on-surface-variant text-sm">No active subscriptions</p>
                <button
                  onClick={() => navigate('/products')}
                  className="focus-ring text-primary text-sm font-semibold mt-2 inline-flex items-center gap-0.5 rounded"
                >
                  Subscribe now <ArrowRight size={14} />
                </button>
              </Card>
            </div>
          ) : (
            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
              {subs.map((sub, i) => (
                <button
                  key={sub.id}
                  onClick={() => navigate('/subscriptions')}
                  style={{ '--i': i } as React.CSSProperties}
                  className="stagger-item shrink-0 w-52 text-left bg-surface-container-lowest rounded-[1.75rem] p-4 shadow-card flex flex-col justify-between gap-3 transition-all duration-200 active:scale-[0.98] hover:shadow-card-hover hover:-translate-y-0.5 focus-ring"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
                    <Droplets size={16} className="text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-on-surface text-sm leading-snug">{sub.productName}</p>
                    <p className="text-on-surface-variant text-xs mt-1">Qty {sub.quantity} · Starts {formatDate(sub.effectiveStartDate)}</p>
                  </div>
                  <StatusBadge status={sub.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  )
}
