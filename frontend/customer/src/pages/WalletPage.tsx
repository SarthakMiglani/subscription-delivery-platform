import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { AlertTriangle, Receipt } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextAreaField } from '../components/ui/TextField'
import { Pagination } from '../components/ui/Pagination'
import { apiGet, apiGetPaged, apiPost, getApiError } from '../lib/api'
import { formatPaise, formatPaiseCompact, formatDateTime } from '../lib/utils'
import { RECHARGE_RATE_LIMIT_MS } from '../lib/constants'
import { useAuthStore } from '../store/authStore'
import type { WalletSummary, LedgerEntry } from '../types'

export function WalletPage() {
  const [page, setPage] = useState(0)
  const customerId = useAuthStore((s) => s.customerId)
  const lockKey = `recharge-lock:${customerId}`
  const [rechargeLockUntil, setRechargeLockUntil] = useState<number>(() => {
    const stored = customerId ? localStorage.getItem(`recharge-lock:${customerId}`) : null
    return stored ? parseInt(stored) : 0
  })
  const [rechargeNote, setRechargeNote] = useState('')
  const [rechargeToast, setRechargeToast] = useState('')
  const [rechargeError, setRechargeError] = useState('')

  // One-time migration: remove the old shared key that caused all users to share the same lock
  useEffect(() => { localStorage.removeItem('recharge-lock') }, [])

  const wallet = useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiGet<WalletSummary>('/wallet'),
  })

  const ledger = useQuery({
    queryKey: ['ledger', page],
    queryFn: () => apiGetPaged<LedgerEntry>('/wallet/ledger', { page, size: 20 }),
  })

  const rechargeRequest = useMutation({
    mutationFn: (notes: string) => apiPost('/wallet/recharge-request', { notes }),
    onSuccess: () => {
      const lockUntil = Date.now() + RECHARGE_RATE_LIMIT_MS
      setRechargeLockUntil(lockUntil)
      localStorage.setItem(lockKey, String(lockUntil))
      setRechargeNote('')
      setRechargeToast('Alert sent to admin!')
      setTimeout(() => setRechargeToast(''), 3000)
    },
    onError: (e) => setRechargeError(getApiError(e)),
  })

  const isRechargeLocked = Date.now() < rechargeLockUntil
  const balance = wallet.data?.balancePaise ?? 0
  const lowBalance = wallet.data?.lowBalanceWarning ?? false
  const entries = ledger.data?.items ?? []
  const total = ledger.data?.meta.total ?? 0

  return (
    <>
      <TopBar title="Wallet" />
      <PageWrapper>
        {/* Balance card */}
        <div
          className={`mt-4 rounded-2xl p-6 mb-4 relative overflow-hidden shadow-card ${
            lowBalance ? 'bg-secondary-container' : 'bg-primary'
          }`}
        >
          {!lowBalance && <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-on-primary/[0.06] pointer-events-none" />}
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1.5">
              {lowBalance && <AlertTriangle size={14} className="text-status-warning" />}
              <p className={`text-xs font-bold uppercase tracking-wider ${lowBalance ? 'text-status-warning' : 'text-on-primary/65'}`}>
                {lowBalance ? 'Low balance' : 'Available balance'}
              </p>
            </div>
            {wallet.isLoading ? (
              <div className="h-10 skeleton rounded w-32" />
            ) : (
              <p className={`font-mono font-bold text-4xl ${lowBalance ? 'text-status-warning' : 'text-on-primary'}`}>
                {formatPaise(balance)}
              </p>
            )}
            {lowBalance && (
              <p className="text-on-secondary-container text-sm mt-2">Minimum ₹200 recommended to keep deliveries uninterrupted.</p>
            )}
          </div>
        </div>

        {/* Recharge request */}
        <Card className="mb-4">
          <h3 className="font-jakarta font-semibold text-on-surface text-sm mb-1">Request wallet top-up</h3>
          <p className="text-on-surface-variant text-xs mb-3">Alert admin to recharge your wallet. No online payment — admin will credit manually.</p>
          <div className="mb-3">
            <TextAreaField
              label="Note"
              value={rechargeNote}
              onChange={(e) => setRechargeNote(e.target.value)}
              placeholder="e.g. Please recharge ₹500"
              rows={2}
              className="!py-2.5"
            />
          </div>
          {rechargeToast && <p className="text-status-active text-sm mb-2 font-medium">{rechargeToast}</p>}
          {rechargeError && <p className="text-error text-sm mb-2">{rechargeError}</p>}
          <Button
            fullWidth
            variant="secondary"
            loading={rechargeRequest.isPending}
            disabled={isRechargeLocked}
            onClick={() => rechargeRequest.mutate(rechargeNote || 'Please top up my wallet')}
          >
            {isRechargeLocked ? 'Alert sent (wait 1h to resend)' : 'Alert admin to recharge'}
          </Button>
        </Card>

        {/* Ledger */}
        <h3 className="font-jakarta font-semibold text-on-surface mb-3">Transaction history</h3>

        {ledger.isLoading && <div className="flex justify-center py-8"><Spinner size={28} /></div>}

        {!ledger.isLoading && entries.length === 0 && (
          <EmptyState icon={Receipt} title="No transactions yet" description="Transactions appear once you receive deliveries or get wallet credits." />
        )}

        {entries.length > 0 && (
          <Card padded={false} className="overflow-hidden mb-4">
            {entries.map((entry, i) => {
              const isCredit = ['CREDIT', 'REFUND', 'ADJUSTMENT'].includes(entry.entryType)
              return (
                <div
                  key={entry.id}
                  className={`px-4 py-3 flex items-start justify-between gap-3 ${i < entries.length - 1 ? 'border-b border-outline-variant/70' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface text-sm font-medium leading-tight truncate">{entry.description}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">{formatDateTime(entry.createdAt)}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">Balance after: {formatPaiseCompact(entry.balanceAfterPaise)}</p>
                  </div>
                  <p className={`font-mono font-bold text-sm whitespace-nowrap ${isCredit ? 'text-wallet-credit' : 'text-wallet-debit'}`}>
                    {isCredit ? '+' : '-'}{formatPaiseCompact(entry.amountPaise)}
                  </p>
                </div>
              )
            })}
          </Card>
        )}

        <Pagination page={page} total={total} size={20} onChange={setPage} />
      </PageWrapper>
    </>
  )
}
