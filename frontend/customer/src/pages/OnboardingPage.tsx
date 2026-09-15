import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost, getApiError } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Spinner } from '../components/ui/Spinner'

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
      setForm(f => ({ ...f, [field]: e.target.value }))
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

  const inputClass = 'w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm'
  const labelClass = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5'

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <div className="bg-primary-container px-6 pt-14 pb-8">
        <span className="material-symbols-outlined filled text-on-primary-container text-3xl mb-3 block">water_drop</span>
        <h1 className="font-jakarta font-bold text-on-primary-container text-2xl mb-1">One last step</h1>
        <p className="text-on-primary-container/70 text-sm">Set up your profile to start receiving deliveries</p>
        <div className="flex gap-2 mt-4">
          {[1, 2].map(s => (
            <div key={s} className={`h-1.5 rounded-full flex-1 transition-colors ${s <= step ? 'bg-on-primary-container' : 'bg-on-primary-container/30'}`} />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-lg mx-auto">
        {step === 1 ? (
          <>
            <h2 className="font-jakarta font-semibold text-on-surface text-lg">Contact Details</h2>
            <div>
              <label className={labelClass}>Phone Number <span className="text-error">*</span></label>
              <input value={form.phone} onChange={set('phone')} type="tel" placeholder="9876543210" maxLength={15} className={inputClass} />
            </div>
            <button type="button" onClick={() => { if (!form.phone) { setError('Phone is required'); return } setError(''); setStep(2) }}
              className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl text-sm">
              Continue
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setStep(1)} className="text-on-surface-variant">
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              <h2 className="font-jakarta font-semibold text-on-surface text-lg">Delivery Address</h2>
            </div>
            <div>
              <label className={labelClass}>Street Address <span className="text-error">*</span></label>
              <input value={form.line1} onChange={set('line1')} placeholder="42 MG Road" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Apartment / Flat (optional)</label>
              <input value={form.line2} onChange={set('line2')} placeholder="Apt 3B" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>City <span className="text-error">*</span></label>
                <input value={form.city} onChange={set('city')} placeholder="Bengaluru" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pincode <span className="text-error">*</span></label>
                <input value={form.pincode} onChange={set('pincode')} placeholder="560001" maxLength={6} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>State <span className="text-error">*</span></label>
              <input value={form.state} onChange={set('state')} placeholder="Karnataka" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Delivery Notes (optional)</label>
              <textarea value={form.deliveryNotes} onChange={set('deliveryNotes')} placeholder="Leave at the door" rows={2} className={`${inputClass} resize-none`} />
            </div>
          </>
        )}

        {error && <p className="text-error text-sm">{error}</p>}

        {step === 2 && (
          <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Spinner size={18} /> : null}
            Start Getting Deliveries
          </button>
        )}
      </form>
    </div>
  )
}
