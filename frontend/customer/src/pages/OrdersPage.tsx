import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Lock, Truck } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { Card } from '../components/ui/Card'
import { Pagination } from '../components/ui/Pagination'
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
    queryFn: () =>
      apiGetPaged<OrderListItem>('/orders', {
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
        <div className="flex gap-2 py-4 overflow-x-auto no-scrollbar -mx-4 px-4">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value)
                setPage(0)
              }}
              className={`focus-ring flex-none px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary text-on-primary shadow-card'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-2 pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 skeleton rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <EmptyState icon={Truck} title="No orders found" description="Orders appear here once your subscription starts." />
        )}

        {!isLoading && (
          <div className="space-y-2 pb-4">
            {orders.map((order, i) => (
              <Card
                key={order.id}
                style={{ '--i': i } as React.CSSProperties}
                className={`stagger-item ${order.isLocked ? 'opacity-80' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate">{order.productName}</p>
                    <p className="text-on-surface-variant text-sm mt-0.5">Qty {order.quantity} · {formatDate(order.deliveryDate)}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">Morning delivery</p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <StatusBadge status={order.status} />
                    <p className="font-mono text-on-surface text-sm font-bold mt-1.5">{formatPaiseCompact(order.totalAmountPaise)}</p>
                    {order.isLocked && (
                      <span className="inline-flex justify-end mt-1" title="Locked">
                        <Lock size={13} className="text-status-locked" />
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Pagination page={page} total={total} size={20} onChange={setPage} />
      </PageWrapper>
    </>
  )
}
