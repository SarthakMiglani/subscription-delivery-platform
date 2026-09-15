import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { apiGetPaged } from '../lib/api'
import { todayIST, formatDateTime } from '../lib/utils'
import type { AdminCustomerListItem, SchedulerJobLog, AdminOrderListItem } from '../types'

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  trend?: string
  onClick?: () => void
}

function StatCard({ label, value, icon, trend, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-outline-variant group transition-all duration-200 ${
        onClick
          ? 'cursor-pointer hover:border-primary hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
          : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-primary/8 group-hover:bg-primary/12 transition-colors">
          <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
        </div>
        {onClick && (
          <span className="material-symbols-outlined text-outline-variant group-hover:text-primary text-base transition-colors">
            arrow_forward
          </span>
        )}
      </div>
      <p className="font-jakarta font-bold text-on-surface text-3xl leading-none">{value}</p>
      <p className="text-on-surface-variant text-sm mt-1.5">{label}</p>
      {trend && <p className="text-xs text-status-active mt-1">{trend}</p>}
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-outline-variant">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-surface-container rounded-xl animate-pulse" />
      </div>
      <div className="h-8 bg-surface-container rounded w-16 animate-pulse" />
      <div className="h-3.5 bg-surface-container rounded w-28 mt-2 animate-pulse" />
    </div>
  )
}

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
    <div className="page-enter">
      <PageHeader title="Dashboard" subtitle={`Today — ${today}`} actions={
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/8 rounded-xl">
          <span className="material-symbols-outlined text-primary text-base">schedule</span>
          <span className="text-xs font-bold text-primary uppercase tracking-wide">Next Cutoff</span>
          <span className="text-xs font-semibold text-on-surface-variant ml-0.5">10:00 PM IST</span>
        </div>
      } />

      <div className="p-4 sm:p-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
          {anyLoading ? (
            [1, 2, 3].map(i => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                label="Total Customers"
                value={customers.data?.meta.total ?? '—'}
                icon="group"
                onClick={() => navigate('/customers')}
              />
              <StatCard
                label="Today's Deliveries"
                value={todayOrders.data?.meta.total ?? '—'}
                icon="local_shipping"
                onClick={() => navigate('/delivery')}
              />
              <StatCard
                label="Locked Orders"
                value={lockedOrders.data?.meta.total ?? '—'}
                icon="lock"
                onClick={() => navigate('/delivery')}
              />
            </>
          )}
        </div>

        {/* Quick Tasks */}
        <div className="mb-6">
          <h2 className="font-jakarta font-semibold text-on-surface text-sm uppercase tracking-wider mb-3 text-on-surface-variant">Quick Tasks</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: 'account_balance_wallet', label: 'Credit Wallet', path: '/customers' },
              { icon: 'add_box', label: 'Add Product', path: '/products' },
              { icon: 'receipt_long', label: 'Delivery Sheet', path: '/delivery' },
            ].map(task => (
              <button
                key={task.path}
                onClick={() => navigate(task.path)}
                className="bg-white border border-outline-variant rounded-xl p-3 sm:p-4 flex flex-col items-center gap-1.5 hover:border-primary hover:shadow-sm transition-all group"
              >
                <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">{task.icon}</span>
                <span className="text-xs font-medium text-on-surface-variant text-center leading-tight">{task.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent jobs */}
        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">schedule</span>
              <h2 className="font-jakarta font-semibold text-on-surface">Recent Scheduler Jobs</h2>
            </div>
            <button
              onClick={() => navigate('/scheduler')}
              className="text-primary text-sm font-medium flex items-center gap-0.5 hover:underline"
            >
              View all
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>

          {recentJobs.isLoading ? (
            <div className="divide-y divide-outline-variant">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="h-4 bg-surface-container rounded w-40 animate-pulse" />
                    <div className="h-3 bg-surface-container rounded w-28 animate-pulse" />
                  </div>
                  <div className="h-5 bg-surface-container rounded-full w-20 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {(recentJobs.data?.items ?? []).map(job => (
                <div key={job.id} className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-surface-container-low/60 transition-colors">
                  <div>
                    <p className="text-on-surface text-sm font-medium">{job.jobName}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">{formatDateTime(job.ranAt)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    job.status === 'COMPLETED' ? 'bg-green-100 text-status-active' :
                    job.status === 'RUNNING'   ? 'bg-blue-100  text-status-future' :
                    'bg-red-100 text-status-error'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
              {(recentJobs.data?.items ?? []).length === 0 && (
                <p className="px-5 sm:px-6 py-8 text-center text-on-surface-variant text-sm">No jobs run yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
