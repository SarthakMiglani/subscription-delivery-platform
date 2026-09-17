import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Minus, Plus, Clock, Droplet } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { apiGetPaged, apiPost, getApiError } from '../lib/api'
import { formatPaiseCompact, getCutoffMessage } from '../lib/utils'
import type { Product, Subscription } from '../types'

export function ProductsPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [subscribingTo, setSubscribingTo] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [modalError, setModalError] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiGetPaged<Product>('/products'),
  })

  const mySubs = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => apiGetPaged<Subscription>('/subscriptions'),
  })

  const subscribe = useMutation({
    mutationFn: (vars: { productId: string; quantity: number }) => apiPost('/subscriptions', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
      setSubscribingTo(null)
      show('Subscription created!')
    },
    onError: (e) => setModalError(getApiError(e)),
  })

  const activeSubs = new Set(
    (mySubs.data?.items ?? [])
      .filter((s) => ['ACTIVE', 'PAUSED', 'PENDING_START'].includes(s.status))
      .map((s) => s.productId)
  )

  return (
    <>
      <TopBar title="Shop" />
      <PageWrapper>
        <div className="pt-2 pb-2">
          <p className="text-on-surface-variant text-sm mb-4">Subscribe to daily juice deliveries</p>

          {isLoading && (
            <div className="grid grid-cols-2 gap-3.5">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-52 skeleton rounded-[1.75rem]" />)}
            </div>
          )}
          {error && <ErrorMessage message="Failed to load products" onRetry={refetch} />}

          <div className="grid grid-cols-2 gap-3.5">
            {(data?.items ?? []).map((product, i) => {
              const isSubscribed = activeSubs.has(product.id)
              return (
                <div
                  key={product.id}
                  style={{ '--i': i } as React.CSSProperties}
                  className="stagger-item bg-surface-container-lowest rounded-[1.75rem] shadow-card overflow-hidden flex flex-col"
                >
                  {/* Image zone — overflow-hidden clips image to card's top rounded corners */}
                  <div className="relative h-32 bg-tertiary-container overflow-hidden rounded-t-[1.75rem]">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-contain p-3"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Droplet size={28} className="text-tertiary" strokeWidth={1.5} />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (isSubscribed) return
                        setSubscribingTo(product)
                        setQuantity(1)
                        setModalError('')
                      }}
                      aria-label={isSubscribed ? 'Already subscribed' : `Subscribe to ${product.name}`}
                      disabled={isSubscribed}
                      className={`focus-ring absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-card transition-transform active:scale-90 ${
                        isSubscribed ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-primary hover:scale-105'
                      }`}
                    >
                      {isSubscribed ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col">
                    <h3 className="font-jakarta font-semibold text-on-surface text-sm leading-snug">{product.name}</h3>
                    <p className="text-on-surface-variant text-xs mt-1 line-clamp-2 flex-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <p className="font-mono font-bold text-on-surface text-sm">{formatPaiseCompact(product.pricePerUnitPaise)}</p>
                      <p className="text-on-surface-variant text-[10px] uppercase tracking-wide">{product.unitLabel}</p>
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
            <p className="text-on-surface-variant text-sm mb-5">{formatPaiseCompact(subscribingTo.pricePerUnitPaise)} per unit/day</p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">Daily quantity</label>
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="focus-ring w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
                >
                  <Minus size={16} />
                </button>
                <span className="font-mono font-bold text-on-surface text-xl w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="focus-ring w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="mb-5 p-3 bg-surface-container-low rounded-xl flex items-center gap-2">
              <Clock size={15} className="text-on-surface-variant shrink-0" />
              <p className="text-xs text-on-surface-variant font-semibold">{getCutoffMessage()}</p>
            </div>

            <p className="text-on-surface-variant text-sm mb-5">
              Daily cost: <span className="font-bold text-on-surface font-mono">{formatPaiseCompact(subscribingTo.pricePerUnitPaise * quantity)}</span>
            </p>

            {modalError && <p className="text-error text-sm mb-3">{modalError}</p>}

            <Button
              fullWidth
              size="lg"
              loading={subscribe.isPending}
              onClick={() => subscribe.mutate({ productId: subscribingTo.id, quantity })}
            >
              Confirm subscription
            </Button>
          </div>
        )}
      </Modal>
    </>
  )
}
