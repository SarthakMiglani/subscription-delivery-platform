import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Users, Truck, Lock, ArrowUpRight, ChevronRight, Clock, Wallet, PackagePlus, ReceiptText } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { apiGetPaged } from '../lib/api'
import { todayIST, formatDateTime } from '../lib/utils'
import type { AdminCustomerListItem, SchedulerJobLog, AdminOrderListItem } from '../types'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  hero?: boolean
  onClick?: () => void
}

function StatCard({ label, value, icon: Icon, hero, onClick }: StatCardProps) {
  if (hero) {
    return (
      <button
        onClick={onClick}
        className="focus-ring text-left bg-primary rounded-[1.5rem] p-5 shadow-card relative overflow-hidden transition-transform hover:-translate-y-0.5"
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-on-primary/[0.07] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="w-10 h-10 rounded-2xl bg-on-primary/10 flex items-center justify-center">
              <Icon size={19} className="text-on-primary" strokeWidth={1.75} />
            </div>
            <ArrowUpRight size={16} className="text-on-primary/60" />
          </div>
          <p className="font-jakarta font-semibold text-on-primary text-3xl leading-none">{value}</p>
          <p className="text-on-primary/70 text-sm mt-1.5">{label}</p>
        </div>
      </button>
    )
  }
  return (
    <button onClick={onClick} className="focus-ring text-left bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-card transition-transform hover:-translate-y-0.5 group">
      <div className="flex items-center justify-between mb-5">
        <div className="w-10 h-10 rounded-2xl bg-primary-container flex items-center justify-center">
          <Icon size={19} className="text-primary" strokeWidth={1.75} />
        </div>
        <ArrowUpRight size={16} className="text-outline-variant group-hover:text-primary transition-colors" />
      </div>
      <p className="font-jakarta font-semibold text-on-surface text-3xl leading-none">{value}</p>
      <p className="text-on-surface-variant text-sm mt-1.5">{label}</p>
    </button>
  )
}

function StatCardSkeleton({ hero }: { hero?: boolean }) {
  return (
    <div className={`rounded-[1.5rem] p-5 shadow-card ${hero ? 'bg-primary/10' : 'bg-surface-container-lowest'}`}>
      <div className="w-10 h-10 skeleton rounded-2xl mb-5" />
      <div className="h-8 skeleton rounded w-16" />
      <div className="h-3.5 skeleton rounded w-28 mt-2" />
    </div>
  )
}

const QUICK_TASKS = [
  { icon: Wallet, label: 'Credit Wallet', path: '/customers' },
  { icon: PackagePlus, label: 'Add Product', path: '/products' },
  { icon: ReceiptText, label: 'Delivery Sheet', path: '/delivery' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const today = todayIST()

  const customers = useQuery({
    queryKey: ['admin-customers-count'],
    queryFn: () => apiGetPaged<AdminCustomerListItem>('/admin/customers', { size: 1 }),
  })

  const todayOrders = useQuery({
    queryKey: ['admin-orders-today'],
    queryFn: () => apiGetPaged<AdminOrderListItem>('/admin/orders', { deliveryDate: today, size: 1 }),
  })

  const lockedOrders = useQuery({
    queryKey: ['admin-orders-locked'],
    queryFn: () => apiGetPaged<AdminOrderListItem>('/admin/orders', { status: 'LOCKED', size: 1 }),
  })

  const recentJobs = useQuery({
    queryKey: ['scheduler-history-recent'],
    queryFn: () => apiGetPaged<SchedulerJobLog>('/admin/scheduler/history', { size: 5 }),
  })

  const anyLoading = customers.isLoading || todayOrders.isLoading || lockedOrders.isLoading

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Today — ${today}`}
        actions={
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-tertiary-container rounded-full">
            <Clock size={14} className="text-tertiary" />
            <span className="text-xs font-bold text-tertiary uppercase tracking-wide">Next Cutoff</span>
            <span className="text-xs font-semibold text-on-tertiary-container ml-0.5">10:00 PM IST</span>
          </div>
        }
      />

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {anyLoading ? (
            [1, 2, 3].map((i) => <StatCardSkeleton key={i} hero={i === 1} />)
          ) : (
            <>
              <StatCard hero label="Total Customers" value={customers.data?.meta.total ?? '—'} icon={Users} onClick={() => navigate('/customers')} />
              <StatCard label="Today's Deliveries" value={todayOrders.data?.meta.total ?? '—'} icon={Truck} onClick={() => navigate('/delivery')} />
              <StatCard label="Locked Orders" value={lockedOrders.data?.meta.total ?? '—'} icon={Lock} onClick={() => navigate('/delivery')} />
            </>
          )}
        </div>

        <div className="mb-8">
          <h2 className="font-jakarta font-semibold text-xs uppercase tracking-wider mb-3 text-on-surface-variant">Quick Tasks</h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_TASKS.map((task) => (
              <button
                key={task.path}
                onClick={() => navigate(task.path)}
                className="focus-ring bg-surface-container-lowest rounded-[1.5rem] shadow-card p-3 sm:p-4 flex flex-col items-center gap-2 hover:shadow-card-hover hover:-translate-y-0.5 transition-all group"
              >
                <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                  <task.icon size={17} className="text-secondary" strokeWidth={1.75} />
                </div>
                <span className="text-xs font-medium text-on-surface-variant text-center leading-tight">{task.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Card padded={false} className="overflow-hidden">
          <div className="px-5 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h2 className="font-jakarta font-semibold text-on-surface">Recent Scheduler Jobs</h2>
            </div>
            <button onClick={() => navigate('/scheduler')} className="focus-ring text-primary text-sm font-semibold flex items-center gap-0.5 hover:underline rounded">
              View all
              <ChevronRight size={14} />
            </button>
          </div>

          {recentJobs.isLoading ? (
            <div className="divide-y divide-outline-variant/60">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="h-4 skeleton rounded w-40" />
                    <div className="h-3 skeleton rounded w-28" />
                  </div>
                  <div className="h-5 skeleton rounded-full w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/60">
              {(recentJobs.data?.items ?? []).map((job) => (
                <div key={job.id} className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-surface-container-low/60 transition-colors">
                  <div>
                    <p className="text-on-surface text-sm font-medium">{job.jobName}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">{formatDateTime(job.ranAt)}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
              {(recentJobs.data?.items ?? []).length === 0 && (
                <p className="px-5 sm:px-6 py-8 text-center text-on-surface-variant text-sm">No jobs run yet.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
