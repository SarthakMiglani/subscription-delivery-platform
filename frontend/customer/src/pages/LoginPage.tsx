import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { apiPost, apiGet, getApiError } from '../lib/api'
import { Spinner } from '../components/ui/Spinner'
import { GOOGLE_CLIENT_ID } from '../lib/constants'
import type { CustomerProfile } from '../types'

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: { credential: string }) => void }) => void
          renderButton: (el: HTMLElement, opts: object) => void
          prompt: () => void
        }
      }
    }
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  async function handleDevLogin() {
    setLoading(true)
    setError('')
    try {
      const tokenData = await apiPost<{ accessToken: string; refreshToken: string }>('/dev/token/customer')
      // Temporarily store tokens to fetch profile
      useAuthStore.getState().setTokens(tokenData.accessToken, tokenData.refreshToken)
      const profile = await apiGet<CustomerProfile>('/customer/me')
      setAuth(tokenData.accessToken, tokenData.refreshToken, profile.id, profile.onboardingComplete)
      navigate(profile.onboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
    } catch (e) {
      setError('Dev login failed — is backend running with --spring.profiles.active=dev?')
    } finally {
      setLoading(false)
    }
  }

  async function handleCredential(credential: string) {
    setLoading(true)
    setError('')
    try {
      const data = await apiPost<{
        accessToken: string
        refreshToken: string
        customerId: string
        onboardingComplete: boolean
      }>('/auth/customer/google', { idToken: credential })
      setAuth(data.accessToken, data.refreshToken, data.customerId, data.onboardingComplete)
      navigate(data.onboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
    } catch (e) {
      setError(getApiError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const clientId = GOOGLE_CLIENT_ID

    function init() {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => handleCredential(r.credential),
      })
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 280,
          logo_alignment: 'left',
        })
      }
    }

    if (window.google?.accounts?.id) {
      init()
    } else {
      const script = document.querySelector('script[src*="accounts.google.com"]')
      script?.addEventListener('load', init)
    }
  }, [])

  return (
    <div className="min-h-dvh bg-gradient-to-br from-primary-container to-primary flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        <div className="mb-8 text-center">
          <span className="material-symbols-outlined filled text-on-primary-container text-6xl mb-4 block">water_drop</span>
          <h1 className="font-jakarta font-bold text-on-primary-container text-4xl leading-tight mb-2">FreshFlow</h1>
          <p className="text-on-primary-container/70 text-lg">Daily fresh juice, delivered to your door</p>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {['Fresh Daily', 'Flexible Plans', 'Wallet Powered'].map(f => (
            <span key={f} className="px-3 py-1 bg-white/20 text-on-primary-container rounded-full text-sm font-medium">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom card */}
      <div className="bg-white rounded-t-3xl px-8 py-10 shadow-2xl">
        <h2 className="font-jakarta font-semibold text-on-surface text-xl mb-1 text-center">Get started</h2>
        <p className="text-on-surface-variant text-sm text-center mb-8">Sign in with your Google account</p>

        {error && (
          <div className="mb-4 p-3 bg-error-container rounded-lg border-l-4 border-error">
            <p className="text-on-error-container text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-3">
            <Spinner size={28} />
          </div>
        ) : (
          <div className="flex justify-center">
            <div ref={buttonRef} />
          </div>
        )}

        <p className="text-xs text-on-surface-variant text-center mt-6 leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>

        {/* Dev bypass — remove before production */}
        <div className="mt-6 pt-5 border-t border-outline-variant">
          <p className="text-xs text-on-surface-variant text-center mb-3 font-mono">⚙ DEV MODE</p>
          <button
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full py-3 bg-surface-container border border-outline-variant text-on-surface-variant font-medium rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            {loading ? <Spinner size={16} /> : <span className="material-symbols-outlined text-[16px]">developer_mode</span>}
            Dev Login (bypass Google)
          </button>
        </div>
      </div>
    </div>
  )
}
