import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, Lock, Eye, EyeOff } from 'lucide-react'
import { useAdminAuthStore } from '../store/authStore'
import { apiPost, getApiError } from '../lib/api'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated } = useAdminAuthStore()

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !password) {
      setError('All fields required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await apiPost<{ accessToken: string; refreshToken: string }>('/auth/admin/login', { phone, password })
      setAuth(data.accessToken, data.refreshToken)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-on-primary/[0.05] pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-secondary/15 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest rounded-[1.75rem] shadow-popover overflow-hidden">
        <div className="bg-primary/[0.04] px-8 py-10 text-center border-b border-outline-variant/70">
          <div className="w-14 h-14 rounded-2xl bg-primary-container mx-auto flex items-center justify-center mb-3">
            <Droplets size={26} className="text-primary" strokeWidth={1.75} />
          </div>
          <h1 className="font-jakarta font-bold text-on-surface text-2xl">FreshFlow Admin</h1>
          <p className="text-on-surface-variant text-sm mt-1">Operations Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-4">
          <TextField
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder="9876543210"
            autoFocus
          />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-1.5">Password</label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                className="focus-ring w-full h-10 px-3.5 pr-11 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 rounded"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-error-container rounded-xl border-l-4 border-error">
              <p className="text-on-error-container text-sm">{error}</p>
            </div>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
            Sign In
          </Button>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-on-surface-variant/60">
            <Lock size={13} />
            <span className="text-xs">Secure, encrypted session</span>
          </div>
        </form>
      </div>
    </div>
  )
}
