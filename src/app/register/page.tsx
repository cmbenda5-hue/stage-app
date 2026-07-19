'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ORANGE = '#ff6b1a'

// ─── Universités / FH / TH allemandes + domaine d'email étudiant vérifié ────
// Seuls les domaines dont je suis certain sont renseignés (évite de bloquer
// de vrais étudiants avec un domaine deviné à tort). Complète cette liste
// au fur et à mesure avec les vrais domaines de chaque université.
const UNIVERSITY_DOMAINS: Record<string, string | null> = {
  'Hochschule RheinMain': 'student.hs-rm.de',
  'RWTH Aachen': null,
  'FH Aachen': null,
  'Universität Augsburg': null,
  'Hochschule Augsburg': null,
  'Freie Universität Berlin': null,
  'Humboldt-Universität zu Berlin': null,
  'Technische Universität Berlin': null,
  'Beuth Hochschule für Technik Berlin (HTW Berlin)': null,
  'Hochschule für Technik und Wirtschaft Berlin': null,
  'Universität Bielefeld': null,
  'Ruhr-Universität Bochum': null,
  'Hochschule Bochum': null,
  'Rheinische Friedrich-Wilhelms-Universität Bonn': null,
  'Hochschule Bonn-Rhein-Sieg': null,
  'Universität Bremen': null,
  'Hochschule Bremen': null,
  'Technische Universität Braunschweig': null,
  'Ostfalia Hochschule': null,
  'Technische Universität Chemnitz': null,
  'Technische Universität Darmstadt': null,
  'Hochschule Darmstadt': null,
  'Technische Universität Dortmund': null,
  'Fachhochschule Dortmund': null,
  'Technische Universität Dresden': null,
  'Hochschule für Technik und Wirtschaft Dresden': null,
  'Heinrich-Heine-Universität Düsseldorf': null,
  'Hochschule Düsseldorf': null,
  'Universität Duisburg-Essen': null,
  'Friedrich-Alexander-Universität Erlangen-Nürnberg': null,
  'Universität Erfurt': null,
  'Fachhochschule Erfurt': null,
  'Goethe-Universität Frankfurt am Main': null,
  'Frankfurt University of Applied Sciences': null,
  'Albert-Ludwigs-Universität Freiburg': null,
  'Justus-Liebig-Universität Gießen': null,
  'Technische Hochschule Mittelhessen': null,
  'Georg-August-Universität Göttingen': null,
  'HAWK Hochschule Hildesheim/Holzminden/Göttingen': null,
  'Universität Greifswald': null,
  'Universität Hamburg': null,
  'Technische Universität Hamburg': null,
  'Hochschule für Angewandte Wissenschaften Hamburg': null,
  'Gottfried Wilhelm Leibniz Universität Hannover': null,
  'Hochschule Hannover': null,
  'Ruprecht-Karls-Universität Heidelberg': null,
  'SRH Hochschule Heidelberg': null,
  'Universität Hohenheim': null,
  'Universität Jena (Friedrich-Schiller-Universität)': null,
  'Ernst-Abbe-Hochschule Jena': null,
  'Karlsruher Institut für Technologie (KIT)': null,
  'Hochschule Karlsruhe': null,
  'Universität Kassel': null,
  'Christian-Albrechts-Universität zu Kiel': null,
  'Fachhochschule Kiel': null,
  'Universität Koblenz': null,
  'Universität zu Köln': null,
  'Technische Hochschule Köln': null,
  'Universität Konstanz': null,
  'HTWG Konstanz': null,
  'Universität Leipzig': null,
  'HTWK Leipzig': null,
  'Universität zu Lübeck': null,
  'Technische Hochschule Lübeck': null,
  'Leuphana Universität Lüneburg': null,
  'Johannes Gutenberg-Universität Mainz': null,
  'Hochschule Mainz': null,
  'Universität Mannheim': null,
  'Hochschule Mannheim': null,
  'Philipps-Universität Marburg': null,
  'Technische Universität München': null,
  'Ludwig-Maximilians-Universität München': null,
  'Hochschule München': null,
  'Westfälische Wilhelms-Universität Münster': null,
  'Fachhochschule Münster': null,
  'Friedrich-Alexander-Universität Nürnberg': null,
  'Technische Hochschule Nürnberg Georg Simon Ohm': null,
  'Universität Osnabrück': null,
  'Hochschule Osnabrück': null,
  'Universität Paderborn': null,
  'Universität Potsdam': null,
  'Fachhochschule Potsdam': null,
  'Universität Regensburg': null,
  'Ostbayerische Technische Hochschule Regensburg': null,
  'Universität Rostock': null,
  'Universität des Saarlandes': null,
  'Hochschule für Technik und Wirtschaft des Saarlandes': null,
  'Universität Siegen': null,
  'Universität Stuttgart': null,
  'Hochschule für Technik Stuttgart': null,
  'Eberhard Karls Universität Tübingen': null,
  'Universität Ulm': null,
  'Technische Hochschule Ulm': null,
  'Bergische Universität Wuppertal': null,
  'Julius-Maximilians-Universität Würzburg': null,
  'Technische Hochschule Würzburg-Schweinfurt': null,
  'Bauhaus-Universität Weimar': null,
  'Technische Universität Ilmenau': null,
}

