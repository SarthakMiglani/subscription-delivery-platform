import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { apiGetPaged, apiPost, apiGet, getApiError } from '../lib/api'
import { formatDate, formatPaiseCompact, getCutoffMessage } from '../lib/utils'
import type { Subscription, Product } from '../types'

export function SubscriptionsPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Subscription | null>(null)
  const [action, setAction] = useState<'qty' | 'product' | 'pause' | 'resume' | 'cancel' | null>(null)
  const [newQty, setNewQty] = useState(1)
  const [newProductId, setNewProductId] = useState('')
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => apiGetPaged<Subscription>('/subscriptions', { size: 50 }),
  })

  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => apiGetPaged<Product>('/products'),
    enabled: action === 'product',
  })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/subscriptions/${id}/pause`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); closeModal(); showToast('Subscription paused') },
    onError: (e) => setErr(getApiError(e)),
  })
  const resumeMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/subscriptions/${id}/resume`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); closeModal(); showToast('Subscription resumed') },
    onError: (e) => setErr(getApiError(e)),
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/subscriptions/${id}/cancel`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); closeModal(); showToast('Subscription cancelled') },
    onError: (e) => setErr(getApiError(e)),
  })
  const changeQtyMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => apiPost(`/subscriptions/${id}/change-quantity`, { newQuantity: qty }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); closeModal(); showToast('Quantity change requested') },
    onError: (e) => setErr(getApiError(e)),
  })
  const changeProductMutation = useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) => apiPost(`/subscriptions/${id}/change-product`, { newProductId: productId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); closeModal(); showToast('Product change requested') },
    onError: (e) => setErr(getApiError(e)),
  })

  function closeModal() { setSelected(null); setAction(null); setErr('') }
  function openAction(sub: Subscription, act: typeof action) {
    setSelected(sub); setAction(act); setErr('')
    if (act === 'qty') setNewQty(sub.quantity)
  }

  const isModifiable = (s: Subscription) => s.status === 'ACTIVE' || s.status === 'PAUSED'
  const subs = data?.items ?? []

  return (
    <>
      <TopBar title="Subscriptions" />
      <PageWrapper>
        <div className="py-4">
          {/* 10 PM cutoff info banner */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">schedule</span>
            <p className="text-amber-800 text-xs font-medium leading-snug">⏰ {getCutoffMessage()}</p>
          </div>

          {toast && <div className="mb-4 p-3 bg-green-50 border-l-4 border-status-active rounded-r-lg text-status-active text-sm font-medium">{toast}</div>}

          {isLoading && <div className="flex justify-center py-16"><Spinner size={32} /></div>}

          {!isLoading && subs.length === 0 && (
            <EmptyState icon="repeat" title="No subscriptions yet" description="Subscribe to a product to receive daily deliveries." />
          )}

          <div className="space-y-3">
            {subs.map(sub => (
              <div key={sub.id} className="bg-white rounded-xl border border-outline-variant p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-jakarta font-semibold text-on-surface">{sub.productName}</h3>
                    <p className="text-on-surface-variant text-sm mt-0.5">Qty: {sub.quantity} · Started {formatDate(sub.effectiveStartDate)}</p>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>

                {sub.pendingChangeRequests && sub.pendingChangeRequests.length > 0 && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                    {sub.pendingChangeRequests.map((cr, i) => (
                      <p key={i} className="text-xs text-status-future">
                        ↻ {cr.type === 'QUANTITY' ? `Qty → ${cr.newQuantity}` : `Product → ${cr.newProductName}`} from {formatDate(cr.effectiveDate)}
                      </p>
                    ))}
                  </div>
                )}

                {sub.status !== 'CANCELLED' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant">
                    {isModifiable(sub) && (
                      <>
                        <button onClick={() => openAction(sub, 'qty')} className="px-3 py-1.5 text-xs font-medium border border-outline-variant rounded-lg text-on-surface">Change Qty</button>
                        <button onClick={() => openAction(sub, 'product')} className="px-3 py-1.5 text-xs font-medium border border-outline-variant rounded-lg text-on-surface">Change Product</button>
                      </>
                    )}
                    {sub.status === 'ACTIVE' && (
                      <button onClick={() => openAction(sub, 'pause')} className="px-3 py-1.5 text-xs font-medium border border-status-warning rounded-lg text-status-warning">Pause</button>
                    )}
                    {sub.status === 'PAUSED' && (
                      <button onClick={() => openAction(sub, 'resume')} className="px-3 py-1.5 text-xs font-medium border border-status-active rounded-lg text-status-active">Resume</button>
                    )}
                    {(sub.status === 'ACTIVE' || sub.status === 'PAUSED') && (
                      <button onClick={() => openAction(sub, 'cancel')} className="px-3 py-1.5 text-xs font-medium border border-status-error rounded-lg text-status-error">Cancel</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>

      {/* Action modal */}
      <Modal open={!!action && !!selected} onClose={closeModal} title={
        action === 'qty' ? 'Change Quantity' :
        action === 'product' ? 'Change Product' :
        action === 'pause' ? 'Pause Subscription' :
        action === 'resume' ? 'Resume Subscription' : 'Cancel Subscription'
      }>
        {selected && (
          <div>
            <p className="text-on-surface-variant text-sm mb-4">{selected.productName}</p>

            {(action === 'qty' || action === 'product' || action === 'pause' || action === 'resume') && (
              <div className="mb-4 p-3 bg-surface-container-low rounded-lg">
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">⏰ {getCutoffMessage()}</p>
              </div>
            )}

            {action === 'qty' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">New Daily Quantity</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setNewQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center">−</button>
                  <span className="font-mono font-bold text-2xl w-6 text-center">{newQty}</span>
                  <button onClick={() => setNewQty(q => q + 1)} className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center">+</button>
                </div>
              </div>
            )}

            {action === 'product' && (
              <div className="mb-4 space-y-2">
                {products.isLoading ? <Spinner /> : (products.data?.items ?? []).filter(p => p.id !== selected.productId).map(p => (
                  <label key={p.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer ${newProductId === p.id ? 'border-primary bg-green-50' : 'border-outline-variant'}`}>
                    <input type="radio" name="product" value={p.id} checked={newProductId === p.id} onChange={() => setNewProductId(p.id)} className="accent-primary" />
                    <div>
                      <p className="font-medium text-on-surface text-sm">{p.name}</p>
                      <p className="text-on-surface-variant text-xs">{formatPaiseCompact(p.pricePerUnitPaise)}/day</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {action === 'cancel' && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-status-error rounded-r-lg">
                <p className="text-status-error text-sm font-medium">This is permanent and cannot be undone.</p>
              </div>
            )}

            {err && <p className="text-error text-sm mb-3">{err}</p>}

            <button
              disabled={
                pauseMutation.isPending || resumeMutation.isPending ||
                cancelMutation.isPending || changeQtyMutation.isPending || changeProductMutation.isPending
              }
              onClick={() => {
                if (action === 'pause') pauseMutation.mutate(selected.id)
                else if (action === 'resume') resumeMutation.mutate(selected.id)
                else if (action === 'cancel') cancelMutation.mutate(selected.id)
                else if (action === 'qty') changeQtyMutation.mutate({ id: selected.id, qty: newQty })
                else if (action === 'product' && newProductId) changeProductMutation.mutate({ id: selected.id, productId: newProductId })
              }}
              className={`w-full font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 ${
                action === 'cancel' ? 'bg-status-error text-white' : 'bg-primary text-on-primary'
              }`}
            >
              {(pauseMutation.isPending || resumeMutation.isPending || cancelMutation.isPending || changeQtyMutation.isPending || changeProductMutation.isPending) && <Spinner size={16} />}
              Confirm
            </button>
          </div>
        )}
      </Modal>
    </>
  )
}
