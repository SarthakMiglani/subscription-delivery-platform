import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import { Pagination } from '../components/ui/Pagination'
import { apiGetPaged, apiPatch, getApiError } from '../lib/api'
import { formatDate } from '../lib/utils'
import type { AdminSubscriptionListItem, SubscriptionStatus } from '../types'


export function SubscriptionsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('')
  const [overrideModal, setOverrideModal] = useState<AdminSubscriptionListItem | null>(null)
  const [overrideStatus, setOverrideStatus] = useState<SubscriptionStatus | ''>('')
  const [overrideQty, setOverrideQty] = useState('')
  const [overrideProductId, setOverrideProductId] = useState('')
  const [overrideNotes, setOverrideNotes] = useState('')
  const [formErr, setFormErr] = useState('')
  const [toast, setToast] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter, page],
    queryFn: () => apiGetPaged<AdminSubscriptionListItem>('/admin/subscriptions', {
      ...(statusFilter ? { status: statusFilter } : {}),
      page, size: 20,
    }),
  })

  const override = useMutation({
    mutationFn: () => apiPatch(`/admin/subscriptions/${overrideModal!.id}`, {
      ...(overrideStatus ? { status: overrideStatus } : {}),
      ...(overrideQty ? { quantity: parseInt(overrideQty) } : {}),
      ...(overrideProductId ? { productId: overrideProductId } : {}),
      ...(overrideNotes ? { notes: overrideNotes } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      setOverrideModal(null)
      setToast('Subscription updated')
      setTimeout(() => setToast(''), 3000)
    },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const statuses: (SubscriptionStatus | '')[] = ['', 'ACTIVE', 'PAUSED', 'PENDING_START', 'CANCELLED']
  const inputCls = 'w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary'

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle={`${data?.meta.total ?? 0} total`} />
      <div className="p-4 sm:p-6">
        {toast && <div className="mb-4 p-3 bg-green-50 border-l-4 border-status-active rounded-r-lg text-status-active text-sm font-medium">{toast}</div>}

        <div className="flex gap-2 flex-wrap mb-5">
          {statuses.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-on-primary' : 'bg-white border border-outline-variant text-on-surface-variant'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          {/* Desktop table — scrollable */}
          <div className="overflow-x-auto">
            <table className="hidden md:table min-w-[700px] w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Product</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Qty</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Start Date</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i}>
                      <td className="px-4 py-3"><div className="h-4 bg-surface-container rounded w-28 animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-surface-container rounded w-24 animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-surface-container rounded w-6 animate-pulse mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-5 bg-surface-container rounded-full w-16 animate-pulse mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-surface-container rounded w-20 animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-6 bg-surface-container rounded-lg w-16 animate-pulse ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  (data?.items ?? []).map(sub => (
                    <tr key={sub.id} className="hover:bg-surface-container-low/50">
                      <td className="px-4 py-3 font-medium text-on-surface">{sub.customerName}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{sub.productName}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold">{sub.quantity}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={sub.status} /></td>
                      <td className="px-4 py-3 text-on-surface-variant">{formatDate(sub.effectiveStartDate)}</td>
                      <td className="px-4 py-3 text-right">
                        {sub.status !== 'CANCELLED' && (
                          <button onClick={() => { setOverrideModal(sub); setOverrideStatus(''); setOverrideQty(''); setOverrideProductId(''); setOverrideNotes(''); setFormErr('') }}
                            className="px-3 py-1 text-xs font-medium border border-outline-variant rounded-lg text-on-surface hover:border-primary transition-colors">
                            Override
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          {isLoading ? (
            <div className="md:hidden divide-y divide-outline-variant">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-surface-container rounded w-28 animate-pulse" />
                    <div className="h-3 bg-surface-container rounded w-36 animate-pulse" />
                  </div>
                  <div className="h-5 bg-surface-container rounded-full w-14 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-outline-variant">
                {(data?.items ?? []).map(sub => (
                  <div key={sub.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-on-surface truncate">{sub.customerName}</p>
                      <p className="text-on-surface-variant text-xs">{sub.productName} · ×{sub.quantity}</p>
                      <p className="text-on-surface-variant text-xs">From {formatDate(sub.effectiveStartDate)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={sub.status} />
                      {sub.status !== 'CANCELLED' && (
                        <button onClick={() => { setOverrideModal(sub); setOverrideStatus(''); setOverrideQty(''); setOverrideProductId(''); setOverrideNotes(''); setFormErr('') }}
                          className="px-3 py-1 text-xs font-medium border border-outline-variant rounded-lg text-on-surface">
                          Override
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} total={data?.meta.total ?? 0} size={20} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      <Modal open={!!overrideModal} onClose={() => setOverrideModal(null)} title="Override Subscription">
        {overrideModal && (
          <div className="space-y-4">
            <div className="p-3 bg-orange-50 border-l-4 border-status-warning rounded-r-lg text-xs text-status-warning font-medium">
              Admin overrides bypass the 10 PM cutoff and apply immediately.
            </div>
            <p className="text-sm text-on-surface-variant">{overrideModal.customerName} · {overrideModal.productName}</p>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Status Override</label>
              <select value={overrideStatus} onChange={e => setOverrideStatus(e.target.value as SubscriptionStatus | '')} className={inputCls}>
                <option value="">— No change —</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Quantity Override</label>
              <input value={overrideQty} onChange={e => setOverrideQty(e.target.value)} type="number" min="1" placeholder="Leave blank to keep current" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Product ID Override</label>
              <input value={overrideProductId} onChange={e => setOverrideProductId(e.target.value)} placeholder="Leave blank to keep current" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Admin Notes</label>
              <input value={overrideNotes} onChange={e => setOverrideNotes(e.target.value)} placeholder="Reason for override..." className={inputCls} />
            </div>
            {formErr && <p className="text-error text-sm">{formErr}</p>}
            <button onClick={() => override.mutate()} disabled={override.isPending}
              className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {override.isPending && <Spinner size={16} />} Apply Override
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
