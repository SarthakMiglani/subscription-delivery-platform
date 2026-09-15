import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { apiGetPaged } from '../lib/api'
import { formatPaiseCompact } from '../lib/utils'
import type { AdminCustomerListItem } from '../types'

export function CustomersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: () => apiGetPaged<AdminCustomerListItem>('/admin/customers', {
      ...(search ? { search } : {}),
      page,
      size: 20,
    }),
  })

  const customers = data?.items ?? []
  const total = data?.meta.total ?? 0

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${total} total customers`} />
      <div className="p-4 sm:p-6">
        {/* Search */}
        <div className="flex gap-2 mb-5">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0) } }}
              placeholder="Search by name, phone, email…"
              className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-xl text-sm bg-white focus:outline-none focus:border-primary"
            />
          </div>
          <button onClick={() => { setSearch(searchInput); setPage(0) }}
            className="px-4 py-2.5 bg-primary text-on-primary text-sm font-medium rounded-xl">Search</button>
          {search && <button onClick={() => { setSearch(''); setSearchInput(''); setPage(0) }}
            className="px-3 text-on-surface-variant text-sm underline">Clear</button>}
        </div>

        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          {/* Desktop table — scrollable */}
          <div className="overflow-x-auto">
            <table className="hidden md:table min-w-[600px] w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Phone</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Balance</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Subs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isLoading ? (
                  [1,2,3,4,5,6].map(i => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-surface-container rounded w-32 animate-pulse mb-1.5" />
                        <div className="h-3 bg-surface-container rounded w-44 animate-pulse" />
                      </td>
                      <td className="px-4 py-3"><div className="h-3 bg-surface-container rounded w-24 animate-pulse" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-surface-container rounded w-16 animate-pulse ml-auto" /></td>
                      <td className="px-4 py-3"><div className="h-5 bg-surface-container rounded-full w-14 animate-pulse mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-3 bg-surface-container rounded w-6 animate-pulse ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  customers.map(c => (
                    <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}
                      className="cursor-pointer hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">{c.name}</p>
                        <p className="text-on-surface-variant text-xs">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">{c.phone}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-on-surface">{formatPaiseCompact(c.walletBalancePaise)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.isActive ? 'bg-green-100 text-status-active' : 'bg-red-100 text-status-error'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-on-surface">{c.activeSubscriptionCount}</td>
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
                <div key={i} className="flex items-center justify-between px-4 py-3.5">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-surface-container rounded w-32 animate-pulse" />
                    <div className="h-3 bg-surface-container rounded w-20 animate-pulse" />
                  </div>
                  <div className="h-5 bg-surface-container rounded-full w-14 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-outline-variant">
                {customers.map(c => (
                  <div key={c.id} onClick={() => navigate(`/customers/${c.id}`)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-surface-container-low/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-on-surface truncate">{c.name}</p>
                      <p className="text-on-surface-variant text-xs">{c.phone}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-bold text-on-surface text-sm">{formatPaiseCompact(c.walletBalancePaise)}</p>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${c.isActive ? 'bg-green-100 text-status-active' : 'bg-red-100 text-status-error'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} total={total} size={20} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