const GERMAN_UNIVERSITIES = Object.keys(UNIVERSITY_DOMAINS)

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke={ORANGE} strokeWidth="1.8" />
      <path
        d="M2 6l10 7 10-7"
        stroke={ORANGE}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TradefairLogo() {
  return (
    <span
      style={{
        fontSize: '24px',
        fontWeight: 900,
        letterSpacing: '-0.5px',
        color: ORANGE,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      tradefair
    </span>
  )
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 700,
        color: '#334155',
        marginBottom: '6px',
      }}
    >
      {children}
      {required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '12px 14px',
  fontSize: '14px',
  color: '#0f172a',
  outline: 'none',
  fontFamily: 'inherit',
  background: '#fff',
}

type Step = 'form' | 'otp'

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('form')

  const [fullName, setFullName] = useState('')
  const [university, setUniversity] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [otpCode, setOtpCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const expectedDomain = university ? UNIVERSITY_DOMAINS[university] : null

  function validateEmailDomain(value: string): string | null {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed.includes('@')) return "Merci d'entrer une adresse email valide."
    if (expectedDomain) {
      const domainOk = trimmed.endsWith(`@${expectedDomain}`)
      if (!domainOk) {
        return `Ton adresse doit se terminer par @${expectedDomain} pour ${university}.`
      }
    }
    return null
  }

  const missingRequired = !fullName.trim() || !university || !email.trim() || !password || !confirmPassword
  const passwordsMismatch = password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword
  const passwordTooShort = password.length > 0 && password.length < 8

  async function handleSubmitForm() {
    setTouched(true)
    setErrorMsg(null)
    setInfoMsg(null)

    if (missingRequired) {
      setErrorMsg("Merci de remplir tous les champs obligatoires (marqués d'un *).")
      return
    }

    const domainError = validateEmailDomain(email)
    if (domainError) {
      setErrorMsg(domainError)
      return
    }

    if (password.length < 8) {
      setErrorMsg('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            university,
          },
        },
      })

      if (error) throw error

      setStep('otp')
      setInfoMsg(`Un code de vérification a été envoyé à ${email.trim()}.`)
      startResendCooldown()
    } catch (e) {
      console.error('SIGNUP ERROR:', e)
      const message = e instanceof Error ? e.message : 'Impossible de créer le compte pour le moment.'
      setErrorMsg(message)
    } finally {
      setSubmitting(false)
    }
  }

  function startResendCooldown() {
    setResendCooldown(45)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return

    setErrorMsg(null)
    setInfoMsg(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      })

      if (error) throw error

      setInfoMsg('Un nouveau code vient de t’être envoyé.')
      startResendCooldown()
    } catch (e) {
      console.error('RESEND OTP ERROR:', e)
      setErrorMsg('Impossible de renvoyer le code pour le moment.')
    }
  }

  async function handleVerifyOtp() {
    setErrorMsg(null)
    setInfoMsg(null)

    if (!otpCode.trim() || otpCode.trim().length < 8) {
      setErrorMsg('Merci de saisir le code à 8 chiffres reçu par email.')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'signup',
      })

      if (error) throw error

      const user = data.user
      if (user) {
        // On s'assure que le profil est bien renseigné (au cas où le trigger
        // automatique de création de profil n'aurait pas encore tourné).
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            full_name: fullName.trim(),
            university,
            email: email.trim(),
          },
          { onConflict: 'id' }
        )
      }

      // On se déconnecte immédiatement après vérification pour forcer
      // l'étudiant à se connecter volontairement depuis la page login,
      // comme demandé.
      await supabase.auth.signOut()

      router.push('/login?registered=1')
    } catch (e) {
      console.error('VERIFY OTP ERROR:', e)
      const message = e instanceof Error ? e.message : 'Code invalide ou expiré.'
      setErrorMsg(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '24px 16px',
        color: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <TradefairLogo />
        </div>

        {step === 'form' && (
          <section
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              background: '#fff',
              padding: '24px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
              boxSizing: 'border-box',
            }}
          >
            <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, color: '#0f172a', textAlign: 'center' }}>
              Créer un compte étudiant
            </h1>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
              Inscription réservée aux étudiant·e·s avec une adresse email universitaire.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <FieldLabel required>Nom complet</FieldLabel>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex. Amina Benali"
                  style={{ ...inputStyle, borderColor: touched && !fullName.trim() ? '#dc2626' : '#e5e7eb' }}
                />
              </div>

              <div>
                <FieldLabel required>Université / FH / TH</FieldLabel>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer', borderColor: touched && !university ? '#dc2626' : '#e5e7eb' }}
                >
                  <option value="">Sélectionner ton établissement</option>
                  {GERMAN_UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel required>Adresse email étudiante</FieldLabel>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={expectedDomain ? `toi@${expectedDomain}` : 'toi@etudiant.exemple.de'}
                  style={{ ...inputStyle, borderColor: touched && !email.trim() ? '#dc2626' : '#e5e7eb' }}
                />
                {expectedDomain ? (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b' }}>
                    Doit se terminer par <strong>@{expectedDomain}</strong>.
                  </p>
                ) : university ? (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#b45309' }}>
                    ⚠️ Domaine non vérifié pour cet établissement — utilise bien ton adresse email universitaire.
                  </p>
                ) : null}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <FieldLabel required>Mot de passe</FieldLabel>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8 caractères min."
                    style={{ ...inputStyle, borderColor: passwordTooShort ? '#dc2626' : '#e5e7eb' }}
                  />
                </div>
                <div>
                  <FieldLabel required>Confirmer</FieldLabel>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme ton mot de passe"
                    style={{ ...inputStyle, borderColor: passwordsMismatch ? '#dc2626' : '#e5e7eb' }}
                  />
                </div>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '13px',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {infoMsg && !errorMsg && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#16a34a',
                    fontSize: '13px',
                  }}
                >
                  {infoMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitForm}
                disabled={submitting}
                style={{
                  border: 'none',
                  background: submitting ? '#ffcfa8' : ORANGE,
                  color: '#fff',
                  borderRadius: '999px',
                  padding: '13px 20px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : `0 4px 14px ${ORANGE}55`,
                  marginTop: '4px',
                }}
              >
                {submitting ? 'Envoi du code...' : 'Recevoir mon code de vérification'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Déjà un compte ? <span style={{ color: ORANGE, fontWeight: 700 }}>Se connecter</span>
              </button>
            </div>
          </section>
        )}

        {step === 'otp' && (
          <section
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              background: '#fff',
              padding: '28px 24px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setStep('form')
                setErrorMsg(null)
                setInfoMsg(null)
              }}
              aria-label="Retour"
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid #e5e7eb',
                borderRadius: '999px',
                background: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#374151',
                float: 'left',
              }}
            >
              <BackIcon />
            </button>

            <div style={{ marginTop: '8px', marginBottom: '10px' }}>
              <MailIcon />
            </div>

            <h1 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
              Vérifie ton email
            </h1>

            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
              Entre le code à 8 chiffres envoyé à<br />
              <strong>{email}</strong>
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="00000000"
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '8px',
                padding: '14px',
                marginBottom: '16px',
              }}
            />

            {errorMsg && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '13px',
                  marginBottom: '14px',
                  textAlign: 'left',
                }}
              >
                {errorMsg}
              </div>
            )}

            {infoMsg && !errorMsg && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#16a34a',
                  fontSize: '13px',
                  marginBottom: '14px',
                  textAlign: 'left',
                }}
              >
                {infoMsg}
              </div>
            )}

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={submitting}
              style={{
                width: '100%',
                border: 'none',
                background: submitting ? '#ffcfa8' : ORANGE,
                color: '#fff',
                borderRadius: '999px',
                padding: '13px 20px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : `0 4px 14px ${ORANGE}55`,
                marginBottom: '12px',
              }}
            >
              {submitting ? 'Vérification...' : 'Confirmer mon compte'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0}
              style={{
                border: 'none',
                background: 'transparent',
                color: resendCooldown > 0 ? '#94a3b8' : ORANGE,
                fontSize: '13px',
                fontWeight: 700,
                cursor: resendCooldown > 0 ? 'default' : 'pointer',
              }}
            >
              {resendCooldown > 0 ? `Renvoyer le code (${resendCooldown}s)` : 'Renvoyer le code'}
            </button>
          </section>
        )}
      </div>
    </main>
  )
}
