import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronRight } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { apiGetPaged } from '../lib/api'
import { formatPaiseCompact } from '../lib/utils'
import type { AdminCustomerListItem } from '../types'

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
        isActive ? 'bg-primary-container text-status-active' : 'bg-error-container text-status-error'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

export function CustomersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: () =>
      apiGetPaged<AdminCustomerListItem>('/admin/customers', {
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
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearch(searchInput)
                  setPage(0)
                }
              }}
              placeholder="Search by name, phone, email…"
              className="focus-ring w-full pl-10 pr-4 h-10 border border-outline-variant rounded-xl text-sm bg-surface-container-lowest focus:border-primary transition-colors"
            />
          </div>
          <Button
            onClick={() => {
              setSearch(searchInput)
              setPage(0)
            }}
          >
            Search
          </Button>
          {search && (
            <button
              onClick={() => {
                setSearch('')
                setSearchInput('')
                setPage(0)
              }}
              className="focus-ring px-3 text-on-surface-variant text-sm font-medium rounded hover:text-on-surface"
            >
              Clear
            </button>
          )}
        </div>

        <Card padded={false} className="overflow-hidden">
          {/* Desktop table */}
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
                  [1, 2, 3, 4, 5, 6].map((i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="h-4 skeleton rounded w-32 mb-1.5" />
                        <div className="h-3 skeleton rounded w-44" />
                      </td>
                      <td className="px-4 py-3"><div className="h-3 skeleton rounded w-24" /></td>
                      <td className="px-4 py-3"><div className="h-4 skeleton rounded w-16 ml-auto" /></td>
                      <td className="px-4 py-3"><div className="h-5 skeleton rounded-full w-14 mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-3 skeleton rounded w-6 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/customers/${c.id}`)}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/customers/${c.id}`) }}
                      className="focus-ring cursor-pointer hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">{c.name}</p>
                        <p className="text-on-surface-variant text-xs">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">{c.phone}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-on-surface">{formatPaiseCompact(c.walletBalancePaise)}</td>
                      <td className="px-4 py-3 text-center">
                        <ActiveBadge isActive={c.isActive} />
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
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3.5">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 skeleton rounded w-32" />
                    <div className="h-3 skeleton rounded w-20" />
                  </div>
                  <div className="h-5 skeleton rounded-full w-14" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-outline-variant">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="focus-ring w-full text-left flex items-center justify-between px-4 py-3 active:bg-surface-container-low/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-on-surface truncate">{c.name}</p>
                      <p className="text-on-surface-variant text-xs">{c.phone}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-bold text-on-surface text-sm">{formatPaiseCompact(c.walletBalancePaise)}</p>
                        <ActiveBadge isActive={c.isActive} />
                      </div>
                      <ChevronRight size={16} className="text-on-surface-variant" />
                    </div>
                  </button>
                ))}
              </div>
              <Pagination page={page} total={total} size={20} onChange={setPage} />
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
