import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
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
        <div className={`mt-4 rounded-2xl p-6 mb-4 ${lowBalance ? 'bg-orange-50 border-l-4 border-status-warning' : 'bg-primary-container'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${lowBalance ? 'text-status-warning' : 'text-on-primary-container/70'}`}>
            {lowBalance ? '⚠ Low Balance' : 'Available Balance'}
          </p>
          {wallet.isLoading ? (
            <div className="h-10 bg-on-primary-container/10 rounded w-32 animate-pulse" />
          ) : (
            <p className={`font-mono font-bold text-4xl ${lowBalance ? 'text-status-warning' : 'text-on-primary-container'}`}>
              {formatPaise(balance)}
            </p>
          )}
          {lowBalance && (
            <p className="text-status-warning text-sm mt-2">
              Minimum ₹200 recommended to keep deliveries uninterrupted.
            </p>
          )}
        </div>

        {/* Recharge request */}
        <div className="bg-white rounded-xl border border-outline-variant p-4 mb-4">
          <h3 className="font-jakarta font-semibold text-on-surface text-sm mb-1">Request Wallet Top-up</h3>
          <p className="text-on-surface-variant text-xs mb-3">Alert admin to recharge your wallet. No online payment — admin will credit manually.</p>
          <textarea
            value={rechargeNote}
            onChange={e => setRechargeNote(e.target.value)}
            placeholder="e.g. Please recharge ₹500"
            rows={2}
            className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface bg-surface-container-low resize-none focus:outline-none focus:border-primary mb-3"
          />
          {rechargeToast && <p className="text-status-active text-sm mb-2 font-medium">{rechargeToast}</p>}
          {rechargeError && <p className="text-error text-sm mb-2">{rechargeError}</p>}
          <button
            onClick={() => rechargeRequest.mutate(rechargeNote || 'Please top up my wallet')}
            disabled={isRechargeLocked || rechargeRequest.isPending}
            className="w-full py-3 bg-secondary text-on-secondary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {rechargeRequest.isPending && <Spinner size={16} />}
            {isRechargeLocked ? 'Alert sent (wait 1h to resend)' : 'Alert Admin to Recharge'}
          </button>
        </div>

        {/* Ledger */}
        <h3 className="font-jakarta font-semibold text-on-surface mb-3">Transaction History</h3>

        {ledger.isLoading && <div className="flex justify-center py-8"><Spinner size={28} /></div>}

        {!ledger.isLoading && entries.length === 0 && (
          <EmptyState icon="receipt_long" title="No transactions yet" description="Transactions appear once you receive deliveries or get wallet credits." />
        )}

        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden mb-4">
          {entries.map((entry, i) => {
            const isCredit = ['CREDIT', 'REFUND', 'ADJUSTMENT'].includes(entry.entryType)
            return (
              <div key={entry.id} className={`px-4 py-3 flex items-start justify-between gap-3 ${i < entries.length - 1 ? 'border-b border-outline-variant' : ''}`}>
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
        </div>

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
