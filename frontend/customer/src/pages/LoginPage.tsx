import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, TerminalSquare } from 'lucide-react'
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

const FEATURES = ['Fresh, daily-pressed', 'Pause or skip anytime', 'Wallet-based billing']

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const isDevBuild = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV === true

  async function handleDevLogin() {
    setLoading(true)
    setError('')
    try {
      const tokenData = await apiPost<{ accessToken: string; refreshToken: string }>('/dev/token/customer')
      useAuthStore.getState().setTokens(tokenData.accessToken, tokenData.refreshToken)
      const profile = await apiGet<CustomerProfile>('/customer/me')
      setAuth(tokenData.accessToken, tokenData.refreshToken, profile.id, profile.onboardingComplete)
      navigate(profile.onboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
    } catch {
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
          shape: 'pill',
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
    <div className="min-h-dvh bg-primary flex flex-col relative overflow-hidden safe-top">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-on-primary/[0.06] pointer-events-none" />
      <div className="absolute top-40 -left-24 w-56 h-56 rounded-full bg-secondary/20 pointer-events-none" />

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-20 pb-10 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-on-primary/10 flex items-center justify-center mb-5 pop-in">
          <Droplets size={30} className="text-inverse-primary" strokeWidth={1.75} />
        </div>
        <h1 className="font-jakarta font-bold text-on-primary text-[2.75rem] leading-[1.05] mb-2 text-center">
          FreshFlow
        </h1>
        <p className="text-on-primary/75 text-base text-center max-w-[15rem]">
          Cold-pressed juice, on a schedule that fits your life
        </p>

        <div className="flex flex-col gap-2 mt-10 w-full max-w-[16rem]">
          {FEATURES.map((f, i) => (
            <div
              key={f}
              className="stagger-item flex items-center gap-2.5 px-3.5 py-2 bg-on-primary/[0.08] rounded-xl"
              style={{ '--i': i } as React.CSSProperties}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-inverse-primary shrink-0" />
              <span className="text-on-primary/90 text-sm font-medium">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="relative z-10 bg-surface-container-lowest rounded-t-[2rem] px-8 pt-9 pb-10 shadow-popover">
        <h2 className="font-jakarta font-semibold text-on-surface text-xl mb-1 text-center">Welcome back</h2>
        <p className="text-on-surface-variant text-sm text-center mb-7">Sign in with Google to continue</p>

        {error && (
          <div className="mb-4 p-3 bg-error-container rounded-xl border-l-4 border-error">
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

        {isDevBuild && (
          <div className="mt-6 pt-5 border-t border-outline-variant">
            <p className="text-[11px] text-on-surface-variant text-center mb-3 font-mono uppercase tracking-wider">
              Dev build only
            </p>
            <button
              onClick={handleDevLogin}
              disabled={loading}
              className="focus-ring w-full py-3 bg-surface-container border border-outline-variant text-on-surface-variant font-medium rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              {loading ? <Spinner size={16} /> : <TerminalSquare size={16} />}
              Dev Login (bypass Google)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
