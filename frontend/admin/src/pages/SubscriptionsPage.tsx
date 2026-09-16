import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Modal } from '../components/ui/Modal'
import { Pagination } from '../components/ui/Pagination'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextField, SelectField } from '../components/ui/TextField'
import { useToast } from '../components/ui/Toast'
import { apiGetPaged, apiPatch, getApiError } from '../lib/api'
import { formatDate } from '../lib/utils'
import type { AdminSubscriptionListItem, SubscriptionStatus } from '../types'

export function SubscriptionsPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('')
  const [overrideModal, setOverrideModal] = useState<AdminSubscriptionListItem | null>(null)
  const [overrideStatus, setOverrideStatus] = useState<SubscriptionStatus | ''>('')
  const [overrideQty, setOverrideQty] = useState('')
  const [overrideProductId, setOverrideProductId] = useState('')
  const [overrideNotes, setOverrideNotes] = useState('')
  const [formErr, setFormErr] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter, page],
    queryFn: () =>
      apiGetPaged<AdminSubscriptionListItem>('/admin/subscriptions', {
        ...(statusFilter ? { status: statusFilter } : {}),
        page,
        size: 20,
      }),
  })

  const override = useMutation({
    mutationFn: () =>
      apiPatch(`/admin/subscriptions/${overrideModal!.id}`, {
        ...(overrideStatus ? { status: overrideStatus } : {}),
        ...(overrideQty ? { quantity: parseInt(overrideQty) } : {}),
        ...(overrideProductId ? { productId: overrideProductId } : {}),
        ...(overrideNotes ? { notes: overrideNotes } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      setOverrideModal(null)
      show('Subscription updated')
    },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const statuses: (SubscriptionStatus | '')[] = ['', 'ACTIVE', 'PAUSED', 'PENDING_START', 'CANCELLED']

  function openOverride(sub: AdminSubscriptionListItem) {
    setOverrideModal(sub)
    setOverrideStatus('')
    setOverrideQty('')
    setOverrideProductId('')
    setOverrideNotes('')
    setFormErr('')
  }

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle={`${data?.meta.total ?? 0} total`} />
      <div className="p-4 sm:p-6">
        <div className="flex gap-2 flex-wrap mb-5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0) }}
              className={`focus-ring px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === s ? 'bg-primary text-on-primary shadow-card' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <Card padded={false} className="overflow-hidden">
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
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><div className="h-4 skeleton rounded w-28" /></td>
                      <td className="px-4 py-3"><div className="h-3 skeleton rounded w-24" /></td>
                      <td className="px-4 py-3"><div className="h-4 skeleton rounded w-6 mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-5 skeleton rounded-full w-16 mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-3 skeleton rounded w-20" /></td>
                      <td className="px-4 py-3"><div className="h-6 skeleton rounded-lg w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  (data?.items ?? []).map((sub) => (
                    <tr key={sub.id} className="hover:bg-surface-container-low/50">
                      <td className="px-4 py-3 font-medium text-on-surface">{sub.customerName}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{sub.productName}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold">{sub.quantity}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={sub.status} /></td>
                      <td className="px-4 py-3 text-on-surface-variant">{formatDate(sub.effectiveStartDate)}</td>
                      <td className="px-4 py-3 text-right">
                        {sub.status !== 'CANCELLED' && (
                          <Button size="sm" variant="outline" onClick={() => openOverride(sub)}>Override</Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isLoading ? (
            <div className="md:hidden divide-y divide-outline-variant">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 skeleton rounded w-28" />
                    <div className="h-3 skeleton rounded w-36" />
                  </div>
                  <div className="h-5 skeleton rounded-full w-14" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-outline-variant">
                {(data?.items ?? []).map((sub) => (
                  <div key={sub.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-on-surface truncate">{sub.customerName}</p>
                      <p className="text-on-surface-variant text-xs">{sub.productName} · ×{sub.quantity}</p>
                      <p className="text-on-surface-variant text-xs">From {formatDate(sub.effectiveStartDate)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={sub.status} />
                      {sub.status !== 'CANCELLED' && (
                        <Button size="sm" variant="outline" onClick={() => openOverride(sub)}>Override</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} total={data?.meta.total ?? 0} size={20} onChange={setPage} />
            </>
          )}
        </Card>
      </div>

      <Modal open={!!overrideModal} onClose={() => setOverrideModal(null)} title="Override Subscription">
        {overrideModal && (
          <div className="space-y-4">
            <div className="p-3 bg-secondary-container rounded-xl flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
              <p className="text-xs text-status-warning font-medium">Admin overrides bypass the 10 PM cutoff and apply immediately.</p>
            </div>
            <p className="text-sm text-on-surface-variant">{overrideModal.customerName} · {overrideModal.productName}</p>
            <SelectField label="Status override" value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value as SubscriptionStatus | '')}>
              <option value="">— No change —</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PAUSED">PAUSED</option>
              <option value="CANCELLED">CANCELLED</option>
            </SelectField>
            <TextField label="Quantity override" value={overrideQty} onChange={(e) => setOverrideQty(e.target.value)} type="number" min="1" placeholder="Leave blank to keep current" />
            <TextField label="Product ID override" value={overrideProductId} onChange={(e) => setOverrideProductId(e.target.value)} placeholder="Leave blank to keep current" />
            <TextField label="Admin notes" value={overrideNotes} onChange={(e) => setOverrideNotes(e.target.value)} placeholder="Reason for override..." />
            {formErr && <p className="text-error text-sm">{formErr}</p>}
            <Button fullWidth loading={override.isPending} onClick={() => override.mutate()}>
              Apply Override
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
