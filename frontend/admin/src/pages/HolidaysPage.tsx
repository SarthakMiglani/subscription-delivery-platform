import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CalendarOff, Calendar, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useToast } from '../components/ui/Toast'
import { apiGetPaged, apiPost, apiDelete, getApiError } from '../lib/api'
import { todayIST } from '../lib/utils'
import type { Holiday } from '../types'

export function HolidaysPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [addModal, setAddModal] = useState(false)
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [formErr, setFormErr] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-holidays'],
    queryFn: () => apiGetPaged<Holiday>('/admin/holidays', { size: 100 }),
  })

  const addHoliday = useMutation({
    mutationFn: () => apiPost('/admin/holidays', { date, name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-holidays'] }); setAddModal(false); setDate(''); setName(''); show('Holiday added') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const deleteHoliday = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/holidays/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-holidays'] }); show('Holiday deleted') },
    onError: (e) => show(getApiError(e), 'error'),
  })

  const today = todayIST()
  const holidays = data?.items ?? []
  const upcoming = holidays.filter((h) => h.date >= today)
  const past = holidays.filter((h) => h.date < today)

  return (
    <div>
      <PageHeader
        title="Holidays"
        subtitle="Delivery pauses on holidays"
        actions={
          <Button size="sm" icon={<Plus size={15} />} onClick={() => { setAddModal(true); setDate(''); setName(''); setFormErr('') }}>
            Add Holiday
          </Button>
        }
      />
      <div className="p-4 sm:p-6 space-y-6">
        {isLoading && <div className="flex justify-center p-12"><Spinner size={32} /></div>}

        {upcoming.length > 0 && (
          <div>
            <h2 className="font-jakarta font-semibold text-on-surface mb-3">Upcoming Holidays</h2>
            <Card padded={false} className="overflow-hidden">
              {upcoming.map((h, i) => {
                const isDeletable = h.date > today
                return (
                  <div key={h.id} className={`flex items-center justify-between px-5 py-4 ${i < upcoming.length - 1 ? 'border-b border-outline-variant/70' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
                        <CalendarOff size={17} className="text-status-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-on-surface">{h.name}</p>
                        <p className="text-on-surface-variant text-sm font-mono">{h.date}{h.date === today ? ' (today)' : ''}</p>
                      </div>
                    </div>
                    {isDeletable ? (
                      <button
                        onClick={() => deleteHoliday.mutate(h.id)}
                        disabled={deleteHoliday.isPending}
                        aria-label={`Delete ${h.name}`}
                        className="focus-ring p-2 text-status-error hover:bg-error-container rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : (
                      <span className="text-xs text-on-surface-variant">Immutable</span>
                    )}
                  </div>
                )
              })}
            </Card>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="font-jakarta font-semibold text-on-surface mb-3">Past Holidays</h2>
            <Card padded={false} className="overflow-hidden opacity-60">
              {past.slice(0, 10).map((h, i) => (
                <div key={h.id} className={`flex items-center justify-between px-5 py-3 ${i < Math.min(past.length, 10) - 1 ? 'border-b border-outline-variant/70' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Calendar size={17} className="text-on-surface-variant" />
                    <div>
                      <p className="text-on-surface text-sm">{h.name}</p>
                      <p className="text-on-surface-variant text-xs font-mono">{h.date}</p>
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant">Past (immutable)</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {!isLoading && holidays.length === 0 && (
          <div className="text-center py-16">
            <CalendarOff size={40} className="text-outline mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-jakarta font-semibold text-on-surface">No holidays configured</p>
            <p className="text-on-surface-variant text-sm mt-1">Add holidays to pause deliveries on those days.</p>
          </div>
        )}
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Holiday" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-1.5">Date <span className="text-secondary">*</span></label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="focus-ring w-full h-10 px-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm focus:border-primary transition-colors"
            />
          </div>
          <TextField label="Holiday name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Independence Day" />
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <Button fullWidth loading={addHoliday.isPending} disabled={!date || !name} onClick={() => addHoliday.mutate()}>
            Add Holiday
          </Button>
        </div>
      </Modal>
    </div>
  )
}
