import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '../store/authStore'
import { apiPost, getApiError } from '../lib/api'
import { Spinner } from '../components/ui/Spinner'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated } = useAdminAuthStore()

  // Redirect to dashboard if already authenticated (e.g. mock mode or returning session)
  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !password) { setError('All fields required'); return }
    setLoading(true); setError('')
    try {
      const data = await apiPost<{ accessToken: string; refreshToken: string }>('/auth/admin/login', { phone, password })
      setAuth(data.accessToken, data.refreshToken)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getApiError(err))
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full border border-outline-variant rounded-lg px-4 py-3 text-on-surface bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-container to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-primary-container px-8 py-10 text-center">
          <span className="material-symbols-outlined filled text-on-primary-container text-5xl mb-3 block">water_drop</span>
          <h1 className="font-jakarta font-bold text-on-primary-container text-2xl">FreshFlow Admin</h1>
          <p className="text-on-primary-container/70 text-sm mt-1">Operations Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="9876543210" className={inputCls} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="••••••••" className={`${inputCls} pr-12`} />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-error-container rounded-lg border-l-4 border-error">
              <p className="text-on-error-container text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
            {loading && <Spinner size={18} />}
            Sign In
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-[15px]">lock</span>
            <span className="text-xs">Secure AES-256 Encrypted Session</span>
          </div>
        </form>
      </div>
    </div>
  )
}
