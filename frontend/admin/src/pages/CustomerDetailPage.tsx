import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, StickyNote } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { Pagination } from '../components/ui/Pagination'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useToast } from '../components/ui/Toast'
import { apiGet, apiPost, apiGetPaged, getApiError } from '../lib/api'
import { formatPaise, formatPaiseCompact, formatDateTime } from '../lib/utils'
import type { AdminCustomerDetail, AdminLedgerEntry } from '../types'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { show } = useToast()
  const [ledgerPage, setLedgerPage] = useState(0)
  const [modal, setModal] = useState<'credit' | 'adjust' | 'setBalance' | null>(null)
  const [formErr, setFormErr] = useState('')

  const [creditAmount, setCreditAmount] = useState('')
  const [creditNotes, setCreditNotes] = useState('')
  const [adjType, setAdjType] = useState<'REFUND' | 'ADJUSTMENT' | 'DEBIT'>('REFUND')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjNotes, setAdjNotes] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [balanceReason, setBalanceReason] = useState('')

  const customer = useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => apiGet<AdminCustomerDetail>(`/admin/customers/${id}`),
  })

  const ledger = useQuery({
    queryKey: ['admin-ledger', id, ledgerPage],
    queryFn: () => apiGetPaged<AdminLedgerEntry>(`/admin/customers/${id}/wallet/ledger`, { page: ledgerPage, size: 20 }),
  })

  function closeModal() { setModal(null); setFormErr('') }

  const deactivate = useMutation({
    mutationFn: () => apiPost(`/admin/customers/${id}/deactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-customer', id] }); show('Customer deactivated') },
    onError: (e) => show(getApiError(e), 'error'),
  })

  const reactivate = useMutation({
    mutationFn: () => apiPost(`/admin/customers/${id}/reactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-customer', id] }); show('Customer reactivated') },
    onError: (e) => show(getApiError(e), 'error'),
  })

  const credit = useMutation({
    mutationFn: () => apiPost(`/admin/customers/${id}/wallet/credit`, { amountPaise: Math.round(parseFloat(creditAmount) * 100), notes: creditNotes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-customer', id] }); qc.invalidateQueries({ queryKey: ['admin-ledger', id] }); closeModal(); show('Wallet credited!') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const adjust = useMutation({
    mutationFn: () => apiPost(`/admin/customers/${id}/wallet/adjust`, { entryType: adjType, amountPaise: Math.round(parseFloat(adjAmount) * 100), notes: adjNotes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-customer', id] }); qc.invalidateQueries({ queryKey: ['admin-ledger', id] }); closeModal(); show('Adjustment applied!') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const setBalance = useMutation({
    mutationFn: () => apiPost(`/admin/customers/${id}/wallet/set-balance`, { newBalancePaise: Math.round(parseFloat(newBalance) * 100), reason: balanceReason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-customer', id] }); qc.invalidateQueries({ queryKey: ['admin-ledger', id] }); closeModal(); show('Balance updated!') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const c = customer.data

  return (
    <div>
      <PageHeader
        title={c?.name || 'Customer Details'}
        subtitle={c?.email}
        actions={
          <button onClick={() => navigate(-1)} className="focus-ring flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface rounded px-1">
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      {customer.isLoading ? (
        <div className="flex justify-center p-16"><Spinner size={36} /></div>
      ) : c ? (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile */}
            <Card>
              <h2 className="font-jakarta font-semibold text-on-surface mb-4">Profile</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-on-surface-variant">Phone</span><span className="font-medium">{c.phone}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Email</span><span className="font-medium text-xs">{c.email}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Onboarding</span><span className={`font-bold ${c.onboardingComplete ? 'text-status-active' : 'text-status-warning'}`}>{c.onboardingComplete ? 'Complete' : 'Incomplete'}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><span className={`font-bold ${c.isActive ? 'text-status-active' : 'text-status-error'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></div>
              </div>
              {c.address && (
                <div className="mt-4 pt-4 border-t border-outline-variant/70 text-xs text-on-surface-variant">
                  <p className="font-bold text-on-surface mb-1">Delivery Address</p>
                  <p>{c.address.line1}{c.address.line2 ? `, ${c.address.line2}` : ''}</p>
                  <p>{c.address.city}, {c.address.state} {c.address.pincode}</p>
                  {c.address.deliveryNotes && (
                    <p className="italic mt-1 flex items-start gap-1">
                      <StickyNote size={12} className="mt-0.5 shrink-0" /> {c.address.deliveryNotes}
                    </p>
                  )}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-outline-variant/70">
                {c.isActive ? (
                  <Button fullWidth variant="danger" loading={deactivate.isPending} onClick={() => deactivate.mutate()}>
                    Deactivate Customer
                  </Button>
                ) : (
                  <Button fullWidth loading={reactivate.isPending} onClick={() => reactivate.mutate()} className="!bg-status-active">
                    Reactivate Customer
                  </Button>
                )}
              </div>
            </Card>

            {/* Wallet */}
            <Card>
              <h2 className="font-jakarta font-semibold text-on-surface mb-4">Wallet</h2>
              <p className="text-on-surface-variant text-xs mb-1">Current Balance</p>
              <p className="font-mono font-bold text-on-surface text-3xl mb-5">{formatPaise(c.walletBalancePaise)}</p>
              <div className="space-y-2">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => { setModal('credit'); setFormErr(''); setCreditAmount(''); setCreditNotes('') }}
                >
                  + Credit Wallet
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => { setModal('adjust'); setFormErr(''); setAdjAmount(''); setAdjNotes('') }}
                >
                  Manual Adjustment
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => { setModal('setBalance'); setFormErr(''); setNewBalance(''); setBalanceReason('') }}
                >
                  Set Exact Balance
                </Button>
              </div>
            </Card>
          </div>

          {/* Ledger */}
          <Card padded={false} className="overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-outline-variant">
              <h2 className="font-jakarta font-semibold text-on-surface">Transaction History</h2>
            </div>

            <table className="hidden md:table w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {(ledger.data?.items ?? []).map((entry) => {
                  const isCredit = ['CREDIT', 'REFUND', 'ADJUSTMENT'].includes(entry.entryType)
                  return (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 text-on-surface text-xs max-w-xs truncate">{entry.description}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isCredit ? 'bg-primary-container text-status-active' : 'bg-error-container text-status-error'}`}>{entry.entryType}</span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs">{formatDateTime(entry.createdAt)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold text-sm ${isCredit ? 'text-wallet-credit' : 'text-wallet-debit'}`}>
                        {isCredit ? '+' : '-'}{formatPaiseCompact(entry.amountPaise)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-on-surface-variant text-xs">{formatPaiseCompact(entry.balanceAfterPaise)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="md:hidden divide-y divide-outline-variant">
              {(ledger.data?.items ?? []).map((entry) => {
                const isCredit = ['CREDIT', 'REFUND', 'ADJUSTMENT'].includes(entry.entryType)
                return (
                  <div key={entry.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-on-surface text-xs truncate">{entry.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${isCredit ? 'bg-primary-container text-status-active' : 'bg-error-container text-status-error'}`}>{entry.entryType}</span>
                        <span className="text-on-surface-variant text-xs">{formatDateTime(entry.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-mono font-bold text-sm ${isCredit ? 'text-wallet-credit' : 'text-wallet-debit'}`}>
                        {isCredit ? '+' : '-'}{formatPaiseCompact(entry.amountPaise)}
                      </p>
                      <p className="font-mono text-on-surface-variant text-xs">{formatPaiseCompact(entry.balanceAfterPaise)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <Pagination page={ledgerPage} total={ledger.data?.meta.total ?? 0} size={20} onChange={setLedgerPage} />
          </Card>
        </div>
      ) : null}

      {/* Credit modal */}
      <Modal open={modal === 'credit'} onClose={closeModal} title="Credit Wallet" size="sm">
        <div className="space-y-4">
          <TextField
            label="Amount (₹)"
            required
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            type="number"
            min="1"
            step="1"
            placeholder="500"
            hint="Minimum ₹1"
          />
          <TextField label="Notes" value={creditNotes} onChange={(e) => setCreditNotes(e.target.value)} placeholder="Payment ref..." />
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <Button fullWidth variant="secondary" loading={credit.isPending} disabled={!creditAmount} onClick={() => credit.mutate()}>
            Credit Wallet
          </Button>
        </div>
      </Modal>

      {/* Adjust modal */}
      <Modal open={modal === 'adjust'} onClose={closeModal} title="Manual Adjustment" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Type</label>
            <div className="flex gap-2">
              {(['REFUND', 'ADJUSTMENT', 'DEBIT'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAdjType(t)}
                  className={`focus-ring flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                    adjType === t ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <TextField label="Amount (₹)" required value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="25.00" />
          <TextField label="Notes" value={adjNotes} onChange={(e) => setAdjNotes(e.target.value)} placeholder="Reason for adjustment..." />
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <Button fullWidth loading={adjust.isPending} disabled={!adjAmount} onClick={() => adjust.mutate()}>
            Apply Adjustment
          </Button>
        </div>
      </Modal>

      {/* Set balance modal */}
      <Modal open={modal === 'setBalance'} onClose={closeModal} title="Set Exact Balance" size="sm">
        <div className="space-y-4">
          <TextField label="New Balance (₹)" required value={newBalance} onChange={(e) => setNewBalance(e.target.value)} type="number" min="0" step="0.01" placeholder="500.00" />
          <TextField label="Reason" required value={balanceReason} onChange={(e) => setBalanceReason(e.target.value)} placeholder="Operational correction..." />
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <Button fullWidth loading={setBalance.isPending} disabled={!newBalance || !balanceReason} onClick={() => setBalance.mutate()}>
            Set Balance
          </Button>
        </div>
      </Modal>
    </div>
  )
}
