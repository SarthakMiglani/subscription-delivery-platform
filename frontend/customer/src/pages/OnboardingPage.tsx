import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, ArrowLeft } from 'lucide-react'
import { apiPost, getApiError } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { TextField, TextAreaField } from '../components/ui/TextField'

interface FormData {
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  deliveryNotes: string
}

const INITIAL: FormData = { phone: '', line1: '', line2: '', city: '', state: '', pincode: '', deliveryNotes: '' }

export function OnboardingPage() {
  const navigate = useNavigate()
  const { setOnboardingComplete } = useAuthStore()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.phone || !form.line1 || !form.city || !form.state || !form.pincode) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await apiPost('/onboarding', {
        phone: form.phone,
        address: {
          line1: form.line1,
          line2: form.line2 || undefined,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          deliveryNotes: form.deliveryNotes || undefined,
        },
      })
      setOnboardingComplete(true)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError(getApiError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <div className="bg-primary px-6 pt-16 pb-9 safe-top relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-on-primary/[0.06] pointer-events-none" />
        <div className="relative z-10">
          <div className="w-11 h-11 rounded-xl bg-on-primary/10 flex items-center justify-center mb-4">
            <Droplets size={22} className="text-inverse-primary" strokeWidth={1.75} />
          </div>
          <h1 className="font-jakarta font-bold text-on-primary text-2xl mb-1">One last step</h1>
          <p className="text-on-primary/70 text-sm">Set up your profile to start receiving deliveries</p>
          <div className="flex gap-2 mt-5">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${
                  s <= step ? 'bg-inverse-primary' : 'bg-on-primary/25'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="page-enter p-6 space-y-5 max-w-lg mx-auto -mt-4">
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5 space-y-5">
          {step === 1 ? (
            <>
              <h2 className="font-jakarta font-semibold text-on-surface text-lg">Contact details</h2>
              <TextField
                label="Phone number"
                required
                value={form.phone}
                onChange={set('phone')}
                type="tel"
                placeholder="9876543210"
                maxLength={15}
              />
              <Button
                type="button"
                fullWidth
                size="lg"
                onClick={() => {
                  if (!form.phone) {
                    setError('Phone is required')
                    return
                  }
                  setError('')
                  setStep(2)
                }}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  aria-label="Back to contact details"
                  className="focus-ring text-on-surface-variant p-1 rounded-lg hover:bg-surface-container-low"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="font-jakarta font-semibold text-on-surface text-lg">Delivery address</h2>
              </div>
              <TextField label="Street address" required value={form.line1} onChange={set('line1')} placeholder="42 MG Road" />
              <TextField label="Apartment / flat (optional)" value={form.line2} onChange={set('line2')} placeholder="Apt 3B" />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="City" required value={form.city} onChange={set('city')} placeholder="Bengaluru" />
                <TextField label="Pincode" required value={form.pincode} onChange={set('pincode')} placeholder="560001" maxLength={6} />
              </div>
              <TextField label="State" required value={form.state} onChange={set('state')} placeholder="Karnataka" />
              <TextAreaField
                label="Delivery notes (optional)"
                value={form.deliveryNotes}
                onChange={set('deliveryNotes')}
                placeholder="Leave at the door"
                rows={2}
              />
            </>
          )}

          {error && <p className="text-error text-sm">{error}</p>}

          {step === 2 && (
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Start getting deliveries
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
