import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Pencil } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextField, TextAreaField } from '../components/ui/TextField'
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
      setForm((f) => ({ ...f, [field]: e.target.value }))
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
    mutationFn: () => apiPut('/customer/profile', { name: nameInput }),
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

  return (
    <>
      <TopBar title="Profile" showBack />
      <PageWrapper>
        {/* Account info */}
        <Card className="mt-4 mb-5">
          <h2 className="font-jakarta font-semibold text-on-surface mb-4">Account</h2>
          {profile.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-5 skeleton rounded" />)}
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
                      onChange={(e) => setNameInput(e.target.value)}
                      className="focus-ring bg-surface-container rounded-lg px-2.5 py-1.5 text-sm outline-none focus:bg-surface-container-high"
                      autoFocus
                    />
                    <button
                      onClick={() => updateProfile.mutate()}
                      disabled={updateProfile.isPending || !nameInput.trim()}
                      className="focus-ring text-primary font-semibold text-xs disabled:opacity-50 rounded px-1"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingName(false)} className="focus-ring text-on-surface-variant hover:text-on-surface text-xs rounded px-1">
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
                      aria-label="Edit name"
                      className="focus-ring text-primary p-1 rounded hover:bg-primary-container/50"
                    >
                      <Pencil size={13} />
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
          <div className="mt-4 pt-4 border-t border-outline-variant/70">
            <Button
              fullWidth
              variant="danger"
              onClick={() => {
                const { refreshToken } = useAuthStore.getState()
                if (refreshToken) {
                  apiPost('/auth/logout', { refreshToken }).catch(() => {})
                }
                logout()
              }}
            >
              Sign out
            </Button>
          </div>
        </Card>

        {/* Delivery address */}
        <Card className="mb-6">
          <h2 className="font-jakarta font-semibold text-on-surface mb-4">Delivery address</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField label="Street address" required value={form.line1} onChange={set('line1')} placeholder="42 MG Road" />
            <TextField label="Apartment / flat (optional)" value={form.line2} onChange={set('line2')} placeholder="Apt 3B" />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="City" required value={form.city} onChange={set('city')} placeholder="Bengaluru" />
              <TextField label="Pincode" required value={form.pincode} onChange={set('pincode')} placeholder="560001" maxLength={6} />
            </div>
            <TextField label="State" required value={form.state} onChange={set('state')} placeholder="Karnataka" />
            <TextAreaField label="Delivery notes (optional)" value={form.deliveryNotes} onChange={set('deliveryNotes')} placeholder="Leave at the door" rows={2} />

            {saveErr && <p className="text-error text-sm">{saveErr}</p>}
            {saveOk && (
              <p className="text-status-active text-sm font-medium flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Address updated!
              </p>
            )}

            <Button type="submit" fullWidth size="lg" loading={updateAddress.isPending}>
              Save address
            </Button>
          </form>
        </Card>
      </PageWrapper>
    </>
  )
}
