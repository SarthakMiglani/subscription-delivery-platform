import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Truck, CookingPot, ShoppingCart, FileSpreadsheet, FileText, RefreshCw,
  AlertTriangle, ArrowRight, Wheat, MoreVertical, Check, StickyNote,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { apiGet, apiPost, apiPatch, getApiError } from '../lib/api'
import { todayIST } from '../lib/utils'
import { SKIP_REASONS } from '../lib/constants'
import type { DeliverySheet, DeliverySheetOrder } from '../types'

const VIEWS = [
  { key: 'delivery' as const, label: 'Delivery List', icon: Truck },
  { key: 'kitchen' as const, label: 'Kitchen Prep', icon: CookingPot },
  { key: 'shopping' as const, label: 'Shopping List', icon: ShoppingCart },
]

export function DeliveryPage() {
  const qc = useQueryClient()
  const [date, setDate] = useState(todayIST())
  const [view, setView] = useState<'delivery' | 'kitchen' | 'shopping'>('delivery')
  const [skipModal, setSkipModal] = useState<DeliverySheetOrder | null>(null)
  const [skipReason, setSkipReason] = useState('CUSTOMER_UNAVAILABLE')
  const [correctModal, setCorrectModal] = useState<DeliverySheetOrder | null>(null)
  const [correctStatus, setCorrectStatus] = useState<'DELIVERED' | 'SKIPPED' | 'CANCELLED'>('DELIVERED')
  const [correctSkipReason, setCorrectSkipReason] = useState('CUSTOMER_UNAVAILABLE')
  const [correctIsSystemError, setCorrectIsSystemError] = useState(false)
  const [correctCancellationComment, setCorrectCancellationComment] = useState('')
  const [correctErr, setCorrectErr] = useState('')
  const [actionErr, setActionErr] = useState('')
  const [correctQuantity, setCorrectQuantity] = useState('')
  const [quantityErr, setQuantityErr] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['delivery-sheet', date],
    queryFn: () => apiGet<DeliverySheet>(`/admin/delivery-sheets/${date}`),
    retry: false,
  })

  const deliver = useMutation({
    mutationFn: (orderId: string) => apiPost(`/admin/orders/${orderId}/deliver`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-sheet', date] }) },
    onError: (e) => setActionErr(getApiError(e)),
  })

  const skip = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      apiPost(`/admin/orders/${orderId}/skip`, { skipReason: reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-sheet', date] }); setSkipModal(null) },
    onError: (e) => setActionErr(getApiError(e)),
  })

  const correct = useMutation({
    mutationFn: ({ orderId, status, skipReason, isSystemError, cancellationComment }:
      { orderId: string; status: string; skipReason?: string; isSystemError?: boolean; cancellationComment?: string }) =>
      apiPatch(`/admin/orders/${orderId}`, { status, skipReason, isSystemError, cancellationComment }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-sheet', date] }); setCorrectModal(null) },
    onError: (e) => setCorrectErr(getApiError(e)),
  })

  // BR-HIS-05 — quantity correction on a still-PENDING (LOCKED) order.
  const correctQty = useMutation({
    mutationFn: ({ orderId, quantity }: { orderId: string; quantity: number }) =>
      apiPatch(`/admin/orders/${orderId}`, { status: 'LOCKED', quantity }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-sheet', date] }); setCorrectModal(null) },
    onError: (e) => setQuantityErr(getApiError(e)),
  })

  const regenerate = useMutation({
    mutationFn: () => apiPost(`/admin/delivery-sheets/${date}/regenerate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-sheet', date] }) },
    onError: (e) => setActionErr(getApiError(e)),
  })

  const orders = data?.orders ?? []
  const juice = data?.juiceSummary ?? []
  const shoppingList = data?.ingredientSummary ?? []
  const productsWithoutRecipe = data?.productsWithoutRecipe ?? []

  return (
    <div>
      <PageHeader
        title="Delivery Operations"
        subtitle={`Delivery sheet for ${date}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="focus-ring h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm min-w-0 focus:border-primary transition-colors"
            />
            <a
              href={`/api/v1/admin/delivery-sheets/${date}/download/csv`}
              target="_blank"
              rel="noreferrer"
              className="focus-ring h-10 px-3 inline-flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-medium rounded-xl whitespace-nowrap hover:border-primary/40 transition-colors"
            >
              <FileSpreadsheet size={15} /> CSV
            </a>
            <a
              href={`/api/v1/admin/delivery-sheets/${date}/download/pdf`}
              target="_blank"
              rel="noreferrer"
              className="focus-ring h-10 px-3 inline-flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-medium rounded-xl whitespace-nowrap hover:border-primary/40 transition-colors"
            >
              <FileText size={15} /> PDF
            </a>
            <Button size="sm" icon={<RefreshCw size={14} className={regenerate.isPending ? 'animate-spin' : ''} />} loading={false} disabled={regenerate.isPending} onClick={() => regenerate.mutate()}>
              Regenerate
            </Button>
          </div>
        }
      />

      {/* View tabs */}
      <div className="flex gap-1.5 px-4 sm:px-6 pt-4 flex-wrap">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`focus-ring flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors ${
              view === v.key ? 'bg-primary text-on-primary shadow-card' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <v.icon size={15} />
            {v.label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6">
        {isLoading && (
          <Card padded={false} className="overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-outline-variant/70 last:border-0">
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 skeleton rounded w-36" />
                  <div className="h-3 skeleton rounded w-24" />
                </div>
                <div className="h-3 skeleton rounded w-40 hidden md:block" />
                <div className="h-3 skeleton rounded w-20 hidden md:block" />
                <div className="h-3 skeleton rounded w-6" />
                <div className="h-8 skeleton rounded-lg w-20 hidden md:block" />
              </div>
            ))}
          </Card>
        )}

        {error && (
          <div className="p-6 text-center">
            <p className="text-on-surface-variant">No delivery sheet for {date}. Run the scheduler to generate one.</p>
            <button onClick={() => refetch()} className="focus-ring mt-2 text-primary text-sm font-semibold hover:underline rounded">
              Retry
            </button>
          </div>
        )}

        {actionErr && (
          <div className="mb-4 p-3 bg-error-container rounded-xl border-l-4 border-error">
            <p className="text-on-error-container text-sm">{actionErr}</p>
          </div>
        )}

        {/* Kitchen prep view */}
        {!isLoading && !error && view === 'kitchen' && (
          <div>
            <h3 className="font-jakarta font-semibold text-on-surface mb-4">Today's Preparation Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {juice.map((j, i) => (
                <Card key={j.productName} style={{ '--i': i } as React.CSSProperties} className="stagger-item text-center">
                  <div className="w-11 h-11 rounded-xl bg-primary-container mx-auto flex items-center justify-center mb-2.5">
                    <CookingPot size={20} className="text-primary" strokeWidth={1.75} />
                  </div>
                  <p className="font-jakarta font-bold text-on-surface text-3xl">{j.totalQuantity}</p>
                  <p className="text-on-surface-variant text-sm mt-1">{j.productName}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Shopping list view */}
        {!isLoading && !error && view === 'shopping' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-jakarta font-semibold text-on-surface">Ingredient Shopping List</h3>
              <span className="text-on-surface-variant text-sm">{shoppingList.length} ingredients needed</span>
            </div>

            {productsWithoutRecipe.length > 0 && (
              <div className="mb-4 p-4 bg-secondary-container rounded-2xl flex gap-3">
                <AlertTriangle size={20} className="text-status-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-on-secondary-container font-semibold text-sm">Incomplete shopping list</p>
                  <p className="text-on-secondary-container/80 text-sm mt-0.5">
                    The following products have orders but no ingredient recipe configured — their ingredients are <strong>not</strong> included in this list:
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {productsWithoutRecipe.map((name) => (
                      <li key={name} className="text-on-secondary-container font-medium text-sm flex items-center gap-1.5">
                        <ArrowRight size={13} />{name}
                      </li>
                    ))}
                  </ul>
                  <p className="text-status-warning text-xs mt-2">Go to Products → Recipe to configure them, then regenerate the sheet.</p>
                </div>
              </div>
            )}

            {shoppingList.length === 0 ? (
              <Card className="text-center py-12">
                <ShoppingCart size={40} className="text-on-surface-variant mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-on-surface font-medium mb-1">No ingredient data</p>
                <p className="text-on-surface-variant text-sm">
                  This snapshot was generated before ingredient recipes were configured, or no products have recipes yet. Regenerate the sheet after setting up recipes.
                </p>
                <Button className="mt-4" icon={<RefreshCw size={14} className={regenerate.isPending ? 'animate-spin' : ''} />} disabled={regenerate.isPending} onClick={() => regenerate.mutate()}>
                  Regenerate Sheet
                </Button>
              </Card>
            ) : (
              <Card padded={false} className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full w-full text-sm">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ingredient</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Needed</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {shoppingList.map((item) => (
                        <tr key={`${item.ingredientId}-${item.unit}`} className="hover:bg-surface-container-low/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Wheat size={16} className="text-primary" />
                              <span className="font-medium text-on-surface">{item.ingredientName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-on-surface text-lg">
                            {Number(item.totalQuantity) % 1 === 0 ? Number(item.totalQuantity).toFixed(0) : Number(item.totalQuantity).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Delivery list */}
        {!isLoading && !error && view === 'delivery' && (
          <div>
            <p className="text-on-surface-variant text-sm mb-4">{orders.length} deliveries</p>
            <Card padded={false} className="overflow-hidden">
              {orders.length === 0 ? (
                <p className="text-center text-on-surface-variant py-12">No deliveries for this date.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="hidden md:table min-w-[760px] w-full text-sm">
                      <thead className="bg-surface-container-low">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Customer</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Address</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Product</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Qty</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {orders.map((order) => (
                          <tr key={order.orderId} className={`hover:bg-surface-container-low/50 ${order.deliveryStatus && order.deliveryStatus !== 'PENDING' ? 'opacity-60' : ''}`}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-on-surface">{order.customerName}</p>
                              <p className="text-on-surface-variant text-xs">{order.phone}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-on-surface text-xs max-w-xs truncate">{order.address}</p>
                              {order.deliveryNotes && (
                                <p className="text-on-surface-variant text-xs italic flex items-center gap-1">
                                  <StickyNote size={11} /> {order.deliveryNotes}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-on-surface">{order.productName}</td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-on-surface">{order.quantity}</td>
                            <td className="px-4 py-3">
                              <OrderActions
                                order={order}
                                isPending={deliver.isPending}
                                onDeliver={() => deliver.mutate(order.orderId)}
                                onSkip={() => { setSkipModal(order); setActionErr('') }}
                                onCorrect={() => { setCorrectModal(order); setCorrectStatus('DELIVERED'); setCorrectSkipReason('CUSTOMER_UNAVAILABLE'); setCorrectIsSystemError(false); setCorrectCancellationComment(''); setCorrectErr(''); setCorrectQuantity(String(order.quantity)); setQuantityErr('') }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden divide-y divide-outline-variant">
                    {orders.map((order) => (
                      <div key={order.orderId} className={`p-4 space-y-2 ${order.deliveryStatus && order.deliveryStatus !== 'PENDING' ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-on-surface">{order.customerName}</p>
                            <p className="text-on-surface-variant text-xs">{order.phone}</p>
                            <p className="text-on-surface-variant text-xs mt-0.5 truncate">{order.address}</p>
                            {order.deliveryNotes && (
                              <p className="text-on-surface-variant text-xs italic flex items-center gap-1">
                                <StickyNote size={11} /> {order.deliveryNotes}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-on-surface text-sm font-medium">{order.productName}</p>
                            <p className="font-mono font-bold text-on-surface">×{order.quantity}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <OrderActions
                            order={order}
                            isPending={deliver.isPending}
                            onDeliver={() => deliver.mutate(order.orderId)}
                            onSkip={() => { setSkipModal(order); setActionErr('') }}
                            onCorrect={() => { setCorrectModal(order); setCorrectStatus('DELIVERED'); setCorrectSkipReason('CUSTOMER_UNAVAILABLE'); setCorrectIsSystemError(false); setCorrectCancellationComment(''); setCorrectErr(''); setCorrectQuantity(String(order.quantity)); setQuantityErr('') }}
                            mobile
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </div>

      <Modal open={!!correctModal} onClose={() => setCorrectModal(null)} title="Correct Order Status" size="sm">
        {correctModal && (() => {
          const currentStatus = correctModal.deliveryStatus ?? 'PENDING'
          const allowedStatuses = currentStatus === 'DELIVERED'
            ? (['DELIVERED', 'SKIPPED'] as const)
            : (['DELIVERED', 'SKIPPED', 'CANCELLED'] as const)
          return (
            <div>
              <p className="text-on-surface font-medium mb-1">{correctModal.customerName}</p>
              <p className="text-on-surface-variant text-sm mb-4">{correctModal.productName} × {correctModal.quantity}</p>

              {currentStatus === 'PENDING' && (
                <div className="mb-4 p-3 bg-surface-container-low rounded-xl">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Correct quantity</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={correctQuantity}
                      onChange={(e) => { setCorrectQuantity(e.target.value); setQuantityErr('') }}
                      className="focus-ring w-24 border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-lowest focus:border-primary transition-colors"
                    />
                    <Button
                      size="sm"
                      loading={correctQty.isPending}
                      disabled={String(correctModal.quantity) === correctQuantity}
                      onClick={() => {
                        const qty = parseInt(correctQuantity, 10)
                        if (!qty || qty < 1) { setQuantityErr('Quantity must be at least 1'); return }
                        correctQty.mutate({ orderId: correctModal.orderId, quantity: qty })
                      }}
                    >
                      Update Quantity
                    </Button>
                  </div>
                  <p className="text-on-surface-variant text-xs mt-1.5">Recalculates the order total using the existing unit price.</p>
                  {quantityErr && <p className="text-error text-sm mt-2">{quantityErr}</p>}
                </div>
              )}

              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Set status to</p>
              <div className="space-y-2 mb-4">
                {allowedStatuses.map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                      correctStatus === s ? 'border-primary bg-primary-container/50' : 'border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <input type="radio" name="correctStatus" value={s} checked={correctStatus === s} onChange={() => { setCorrectStatus(s); setCorrectErr('') }} className="accent-primary" />
                    <span className="text-sm text-on-surface font-medium">{s}</span>
                  </label>
                ))}
              </div>

              {correctStatus === 'SKIPPED' && (
                <div className="mb-4 p-3 bg-surface-container-low rounded-xl space-y-3">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Skip reason</p>
                    <div className="space-y-1.5">
                      {SKIP_REASONS.map((r) => (
                        <label
                          key={r.value}
                          className={`flex items-center gap-2.5 p-2.5 border rounded-lg cursor-pointer text-sm transition-colors ${
                            correctSkipReason === r.value ? 'border-primary bg-primary-container/50' : 'border-outline-variant hover:bg-surface-container'
                          }`}
                        >
                          <input type="radio" name="correctSkipReason" value={r.value} checked={correctSkipReason === r.value} onChange={() => setCorrectSkipReason(r.value)} className="accent-primary" />
                          <span className="text-on-surface">{r.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-start gap-2.5 p-2.5 border border-outline-variant rounded-lg cursor-pointer">
                    <input type="checkbox" checked={correctIsSystemError} onChange={(e) => setCorrectIsSystemError(e.target.checked)} className="accent-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-on-surface font-medium">Issue automatic refund</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Check if this was a system/delivery error — wallet will be automatically credited back.</p>
                    </div>
                  </label>
                </div>
              )}

              {correctStatus === 'CANCELLED' && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Cancellation comment (optional)</p>
                  <textarea
                    value={correctCancellationComment}
                    onChange={(e) => setCorrectCancellationComment(e.target.value)}
                    placeholder="Reason for cancellation..."
                    rows={2}
                    className="focus-ring w-full border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface bg-surface-container-low resize-none focus:border-primary transition-colors"
                  />
                </div>
              )}

              {correctErr && <p className="text-error text-sm mb-3">{correctErr}</p>}
              <Button
                fullWidth
                size="lg"
                loading={correct.isPending}
                onClick={() =>
                  correct.mutate({
                    orderId: correctModal.orderId,
                    status: correctStatus,
                    skipReason: correctStatus === 'SKIPPED' ? correctSkipReason : undefined,
                    isSystemError: correctStatus === 'SKIPPED' ? correctIsSystemError : undefined,
                    cancellationComment: correctStatus === 'CANCELLED' && correctCancellationComment ? correctCancellationComment : undefined,
                  })
                }
              >
                Apply Correction
              </Button>
            </div>
          )
        })()}
      </Modal>

      <Modal open={!!skipModal} onClose={() => setSkipModal(null)} title="Skip Delivery" size="sm">
        {skipModal && (
          <div>
            <p className="text-on-surface font-medium mb-1">{skipModal.customerName}</p>
            <p className="text-on-surface-variant text-sm mb-4">{skipModal.productName} × {skipModal.quantity}</p>
            <div className="space-y-2 mb-4">
              {SKIP_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    skipReason === r.value ? 'border-primary bg-primary-container/50' : 'border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <input type="radio" name="skip" value={r.value} checked={skipReason === r.value} onChange={() => setSkipReason(r.value)} className="accent-primary" />
                  <span className="text-sm text-on-surface">{r.label}</span>
                </label>
              ))}
            </div>
            {actionErr && <p className="text-error text-sm mb-3">{actionErr}</p>}
            <Button fullWidth size="lg" loading={skip.isPending} className="!bg-status-warning" onClick={() => skip.mutate({ orderId: skipModal.orderId, reason: skipReason })}>
              Confirm Skip
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── Order action buttons ─────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  DELIVERED: { label: 'Delivered', cls: 'bg-primary-container text-status-active' },
  SKIPPED: { label: 'Skipped', cls: 'bg-secondary-container text-status-warning' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-error-container text-status-error' },
}

function OrderActions({
  order,
  isPending,
  onDeliver,
  onSkip,
  onCorrect,
  mobile = false,
}: {
  order: DeliverySheetOrder
  isPending: boolean
  onDeliver: () => void
  onSkip: () => void
  onCorrect: () => void
  mobile?: boolean
}) {
  const status = order.deliveryStatus ?? 'PENDING'
  const badge = STATUS_BADGE[status]

  if (badge) {
    return (
      <div className={`flex items-center ${mobile ? 'gap-2 w-full' : 'justify-end gap-2'}`}>
        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${badge.cls} ${mobile ? 'flex-1 text-center' : ''}`}>{badge.label}</span>
        <button onClick={onCorrect} title="Correct order status" className="focus-ring p-1.5 text-on-surface-variant hover:text-on-surface border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center ${mobile ? 'gap-2 w-full' : 'justify-end gap-2'}`}>
      <button
        onClick={onDeliver}
        disabled={isPending}
        className={`focus-ring flex items-center justify-center gap-1 bg-status-active text-white text-xs font-bold rounded-lg disabled:opacity-50 hover:brightness-105 transition-all ${mobile ? 'flex-1 py-2' : 'px-3 py-1.5'}`}
      >
        <Check size={13} /> Delivered
      </button>
      <button
        onClick={onSkip}
        className={`focus-ring border border-status-warning text-status-warning text-xs font-bold rounded-lg hover:bg-secondary-container transition-colors ${mobile ? 'flex-1 py-2' : 'px-3 py-1.5'}`}
      >
        Skip
      </button>
      <button
        onClick={onCorrect}
        title="Correct order status"
        className={`focus-ring text-on-surface-variant hover:text-on-surface border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors ${mobile ? 'px-2 py-2' : 'p-1.5'}`}
      >
        <MoreVertical size={16} />
      </button>
    </div>
  )
}
