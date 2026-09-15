import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Spinner } from '../components/ui/Spinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { Modal } from '../components/ui/Modal'
import { apiGet, apiPost, apiGetPaged, getApiError } from '../lib/api'
import { formatPaiseCompact, getCutoffMessage } from '../lib/utils'
import type { Product, Subscription } from '../types'

export function ProductsPage() {
  const qc = useQueryClient()
  const [subscribingTo, setSubscribingTo] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [toast, setToast] = useState('')
  const [toastError, setToastError] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiGetPaged<Product>('/products'),
  })

  const mySubs = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => apiGetPaged<Subscription>('/subscriptions'),
  })

  const subscribe = useMutation({
    mutationFn: (vars: { productId: string; quantity: number }) =>
      apiPost('/subscriptions', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
      setSubscribingTo(null)
      setToast('Subscription created!')
      setTimeout(() => setToast(''), 3000)
    },
    onError: (e) => setToastError(getApiError(e)),
  })

  const activeSubs = new Set(
    (mySubs.data?.items ?? [])
      .filter(s => ['ACTIVE', 'PAUSED', 'PENDING_START'].includes(s.status))
      .map(s => s.productId)
  )

  return (
    <>
      <TopBar title="Products" />
      <PageWrapper>
        <div className="py-4">
          <p className="text-on-surface-variant text-sm mb-4">Subscribe to daily juice deliveries</p>

          {isLoading && <div className="flex justify-center py-16"><Spinner size={32} /></div>}
          {error && <ErrorMessage message="Failed to load products" onRetry={refetch} />}

          {toast && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-status-active rounded-r-lg text-status-active text-sm font-medium">{toast}</div>
          )}

          <div className="space-y-3">
            {(data?.items ?? []).map(product => {
              const isSubscribed = activeSubs.has(product.id)
              return (
                <div key={product.id} className="bg-white rounded-xl border border-outline-variant overflow-hidden">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-jakarta font-semibold text-on-surface">{product.name}</h3>
                        <p className="text-on-surface-variant text-sm mt-0.5">{product.description}</p>
                        <p className="text-on-surface-variant text-xs mt-1">{product.unitLabel}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-mono font-bold text-on-surface text-lg">{formatPaiseCompact(product.pricePerUnitPaise)}</p>
                        <p className="text-on-surface-variant text-xs">per unit/day</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      {isSubscribed ? (
                        <span className="inline-flex items-center gap-1 text-status-active text-xs font-semibold">
                          <span className="material-symbols-outlined text-[14px] filled">check_circle</span>
                          Subscribed
                        </span>
                      ) : (
                        <button
                          onClick={() => { setSubscribingTo(product); setQuantity(1); setToastError('') }}
                          className="w-full bg-primary text-on-primary font-semibold py-2.5 rounded-lg text-sm"
                        >
                          Subscribe Daily
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </PageWrapper>

      <Modal open={!!subscribingTo} onClose={() => setSubscribingTo(null)} title="Subscribe">
        {subscribingTo && (
          <div>
            <p className="text-on-surface font-medium mb-1">{subscribingTo.name}</p>
            <p className="text-on-surface-variant text-sm mb-4">{formatPaiseCompact(subscribingTo.pricePerUnitPaise)} per unit/day</p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Daily Quantity</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center text-on-surface">−</button>
                <span className="font-mono font-bold text-on-surface text-xl w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center text-on-surface">+</button>
              </div>
            </div>

            <div className="mb-4 p-3 bg-surface-container-low rounded-lg">
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">⏰ {getCutoffMessage()}</p>
            </div>

            <p className="text-on-surface-variant text-sm mb-4">
              Daily cost: <span className="font-bold text-on-surface">{formatPaiseCompact(subscribingTo.pricePerUnitPaise * quantity)}</span>
            </p>

            {toastError && <p className="text-error text-sm mb-3">{toastError}</p>}

            <button
              onClick={() => subscribe.mutate({ productId: subscribingTo.id, quantity })}
              disabled={subscribe.isPending}
              className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {subscribe.isPending && <Spinner size={16} />}
              Confirm Subscription
            </button>
          </div>
        )}
      </Modal>
    </>
  )
}
