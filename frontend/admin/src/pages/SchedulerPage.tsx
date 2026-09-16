import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LockKeyhole, Sparkles, ReceiptText, Play, RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useToast } from '../components/ui/Toast'
import { apiGetPaged, apiPost, getApiError } from '../lib/api'
import { formatDateTime, todayIST } from '../lib/utils'
import type { SchedulerJobLog } from '../types'

export function SchedulerPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [page, setPage] = useState(0)
  const [targetDate, setTargetDate] = useState(todayIST())
  const [err, setErr] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['scheduler-history', page],
    queryFn: () => apiGetPaged<SchedulerJobLog>('/admin/scheduler/history', { page, size: 20 }),
  })

  const runFreeze = useMutation({
    mutationFn: () => apiPost('/admin/scheduler/freeze', { targetDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduler-history'] }); show('OrderFreezeJob completed') },
    onError: (e) => setErr(getApiError(e)),
  })

  const runGenerate = useMutation({
    mutationFn: () => apiPost('/admin/scheduler/generate', { targetDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduler-history'] }); show('OrderGenerationJob completed') },
    onError: (e) => setErr(getApiError(e)),
  })

  const runDeliverySheet = useMutation({
    mutationFn: () => apiPost('/admin/scheduler/delivery-sheet', { targetDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduler-history'] }); show('DeliverySheetGenerationJob completed') },
    onError: (e) => setErr(getApiError(e)),
  })

  const isPending = runFreeze.isPending || runGenerate.isPending || runDeliverySheet.isPending

  const JOBS = [
    { icon: LockKeyhole, name: 'OrderFreezeJob', desc: 'Locks SCHEDULED orders for next-day delivery. Runs at 22:00 IST.', run: runFreeze },
    { icon: Sparkles, name: 'OrderGenerationJob', desc: "Generates tomorrow's orders for active subscriptions. Runs at 22:05 IST.", run: runGenerate },
    { icon: ReceiptText, name: 'DeliverySheetJob', desc: 'Regenerates the delivery sheet snapshot. Runs at 22:10 IST.', run: runDeliverySheet },
  ]

  return (
    <div>
      <PageHeader title="Scheduler" subtitle="Manual job triggers and run history" />
      <div className="p-4 sm:p-6 space-y-6">
        {err && <div className="p-3 bg-error-container border-l-4 border-error rounded-r-lg text-on-error-container text-sm">{err}</div>}

        {/* Manual triggers */}
        <Card>
          <h2 className="font-jakarta font-semibold text-on-surface mb-4">Manual Triggers</h2>
          <div className="mb-5">
            <label className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-1.5">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="focus-ring h-10 px-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary transition-colors"
            />
            <p className="text-xs text-on-surface-variant mt-1">Leave blank to use next operational date.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {JOBS.map((job) => (
              <div key={job.name} className="border border-outline-variant/70 rounded-2xl p-4">
                <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center mb-2.5">
                  <job.icon size={17} className="text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-on-surface text-sm mb-1">{job.name}</h3>
                <p className="text-on-surface-variant text-xs mb-3.5 leading-relaxed">{job.desc}</p>
                <Button size="sm" fullWidth icon={<Play size={13} />} loading={job.run.isPending} disabled={isPending} onClick={() => job.run.mutate()}>
                  Run
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Job history */}
        <Card padded={false} className="overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
            <h2 className="font-jakarta font-semibold text-on-surface">Run History</h2>
            <button onClick={() => refetch()} className="focus-ring flex items-center gap-1 text-primary text-sm font-semibold hover:underline rounded">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

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
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><div className="h-4 skeleton rounded w-40" /></td>
                      <td className="px-4 py-3"><div className="h-3 skeleton rounded w-20" /></td>
                      <td className="px-4 py-3"><div className="h-5 skeleton rounded-full w-20 mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-3 skeleton rounded w-28" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3 skeleton rounded w-20" /></td>
                    </tr>
                  ))
                ) : (
                  (data?.items ?? []).map((job) => (
                    <tr key={job.id}>
                      <td className="px-4 py-3 font-medium text-on-surface">{job.jobName}</td>
                      <td className="px-4 py-3 text-on-surface-variant font-mono text-xs">{job.targetDate}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={job.status} /></td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs">{formatDateTime(job.ranAt)}</td>
                      <td className="px-4 py-3 text-xs hidden lg:table-cell">
                        {job.errorMessage ? (
                          <span className="text-status-error font-mono">{job.errorMessage}</span>
                        ) : job.ordersGenerated != null ? (
                          <span className="text-on-surface-variant">{job.ordersGenerated} orders</span>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isLoading ? (
            <div className="md:hidden divide-y divide-outline-variant">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 skeleton rounded w-40" />
                    <div className="h-3 skeleton rounded w-24" />
                    <div className="h-3 skeleton rounded w-28" />
                  </div>
                  <div className="h-5 skeleton rounded-full w-20" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-outline-variant">
                {(data?.items ?? []).map((job) => (
                  <div key={job.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-on-surface text-sm truncate">{job.jobName}</p>
                      <p className="text-on-surface-variant text-xs font-mono">{job.targetDate}</p>
                      <p className="text-on-surface-variant text-xs">{formatDateTime(job.ranAt)}</p>
                      {job.errorMessage && <p className="text-status-error text-xs font-mono mt-0.5 truncate">{job.errorMessage}</p>}
                      {!job.errorMessage && job.ordersGenerated != null && <p className="text-on-surface-variant text-xs">{job.ordersGenerated} orders</p>}
                    </div>
                    <StatusBadge status={job.status} className="shrink-0" />
                  </div>
                ))}
              </div>
              <Pagination page={page} total={data?.meta.total ?? 0} size={20} onChange={setPage} />
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
