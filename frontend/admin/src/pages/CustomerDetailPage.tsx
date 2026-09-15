import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { Pagination } from '../components/ui/Pagination'
import { apiGet, apiPost, apiGetPaged, getApiError } from '../lib/api'
import { formatPaise, formatPaiseCompact, formatDateTime } from '../lib/utils'
import { LEDGER_ENTRY_TYPES } from '../lib/constants'
import type { AdminCustomerDetail, AdminLedgerEntry } from '../types'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [ledgerPage, setLedgerPage] = useState(0)
  const [modal, setModal] = useState<'credit' | 'adjust' | 'setBalance' | null>(null)
  const [toast, setToast] = useState('')
  const [formErr, setFormErr] = useState('')

  // Credit form
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNotes, setCreditNotes] = useState('')
  // Adjust form
  const [adjType, setAdjType] = useState<'REFUND' | 'ADJUSTMENT' | 'DEBIT'>('REFUND')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjNotes, setAdjNotes] = useState('')
  // Set balance form
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

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  function closeModal() { setModal(null); setFormErr('') }

  const deactivate = useMutation({
    mutationFn: () => apiPost(`/admin/customers/${id}/deactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-customer', id] }); showToast('Customer deactivated') },
    onError: (e) => showToast(getApiError(e)),
  })

  const reactivate = useMutation({
    mutationFn: () => apiPost(`/admin/customers/${id}/reactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-customer', id] }); showToast('Customer reactivated') },
    onError: (e) => showToast(getApiError(e)),
  })

  const credit = useMutation({
    mutationFn: () => apiPost(`/admin/customers/${id}/wallet/credit`, { amountPaise: Math.round(parseFloat(creditAmount) * 100), notes: creditNotes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-customer', id] }); qc.invalidateQueries({ queryKey: ['admin-ledger', id] }); closeModal(); showToast('Wallet credited!') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const adjust = useMutation({
    mutationFn: () => apiPost(`/admin/customers/${id}/wallet/adjust`, { entryType: adjType, amountPaise: Math.round(parseFloat(adjAmount) * 100), notes: adjNotes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-customer', id] }); qc.invalidateQueries({ queryKey: ['admin-ledger', id] }); closeModal(); showToast('Adjustment applied!') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const setBalance = useMutation({
    mutationFn: () => apiPost(`/admin/customers/${id}/wallet/set-balance`, { newBalancePaise: Math.round(parseFloat(newBalance) * 100), reason: balanceReason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-customer', id] }); qc.invalidateQueries({ queryKey: ['admin-ledger', id] }); closeModal(); showToast('Balance updated!') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const c = customer.data
  const inputCls = 'w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary'

  return (
    <div>
      <PageHeader
        title={c?.name || 'Customer Details'}
        subtitle={c?.email}
        actions={
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
          </button>
        }
      />

      {customer.isLoading ? (
        <div className="flex justify-center p-16"><Spinner size={36} /></div>
      ) : c ? (
        <div className="p-4 sm:p-6 space-y-6">
          {toast && <div className="p-3 bg-green-50 border-l-4 border-status-active rounded-r-lg text-status-active text-sm font-medium">{toast}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile */}
            <div className="bg-white rounded-xl border border-outline-variant p-5">
              <h2 className="font-jakarta font-semibold text-on-surface mb-4">Profile</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-on-surface-variant">Phone</span><span className="font-medium">{c.phone}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Email</span><span className="font-medium text-xs">{c.email}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Onboarding</span><span className={`font-bold ${c.onboardingComplete ? 'text-status-active' : 'text-status-warning'}`}>{c.onboardingComplete ? 'Complete' : 'Incomplete'}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><span className={`font-bold ${c.isActive ? 'text-status-active' : 'text-status-error'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></div>
              </div>
              {c.address && (
                <div className="mt-4 pt-4 border-t border-outline-variant text-xs text-on-surface-variant">
                  <p className="font-bold text-on-surface mb-1">Delivery Address</p>
                  <p>{c.address.line1}{c.address.line2 ? `, ${c.address.line2}` : ''}</p>
                  <p>{c.address.city}, {c.address.state} {c.address.pincode}</p>
                  {c.address.deliveryNotes && <p className="italic mt-0.5">📝 {c.address.deliveryNotes}</p>}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-outline-variant">
                {c.isActive ? (
                  <button onClick={() => deactivate.mutate()} disabled={deactivate.isPending}
                    className="w-full py-2 border border-status-error text-status-error text-sm font-medium rounded-lg disabled:opacity-50">
                    Deactivate Customer
                  </button>
                ) : (
                  <button onClick={() => reactivate.mutate()} disabled={reactivate.isPending}
                    className="w-full py-2 bg-status-active text-white text-sm font-medium rounded-lg disabled:opacity-50">
                    Reactivate Customer
                  </button>
                )}
              </div>
            </div>

            {/* Wallet */}
            <div className="bg-white rounded-xl border border-outline-variant p-5">
              <h2 className="font-jakarta font-semibold text-on-surface mb-4">Wallet</h2>
              <p className="text-on-surface-variant text-xs mb-1">Current Balance</p>
              <p className="font-mono font-bold text-on-surface text-3xl mb-5">{formatPaise(c.walletBalancePaise)}</p>
              <div className="space-y-2">
                <button onClick={() => { setModal('credit'); setFormErr(''); setCreditAmount(''); setCreditNotes('') }}
                  className="w-full py-2.5 bg-secondary text-on-secondary text-sm font-semibold rounded-lg">
                  + Credit Wallet
                </button>
                <button onClick={() => { setModal('adjust'); setFormErr(''); setAdjAmount(''); setAdjNotes('') }}
                  className="w-full py-2.5 border border-outline-variant text-on-surface text-sm font-medium rounded-lg">
                  Manual Adjustment
                </button>
                <button onClick={() => { setModal('setBalance'); setFormErr(''); setNewBalance(''); setBalanceReason('') }}
                  className="w-full py-2.5 border border-outline-variant text-on-surface text-sm font-medium rounded-lg">
                  Set Exact Balance
                </button>
              </div>
            </div>
          </div>

          {/* Ledger */}
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-outline-variant">
              <h2 className="font-jakarta font-semibold text-on-surface">Transaction History</h2>
            </div>

            {/* Desktop table */}
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
                {(ledger.data?.items ?? []).map(entry => {
                  const isCredit = ['CREDIT', 'REFUND', 'ADJUSTMENT'].includes(entry.entryType)
                  return (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 text-on-surface text-xs max-w-xs truncate">{entry.description}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isCredit ? 'bg-green-100 text-status-active' : 'bg-red-100 text-status-error'}`}>{entry.entryType}</span>
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

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-outline-variant">
              {(ledger.data?.items ?? []).map(entry => {
                const isCredit = ['CREDIT', 'REFUND', 'ADJUSTMENT'].includes(entry.entryType)
                return (
                  <div key={entry.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-on-surface text-xs truncate">{entry.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${isCredit ? 'bg-green-100 text-status-active' : 'bg-red-100 text-status-error'}`}>{entry.entryType}</span>
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
          </div>
        </div>
      ) : null}

      {/* Credit modal */}
      <Modal open={modal === 'credit'} onClose={closeModal} title="Credit Wallet" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Amount (₹) <span className="text-error">*</span></label>
            <input value={creditAmount} onChange={e => setCreditAmount(e.target.value)} type="number" min="1" step="1" placeholder="500" className={inputCls} />
            <p className="text-xs text-on-surface-variant mt-1">Minimum ₹1</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Notes</label>
            <input value={creditNotes} onChange={e => setCreditNotes(e.target.value)} placeholder="Payment ref..." className={inputCls} />
          </div>
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <button onClick={() => credit.mutate()} disabled={credit.isPending || !creditAmount}
            className="w-full py-3 bg-secondary text-on-secondary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {credit.isPending && <Spinner size={16} />} Credit Wallet
          </button>
        </div>
      </Modal>

      {/* Adjust modal */}
      <Modal open={modal === 'adjust'} onClose={closeModal} title="Manual Adjustment" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Type</label>
            <div className="flex gap-2">
              {(['REFUND', 'ADJUSTMENT', 'DEBIT'] as const).map(t => (
                <button key={t} onClick={() => setAdjType(t)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${adjType === t ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Amount (₹) <span className="text-error">*</span></label>
            <input value={adjAmount} onChange={e => setAdjAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="25.00" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Notes</label>
            <input value={adjNotes} onChange={e => setAdjNotes(e.target.value)} placeholder="Reason for adjustment..." className={inputCls} />
          </div>
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <button onClick={() => adjust.mutate()} disabled={adjust.isPending || !adjAmount}
            className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {adjust.isPending && <Spinner size={16} />} Apply Adjustment
          </button>
        </div>
      </Modal>

      {/* Set balance modal */}
      <Modal open={modal === 'setBalance'} onClose={closeModal} title="Set Exact Balance" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">New Balance (₹) <span className="text-error">*</span></label>
            <input value={newBalance} onChange={e => setNewBalance(e.target.value)} type="number" min="0" step="0.01" placeholder="500.00" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Reason <span className="text-error">*</span></label>
            <input value={balanceReason} onChange={e => setBalanceReason(e.target.value)} placeholder="Operational correction..." className={inputCls} />
          </div>
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <button onClick={() => setBalance.mutate()} disabled={setBalance.isPending || !newBalance || !balanceReason}
            className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {setBalance.isPending && <Spinner size={16} />} Set Balance
          </button>
        </div>
      </Modal>
    </div>
  )
}
