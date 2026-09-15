import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'
import { Pagination } from '../components/ui/Pagination'

import { apiGetPaged, apiPost, getApiError } from '../lib/api'
import { formatDateTime, todayIST } from '../lib/utils'
import type { SchedulerJobLog } from '../types'

export function SchedulerPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [targetDate, setTargetDate] = useState(todayIST())
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['scheduler-history', page],
    queryFn: () => apiGetPaged<SchedulerJobLog>('/admin/scheduler/history', { page, size: 20 }),
  })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const runFreeze = useMutation({
    mutationFn: () => apiPost('/admin/scheduler/freeze', { targetDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduler-history'] }); showToast('OrderFreezeJob completed') },
    onError: (e) => setErr(getApiError(e)),
  })

  const runGenerate = useMutation({
    mutationFn: () => apiPost('/admin/scheduler/generate', { targetDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduler-history'] }); showToast('OrderGenerationJob completed') },
    onError: (e) => setErr(getApiError(e)),
  })

  const runDeliverySheet = useMutation({
    mutationFn: () => apiPost('/admin/scheduler/delivery-sheet', { targetDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduler-history'] }); showToast('DeliverySheetGenerationJob completed') },
    onError: (e) => setErr(getApiError(e)),
  })

  const isPending = runFreeze.isPending || runGenerate.isPending || runDeliverySheet.isPending

  return (
    <div>
      <PageHeader title="Scheduler" subtitle="Manual job triggers and run history" />
      <div className="p-4 sm:p-6 space-y-6">
        {toast && <div className="p-3 bg-green-50 border-l-4 border-status-active rounded-r-lg text-status-active text-sm font-medium">{toast}</div>}
        {err && <div className="p-3 bg-error-container border-l-4 border-error rounded-r-lg text-on-error-container text-sm">{err}</div>}

        {/* Manual triggers */}
        <div className="bg-white rounded-xl border border-outline-variant p-4 sm:p-6">
          <h2 className="font-jakarta font-semibold text-on-surface mb-4">Manual Triggers</h2>
          <div className="mb-5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Target Date</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              className="border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
            <p className="text-xs text-on-surface-variant mt-1">Leave blank to use next operational date.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-outline-variant rounded-xl p-4">
              <span className="material-symbols-outlined text-primary text-2xl mb-2 block">lock_clock</span>
              <h3 className="font-semibold text-on-surface text-sm mb-1">OrderFreezeJob</h3>
              <p className="text-on-surface-variant text-xs mb-3">Locks SCHEDULED orders for next-day delivery. Runs at 22:00 IST.</p>
              <button onClick={() => runFreeze.mutate()} disabled={isPending}
                className="w-full py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50">
                {runFreeze.isPending ? <Spinner size={14} /> : <span className="material-symbols-outlined text-[14px]">play_arrow</span>} Run
              </button>
            </div>
            <div className="border border-outline-variant rounded-xl p-4">
              <span className="material-symbols-outlined text-primary text-2xl mb-2 block">auto_awesome</span>
              <h3 className="font-semibold text-on-surface text-sm mb-1">OrderGenerationJob</h3>
              <p className="text-on-surface-variant text-xs mb-3">Generates tomorrow's orders for active subscriptions. Runs at 22:05 IST.</p>
              <button onClick={() => runGenerate.mutate()} disabled={isPending}
                className="w-full py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50">
                {runGenerate.isPending ? <Spinner size={14} /> : <span className="material-symbols-outlined text-[14px]">play_arrow</span>} Run
              </button>
            </div>
            <div className="border border-outline-variant rounded-xl p-4">
              <span className="material-symbols-outlined text-primary text-2xl mb-2 block">receipt_long</span>
              <h3 className="font-semibold text-on-surface text-sm mb-1">DeliverySheetJob</h3>
              <p className="text-on-surface-variant text-xs mb-3">Regenerates the delivery sheet snapshot. Runs at 22:10 IST.</p>
              <button onClick={() => runDeliverySheet.mutate()} disabled={isPending}
                className="w-full py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50">
                {runDeliverySheet.isPending ? <Spinner size={14} /> : <span className="material-symbols-outlined text-[14px]">play_arrow</span>} Run
              </button>
            </div>
          </div>
        </div>

        {/* Job history */}
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
            <h2 className="font-jakarta font-semibold text-on-surface">Run History</h2>
            <button onClick={() => refetch()} className="text-primary text-sm underline">Refresh</button>
          </div>

          {/* Desktop table — scrollable */}
          <div className="overflow-x-auto">
            <table className="hidden md:table min-w-[650px] w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Job</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Target Date</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ran At</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i}>
                      <td className="px-4 py-3"><div className="h-4 bg-surface-container rounded w-40 animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-surface-container rounded w-20 animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-5 bg-surface-container rounded-full w-20 animate-pulse mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-surface-container rounded w-28 animate-pulse" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3 bg-surface-container rounded w-20 animate-pulse" /></td>
                    </tr>
                  ))
                ) : (
                  (data?.items ?? []).map(job => (
                    <tr key={job.id}>
                      <td className="px-4 py-3 font-medium text-on-surface">{job.jobName}</td>
                      <td className="px-4 py-3 text-on-surface-variant font-mono text-xs">{job.targetDate}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${job.status === 'COMPLETED' ? 'bg-green-100 text-status-active' : job.status === 'RUNNING' ? 'bg-blue-100 text-status-future' : 'bg-red-100 text-status-error'}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs">{formatDateTime(job.ranAt)}</td>
                      <td className="px-4 py-3 text-xs hidden lg:table-cell">
                        {job.errorMessage
                          ? <span className="text-status-error font-mono">{job.errorMessage}</span>
                          : job.ordersGenerated != null
                          ? <span className="text-on-surface-variant">{job.ordersGenerated} orders</span>
                          : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          {isLoading ? (
            <div className="md:hidden divide-y divide-outline-variant">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-surface-container rounded w-40 animate-pulse" />
                    <div className="h-3 bg-surface-container rounded w-24 animate-pulse" />
                    <div className="h-3 bg-surface-container rounded w-28 animate-pulse" />
                  </div>
                  <div className="h-5 bg-surface-container rounded-full w-20 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-outline-variant">
                {(data?.items ?? []).map(job => (
                  <div key={job.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-on-surface text-sm truncate">{job.jobName}</p>
                      <p className="text-on-surface-variant text-xs font-mono">{job.targetDate}</p>
                      <p className="text-on-surface-variant text-xs">{formatDateTime(job.ranAt)}</p>
                      {job.errorMessage && <p className="text-status-error text-xs font-mono mt-0.5 truncate">{job.errorMessage}</p>}
                      {!job.errorMessage && job.ordersGenerated != null && <p className="text-on-surface-variant text-xs">{job.ordersGenerated} orders</p>}
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${job.status === 'COMPLETED' ? 'bg-green-100 text-status-active' : job.status === 'RUNNING' ? 'bg-blue-100 text-status-future' : 'bg-red-100 text-status-error'}`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
              <Pagination page={page} total={data?.meta.total ?? 0} size={20} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
