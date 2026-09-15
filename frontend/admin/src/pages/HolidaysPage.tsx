import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import { apiGetPaged, apiPost, apiDelete, getApiError } from '../lib/api'
import { formatDate, todayIST } from '../lib/utils'
import type { Holiday } from '../types'

export function HolidaysPage() {
  const qc = useQueryClient()
  const [addModal, setAddModal] = useState(false)
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [formErr, setFormErr] = useState('')
  const [toast, setToast] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-holidays'],
    queryFn: () => apiGetPaged<Holiday>('/admin/holidays', { size: 100 }),
  })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const addHoliday = useMutation({
    mutationFn: () => apiPost('/admin/holidays', { date, name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-holidays'] }); setAddModal(false); setDate(''); setName(''); showToast('Holiday added') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const deleteHoliday = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/holidays/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-holidays'] }); showToast('Holiday deleted') },
    onError: (e) => showToast(getApiError(e)),
  })

  const today = todayIST()
  const holidays = data?.items ?? []
  const upcoming = holidays.filter(h => h.date >= today)
  const past = holidays.filter(h => h.date < today)

  return (
    <div>
      <PageHeader title="Holidays" subtitle="Delivery pauses on holidays"
        actions={
          <button onClick={() => { setAddModal(true); setDate(''); setName(''); setFormErr('') }}
            className="px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">add</span> Add Holiday
          </button>
        }
      />
      <div className="p-4 sm:p-6 space-y-6">
        {toast && <div className="p-3 bg-green-50 border-l-4 border-status-active rounded-r-lg text-status-active text-sm font-medium">{toast}</div>}
        {isLoading && <div className="flex justify-center p-12"><Spinner size={32} /></div>}

        {upcoming.length > 0 && (
          <div>
            <h2 className="font-jakarta font-semibold text-on-surface mb-3">Upcoming Holidays</h2>
            <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
              {upcoming.map((h, i) => {
                // Backend only allows deleting strictly future holidays (date > today).
                // Today's holiday is already immutable server-side (HOLIDAY_IMMUTABLE),
                // so the delete button must not be offered for it here.
                const isDeletable = h.date > today
                return (
                <div key={h.id} className={`flex items-center justify-between px-5 py-4 ${i < upcoming.length - 1 ? 'border-b border-outline-variant' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-status-warning text-xl">event_busy</span>
                    <div>
                      <p className="font-medium text-on-surface">{h.name}</p>
                      <p className="text-on-surface-variant text-sm font-mono">{h.date}{h.date === today ? ' (today)' : ''}</p>
                    </div>
                  </div>
                  {isDeletable ? (
                    <button onClick={() => deleteHoliday.mutate(h.id)} disabled={deleteHoliday.isPending}
                      className="p-2 text-status-error hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  ) : (
                    <span className="text-xs text-on-surface-variant">Immutable</span>
                  )}
                </div>
                )
              })}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="font-jakarta font-semibold text-on-surface mb-3">Past Holidays</h2>
            <div className="bg-white rounded-xl border border-outline-variant overflow-hidden opacity-60">
              {past.slice(0, 10).map((h, i) => (
                <div key={h.id} className={`flex items-center justify-between px-5 py-3 ${i < Math.min(past.length, 10) - 1 ? 'border-b border-outline-variant' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl">event</span>
                    <div>
                      <p className="text-on-surface text-sm">{h.name}</p>
                      <p className="text-on-surface-variant text-xs font-mono">{h.date}</p>
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant">Past (immutable)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && holidays.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-outline text-5xl mb-3 block">event_busy</span>
            <p className="font-jakarta font-semibold text-on-surface">No holidays configured</p>
            <p className="text-on-surface-variant text-sm mt-1">Add holidays to pause deliveries on those days.</p>
          </div>
        )}
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Holiday" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Date <span className="text-error">*</span></label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={today}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Holiday Name <span className="text-error">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Independence Day"
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary" />
          </div>
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <button onClick={() => addHoliday.mutate()} disabled={addHoliday.isPending || !date || !name}
            className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {addHoliday.isPending && <Spinner size={16} />} Add Holiday
          </button>
        </div>
      </Modal>
    </div>
  )
}
