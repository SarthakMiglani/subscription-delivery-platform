import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { apiGetPaged } from '../lib/api'
import { formatDate, formatPaiseCompact } from '../lib/utils'
import type { OrderListItem, OrderStatus } from '../types'

const STATUS_FILTERS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Upcoming', value: 'SCHEDULED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Skipped', value: 'SKIPPED' },
]

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter, page],
    queryFn: () => apiGetPaged<OrderListItem>('/orders', {
      ...(statusFilter ? { status: statusFilter } : {}),
      page,
      size: 20,
    }),
  })

  const orders = data?.items ?? []
  const total = data?.meta.total ?? 0

  return (
    <>
      <TopBar title="Orders" />
      <PageWrapper>
        {/* Status filter tabs */}
        <div className="flex gap-2 py-4 overflow-x-auto no-scrollbar">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(0) }}
              className={`flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-white border border-outline-variant text-on-surface-variant'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-2 pb-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 border border-outline-variant">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-surface-container rounded w-36 animate-pulse" />
                    <div className="h-3 bg-surface-container rounded w-48 animate-pulse" />
                    <div className="h-3 bg-surface-container rounded w-24 animate-pulse" />
                  </div>
                  <div className="ml-3 text-right space-y-2">
                    <div className="h-5 bg-surface-container rounded-full w-20 animate-pulse" />
                    <div className="h-4 bg-surface-container rounded w-14 animate-pulse ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <EmptyState icon="local_shipping" title="No orders found" description="Orders appear here once your subscription starts." />
        )}

        {!isLoading && (
          <div className="space-y-2 pb-4">
            {orders.map(order => (
              <div key={order.id} className={`bg-white rounded-xl p-4 border border-outline-variant ${order.isLocked ? 'opacity-80' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate">{order.productName}</p>
                    <p className="text-on-surface-variant text-sm mt-0.5">Qty: {order.quantity} · {formatDate(order.deliveryDate)}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">Morning Delivery</p>
                  </div>
                  <div className="text-right ml-3">
                    <StatusBadge status={order.status} />
                    <p className="font-mono text-on-surface text-sm font-bold mt-1.5">{formatPaiseCompact(order.totalAmountPaise)}</p>
                    {order.isLocked && (
                      <span className="material-symbols-outlined text-status-locked text-sm block mt-1" title="Locked">lock</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-between items-center py-4">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              className="px-4 py-2 text-sm border border-outline-variant rounded-lg disabled:opacity-40">← Prev</button>
            <span className="text-sm text-on-surface-variant">{page * 20 + 1}–{Math.min((page + 1) * 20, total)} of {total}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 20 >= total}
              className="px-4 py-2 text-sm border border-outline-variant rounded-lg disabled:opacity-40">Next →</button>
          </div>
        )}
      </PageWrapper>
    </>
  )
}
