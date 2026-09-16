import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Minus, Plus, Repeat, RotateCcw, XCircle } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { apiGetPaged, apiPost, getApiError } from '../lib/api'
import { formatDate, formatPaiseCompact, getCutoffMessage } from '../lib/utils'
import type { Subscription, Product } from '../types'

type Action = 'qty' | 'product' | 'pause' | 'resume' | 'cancel' | null

export function SubscriptionsPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [selected, setSelected] = useState<Subscription | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [newQty, setNewQty] = useState(1)
  const [newProductId, setNewProductId] = useState('')
  const [err, setErr] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => apiGetPaged<Subscription>('/subscriptions', { size: 50 }),
  })

  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => apiGetPaged<Product>('/products'),
    enabled: action === 'product',
  })

  function closeModal() {
    setSelected(null)
    setAction(null)
    setErr('')
  }
  function openAction(sub: Subscription, act: Action) {
    setSelected(sub)
    setAction(act)
    setErr('')
    setNewProductId('')
    if (act === 'qty') setNewQty(sub.quantity)
  }

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/subscriptions/${id}/pause`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); closeModal(); show('Subscription paused') },
    onError: (e) => setErr(getApiError(e)),
  })
  const resumeMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/subscriptions/${id}/resume`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); closeModal(); show('Subscription resumed') },
    onError: (e) => setErr(getApiError(e)),
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/subscriptions/${id}/cancel`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); closeModal(); show('Subscription cancelled') },
    onError: (e) => setErr(getApiError(e)),
  })
  const changeQtyMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => apiPost(`/subscriptions/${id}/change-quantity`, { newQuantity: qty }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); closeModal(); show('Quantity change requested') },
    onError: (e) => setErr(getApiError(e)),
  })
  const changeProductMutation = useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) => apiPost(`/subscriptions/${id}/change-product`, { newProductId: productId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); closeModal(); show('Product change requested') },
    onError: (e) => setErr(getApiError(e)),
  })

  const isPending =
    pauseMutation.isPending || resumeMutation.isPending || cancelMutation.isPending ||
    changeQtyMutation.isPending || changeProductMutation.isPending

  const isModifiable = (s: Subscription) => s.status === 'ACTIVE' || s.status === 'PAUSED'
  const subs = data?.items ?? []

  const modalTitle =
    action === 'qty' ? 'Change quantity' :
    action === 'product' ? 'Change product' :
    action === 'pause' ? 'Pause subscription' :
    action === 'resume' ? 'Resume subscription' : 'Cancel subscription'

  return (
    <>
      <TopBar title="Subscriptions" />
      <PageWrapper>
        <div className="pt-4 pb-2">
          <div className="mb-4 p-3 bg-secondary-container rounded-xl flex items-center gap-2.5">
            <Clock size={17} className="text-status-warning shrink-0" strokeWidth={1.75} />
            <p className="text-on-secondary-container text-xs font-semibold leading-snug">{getCutoffMessage()}</p>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[0, 1].map((i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
            </div>
          )}

          {!isLoading && subs.length === 0 && (
            <EmptyState icon={Repeat} title="No subscriptions yet" description="Subscribe to a product to receive daily deliveries." />
          )}

          <div className="space-y-3">
            {subs.map((sub, i) => (
              <Card key={sub.id} style={{ '--i': i } as React.CSSProperties} className="stagger-item">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-jakarta font-semibold text-on-surface">{sub.productName}</h3>
                    <p className="text-on-surface-variant text-sm mt-0.5">Qty {sub.quantity} · Started {formatDate(sub.effectiveStartDate)}</p>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>

                {sub.pendingChangeRequests && sub.pendingChangeRequests.length > 0 && (
                  <div className="mb-3 p-2.5 bg-[#dce9f7] rounded-lg space-y-1">
                    {sub.pendingChangeRequests.map((cr, idx) => (
                      <p key={idx} className="text-xs text-status-future font-medium flex items-center gap-1">
                        <RotateCcw size={12} />
                        {cr.type === 'QUANTITY' ? `Qty → ${cr.newQuantity}` : `Product → ${cr.newProductName}`} from {formatDate(cr.effectiveDate)}
                      </p>
                    ))}
                  </div>
                )}

                {sub.status !== 'CANCELLED' && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-outline-variant/70">
                    {isModifiable(sub) && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openAction(sub, 'qty')}>Change qty</Button>
                        <Button size="sm" variant="outline" onClick={() => openAction(sub, 'product')}>Change product</Button>
                      </>
                    )}
                    {sub.status === 'ACTIVE' && (
                      <Button size="sm" variant="outline" className="!border-status-warning !text-status-warning" onClick={() => openAction(sub, 'pause')}>Pause</Button>
                    )}
                    {sub.status === 'PAUSED' && (
                      <Button size="sm" variant="outline" className="!border-status-active !text-status-active" onClick={() => openAction(sub, 'resume')}>Resume</Button>
                    )}
                    {(sub.status === 'ACTIVE' || sub.status === 'PAUSED') && (
                      <Button size="sm" variant="danger" onClick={() => openAction(sub, 'cancel')}>Cancel</Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </PageWrapper>

      <Modal open={!!action && !!selected} onClose={closeModal} title={modalTitle}>
        {selected && (
          <div>
            <p className="text-on-surface-variant text-sm mb-4">{selected.productName}</p>

            {(action === 'qty' || action === 'product' || action === 'pause' || action === 'resume') && (
              <div className="mb-4 p-3 bg-surface-container-low rounded-xl flex items-center gap-2">
                <Clock size={15} className="text-on-surface-variant shrink-0" />
                <p className="text-xs text-on-surface-variant font-semibold">{getCutoffMessage()}</p>
              </div>
            )}

            {action === 'qty' && (
              <div className="mb-5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">New daily quantity</label>
                <div className="flex items-center gap-5">
                  <button onClick={() => setNewQty((q) => Math.max(1, q - 1))} aria-label="Decrease" className="focus-ring w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high active:scale-95 transition-all">
                    <Minus size={16} />
                  </button>
                  <span className="font-mono font-bold text-2xl w-6 text-center">{newQty}</span>
                  <button onClick={() => setNewQty((q) => q + 1)} aria-label="Increase" className="focus-ring w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high active:scale-95 transition-all">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            {action === 'product' && (
              <div className="mb-5 space-y-2">
                {products.isLoading ? (
                  <div className="flex justify-center py-4"><Spinner /></div>
                ) : (
                  (products.data?.items ?? [])
                    .filter((p) => p.id !== selected.productId)
                    .map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                          newProductId === p.id ? 'border-primary bg-primary-container/50' : 'border-outline-variant hover:bg-surface-container-low'
                        }`}
                      >
                        <input type="radio" name="product" value={p.id} checked={newProductId === p.id} onChange={() => setNewProductId(p.id)} className="accent-primary" />
                        <div>
                          <p className="font-medium text-on-surface text-sm">{p.name}</p>
                          <p className="text-on-surface-variant text-xs">{formatPaiseCompact(p.pricePerUnitPaise)}/day</p>
                        </div>
                      </label>
                    ))
                )}
              </div>
            )}

            {action === 'cancel' && (
              <div className="mb-5 p-3.5 bg-error-container rounded-xl flex items-start gap-2.5">
                <XCircle size={17} className="text-status-error shrink-0 mt-0.5" />
                <p className="text-status-error text-sm font-medium">This is permanent and cannot be undone.</p>
              </div>
            )}

            {err && <p className="text-error text-sm mb-3">{err}</p>}

            <Button
              fullWidth
              size="lg"
              variant={action === 'cancel' ? 'danger' : 'primary'}
              className={action === 'cancel' ? '!bg-status-error !text-white !border-transparent' : ''}
              loading={isPending}
              disabled={action === 'product' && !newProductId}
              onClick={() => {
                if (!selected) return
                if (action === 'pause') pauseMutation.mutate(selected.id)
                else if (action === 'resume') resumeMutation.mutate(selected.id)
                else if (action === 'cancel') cancelMutation.mutate(selected.id)
                else if (action === 'qty') changeQtyMutation.mutate({ id: selected.id, qty: newQty })
                else if (action === 'product' && newProductId) changeProductMutation.mutate({ id: selected.id, productId: newProductId })
              }}
            >
              Confirm
            </Button>
          </div>
        )}
      </Modal>
    </>
  )
}
