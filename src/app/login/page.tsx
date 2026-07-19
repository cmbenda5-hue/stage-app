'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ORANGE = '#ff6b1a'

// ─── Tradefair Logo (identique au dashboard) ─────────────────────────────────

function TradefairLogo({ size = 44 }: { size?: number }) {
  return (
    <span
      style={{
        fontSize: `${size}px`,
        fontWeight: 900,
        letterSpacing: '-1px',
        color: ORANGE,
        fontFamily: 'Inter, system-ui, sans-serif',
        userSelect: 'none',
      }}
    >
      tradefair
    </span>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#9aa0a6" strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="#9aa0a6" strokeWidth="1.8" />
      <path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="#9aa0a6" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="#9aa0a6" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 5.1A11.6 11.6 0 0 1 12 5c7 0 11 7 11 7a15.5 15.5 0 0 1-3.9 4.6M6.5 6.6C3.7 8.3 1 12 1 12s4 7 11 7c1.4 0 2.7-.25 3.9-.7" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 10.5a3 3 0 0 0 4 4" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(
        error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : error.message
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: '#0f172a',
      }}
    >
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .login-card { animation: fadeSlideIn 0.35s ease; }
        .tf-input::placeholder { color: #9aa0a6; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>

        {/* Big centered logo, orange on white */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <TradefairLogo size={52} />
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: 500, textAlign: 'center' }}>
            Le réseau des étudiant·e·s et de leurs stages
          </p>
        </div>

        {/* Card */}
        <div
          className="login-card"
          style={{
            width: '100%',
            border: '1px solid #f1f5f9',
            borderRadius: '24px',
            background: '#ffffff',
            padding: '28px 26px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
            boxSizing: 'border-box',
          }}
        >
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            Connexion
          </h1>
          <p style={{ margin: '0 0 22px', fontSize: '13px', color: '#64748b' }}>
            Content de te revoir. Connecte-toi pour continuer.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Email */}
            <div
              style={{
                border: `1px solid ${emailFocused ? ORANGE : '#dfe1e5'}`,
                borderRadius: '14px',
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '48px',
                boxShadow: emailFocused ? `0 0 0 3px ${ORANGE}1a` : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <MailIcon />
              <input
                className="tf-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="Adresse email"
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', background: 'transparent', height: '100%', color: '#0f172a', fontFamily: 'inherit' }}
              />
            </div>

            {/* Password */}
            <div
              style={{
                border: `1px solid ${passwordFocused ? ORANGE : '#dfe1e5'}`,
                borderRadius: '14px',
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '48px',
                boxShadow: passwordFocused ? `0 0 0 3px ${ORANGE}1a` : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <LockIcon />
              <input
                className="tf-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Mot de passe"
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', background: 'transparent', height: '100%', color: '#0f172a', fontFamily: 'inherit' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {message && (
              <div
                style={{
                  fontSize: '13px',
                  color: '#dc2626',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '10px 12px',
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                border: 'none',
                background: loading ? '#ffcfa8' : ORANGE,
                color: '#fff',
                borderRadius: '999px',
                padding: '13px 18px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : `0 4px 14px ${ORANGE}55`,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                marginTop: '4px',
              }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Register link */}
        <div
          style={{
            width: '100%',
            border: '1px solid #f1f5f9',
            borderRadius: '20px',
            background: '#fff',
            padding: '16px 20px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#334155',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          }}
        >
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={() => router.push('/register')}
            style={{
              border: 'none',
              background: 'transparent',
              color: ORANGE,
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '14px',
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            Inscris-toi
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Tradefair — connecte-toi à ton avenir</div>
      </div>
    </main>
  )
}