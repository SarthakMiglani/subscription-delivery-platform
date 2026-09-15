import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Spinner } from '../components/ui/Spinner'
import { apiGet, apiPost, apiPut, getApiError } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { CustomerProfile } from '../types'

interface AddressForm {
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  deliveryNotes: string
}

const EMPTY: AddressForm = { line1: '', line2: '', city: '', state: '', pincode: '', deliveryNotes: '' }

export function ProfilePage() {
  const { logout } = useAuthStore()
  const qc = useQueryClient()
  const [form, setForm] = useState<AddressForm>(EMPTY)
  const [saveErr, setSaveErr] = useState('')
  const [saveOk, setSaveOk] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet<CustomerProfile>('/customer/me'),
  })

  useEffect(() => {
    if (profile.data?.address) {
      const a = profile.data.address
      setForm({
        line1: a.line1 ?? '',
        line2: a.line2 ?? '',
        city: a.city ?? '',
        state: a.state ?? '',
        pincode: a.pincode ?? '',
        deliveryNotes: a.deliveryNotes ?? '',
      })
    }
  }, [profile.data])

  function set(field: keyof AddressForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const updateAddress = useMutation({
    mutationFn: () =>
      apiPut('/customer/address', {
        line1: form.line1,
        line2: form.line2 || undefined,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        deliveryNotes: form.deliveryNotes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setSaveOk(true)
      setSaveErr('')
      setTimeout(() => setSaveOk(false), 3000)
    },
    onError: (e) => setSaveErr(getApiError(e)),
  })

  const updateProfile = useMutation({
    mutationFn: () =>
      apiPut('/customer/profile', { name: nameInput }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setEditingName(false)
    },
    onError: (e) => setSaveErr(getApiError(e)),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.line1 || !form.city || !form.state || !form.pincode) {
      setSaveErr('Please fill in all required fields.')
      return
    }
    setSaveErr('')
    updateAddress.mutate()
  }

  const p = profile.data
  const inputCls =
    'w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm'
  const labelCls = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5'

  return (
    <>
      <TopBar title="Profile" showBack />
      <PageWrapper>
        {/* Account info (read-only) */}
        <div className="mt-4 bg-white rounded-xl border border-outline-variant p-5 mb-5">
          <h2 className="font-jakarta font-semibold text-on-surface mb-4">Account</h2>
          {profile.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-surface-container rounded animate-pulse" />
              ))}
            </div>
          ) : p ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Name</span>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      className="border border-outline-variant rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                      autoFocus
                    />
                    <button
                      onClick={() => updateProfile.mutate()}
                      disabled={updateProfile.isPending || !nameInput.trim()}
                      className="text-primary font-medium disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="text-on-surface-variant hover:text-on-surface"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-on-surface">{p.name}</span>
                    <button
                      onClick={() => {
                        setNameInput(p.name)
                        setEditingName(true)
                      }}
                      className="text-primary text-xs hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Email</span>
                <span className="text-on-surface text-xs">{p.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Phone</span>
                <span className="font-medium text-on-surface">{p.phone || '—'}</span>
              </div>
            </div>
          ) : null}
          <div className="mt-4 pt-4 border-t border-outline-variant">
            <button
              onClick={() => {
                // Revoke the refresh token server-side before clearing local state.
                // Best-effort — if this fails (e.g. offline), still proceed with local logout.
                const { refreshToken } = useAuthStore.getState()
                if (refreshToken) {
                  apiPost('/auth/logout', { refreshToken }).catch(() => {})
                }
                logout()
              }}
              className="w-full py-2.5 border border-status-error text-status-error text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Delivery address edit */}
        <div className="bg-white rounded-xl border border-outline-variant p-5 mb-6">
          <h2 className="font-jakarta font-semibold text-on-surface mb-4">Delivery Address</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>
                Street Address <span className="text-error">*</span>
              </label>
              <input value={form.line1} onChange={set('line1')} placeholder="42 MG Road" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Apartment / Flat (optional)</label>
              <input value={form.line2} onChange={set('line2')} placeholder="Apt 3B" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  City <span className="text-error">*</span>
                </label>
                <input value={form.city} onChange={set('city')} placeholder="Bengaluru" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>
                  Pincode <span className="text-error">*</span>
                </label>
                <input
                  value={form.pincode}
                  onChange={set('pincode')}
                  placeholder="560001"
                  maxLength={6}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>
                State <span className="text-error">*</span>
              </label>
              <input value={form.state} onChange={set('state')} placeholder="Karnataka" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Delivery Notes (optional)</label>
              <textarea
                value={form.deliveryNotes}
                onChange={set('deliveryNotes')}
                placeholder="Leave at the door"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>

            {saveErr && <p className="text-error text-sm">{saveErr}</p>}
            {saveOk && (
              <p className="text-status-active text-sm font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> Address updated!
              </p>
            )}

            <button
              type="submit"
              disabled={updateAddress.isPending}
              className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {updateAddress.isPending && <Spinner size={18} />}
              Save Address
            </button>
          </form>
        </div>
      </PageWrapper>
    </>
  )
}
