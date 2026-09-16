import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Search } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Card } from '../components/ui/Card'
import { apiGetPaged, getApiError } from '../lib/api'
import { formatDateTime } from '../lib/utils'
import type { AdminAuditLog } from '../types'

export function AuditLogPage() {
  const [page, setPage] = useState(0)
  const [entityFilter, setEntityFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const params: Record<string, unknown> = { page, size: 25 }
  if (entityFilter.trim()) params.targetEntity = entityFilter.trim()

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, entityFilter],
    queryFn: () => apiGetPaged<AdminAuditLog>('/admin/audit-logs', params),
  })

  const errMsg = error ? getApiError(error) : null

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function prettyJson(raw: string | null): string {
    if (!raw) return '—'
    try { return JSON.stringify(JSON.parse(raw), null, 2) } catch { return raw }
  }

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Immutable record of all admin actions" />
      <div className="p-4 sm:p-6 space-y-4">
        {errMsg && <div className="p-3 bg-error-container border-l-4 border-error rounded-r-lg text-on-error-container text-sm">{errMsg}</div>}

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-1.5">Filter by Entity</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="e.g. order, subscription, product"
                  value={entityFilter}
                  onChange={(e) => { setEntityFilter(e.target.value); setPage(0) }}
                  className="focus-ring pl-9 h-10 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary transition-colors w-60"
                />
              </div>
            </div>
            {entityFilter && (
              <button onClick={() => { setEntityFilter(''); setPage(0) }} className="focus-ring text-sm text-primary font-semibold rounded px-1 hover:underline">
                Clear
              </button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="hidden md:table min-w-[700px] w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Target ID</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">Notes</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isLoading ? (
                  [1, 2, 3, 4, 5, 6].map((i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><div className="h-3 skeleton rounded w-28" /></td>
                      <td className="px-4 py-3"><div className="h-5 skeleton rounded-full w-24" /></td>
                      <td className="px-4 py-3"><div className="h-3 skeleton rounded w-20" /></td>
                      <td className="px-4 py-3"><div className="h-3 skeleton rounded w-32" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3 skeleton rounded w-24" /></td>
                      <td className="px-4 py-3"><div className="h-4 skeleton rounded w-4 ml-auto" /></td>
                    </tr>
                  ))
                ) : (data?.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant text-sm">No audit log entries found.</td>
                  </tr>
                ) : (
                  (data?.items ?? []).map((entry) => (
                    <Fragment key={entry.id}>
                      <tr
                        className="cursor-pointer hover:bg-surface-container-low transition-colors"
                        onClick={() => toggleExpand(entry.id)}
                      >
                        <td className="px-4 py-3 text-on-surface-variant text-xs whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-container text-primary font-mono">{entry.actionType}</span>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant capitalize text-sm">{entry.targetEntity}</td>
                        <td className="px-4 py-3 text-on-surface-variant font-mono text-xs truncate max-w-[160px]">{entry.targetId}</td>
                        <td className="px-4 py-3 text-on-surface-variant text-xs hidden lg:table-cell max-w-[200px] truncate">{entry.notes ?? '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <ChevronDown size={16} className={`text-on-surface-variant transition-transform inline-block ${expandedId === entry.id ? 'rotate-180' : ''}`} />
                        </td>
                      </tr>
                      {expandedId === entry.id && (
                        <tr className="bg-surface-container-low">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Before</p>
                                <pre className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-xs font-mono text-on-surface overflow-auto max-h-40 whitespace-pre-wrap">
                                  {prettyJson(entry.oldValue)}
                                </pre>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">After</p>
                                <pre className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-xs font-mono text-on-surface overflow-auto max-h-40 whitespace-pre-wrap">
                                  {prettyJson(entry.newValue)}
                                </pre>
                              </div>
                              <div className="lg:col-span-2 flex flex-wrap gap-4 text-xs text-on-surface-variant">
                                <span><span className="font-semibold">Admin ID:</span> {entry.actingAdmin}</span>
                                {entry.notes && <span><span className="font-semibold">Notes:</span> {entry.notes}</span>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          {isLoading ? (
            <div className="md:hidden divide-y divide-outline-variant">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-4 py-3 space-y-1.5">
                  <div className="h-5 skeleton rounded-full w-24" />
                  <div className="h-3 skeleton rounded w-32" />
                  <div className="h-3 skeleton rounded w-28" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-outline-variant">
                {(data?.items ?? []).length === 0 ? (
                  <p className="px-4 py-8 text-center text-on-surface-variant text-sm">No audit log entries found.</p>
                ) : (
                  (data?.items ?? []).map((entry) => (
                    <div key={entry.id} className="px-4 py-3">
                      <button className="focus-ring w-full text-left" onClick={() => toggleExpand(entry.id)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-primary-container text-primary font-mono mb-1">{entry.actionType}</span>
                            <p className="text-on-surface text-sm capitalize">{entry.targetEntity}</p>
                            <p className="text-on-surface-variant font-mono text-xs truncate">{entry.targetId}</p>
                            <p className="text-on-surface-variant text-xs">{formatDateTime(entry.createdAt)}</p>
                          </div>
                          <ChevronDown size={16} className={`text-on-surface-variant shrink-0 mt-1 transition-transform ${expandedId === entry.id ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {expandedId === entry.id && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Before</p>
                            <pre className="bg-surface-container-low border border-outline-variant rounded-lg p-2 text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                              {prettyJson(entry.oldValue)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">After</p>
                            <pre className="bg-surface-container-low border border-outline-variant rounded-lg p-2 text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                              {prettyJson(entry.newValue)}
                            </pre>
                          </div>
                          {entry.notes && <p className="text-xs text-on-surface-variant"><span className="font-semibold">Notes:</span> {entry.notes}</p>}
                          <p className="text-xs text-on-surface-variant font-mono truncate"><span className="font-semibold">Admin:</span> {entry.actingAdmin}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <Pagination page={page} total={data?.meta.total ?? 0} size={25} onChange={setPage} />
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
