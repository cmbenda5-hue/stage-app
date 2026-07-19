'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ORANGE = '#ff6b1a'

const SECTORS = [
  'Informatique', 'Finance', 'Marketing', 'Ressources humaines', 'Ingénierie',
  'Santé', 'Éducation', 'Commerce', 'Tourisme', 'Juridique',
  'Communication', 'Logistique', 'Architecture', 'Médias', 'Immobilier', 'Industrie',
]

const WORK_MODES = ['Présentiel', 'Télétravail', 'Hybride']

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function UploadIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function FileIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
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
  padding: '11px 14px',
  fontSize: '14px',
  color: '#0f172a',
  outline: 'none',
  fontFamily: 'inherit',
  background: '#fff',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '90px',
  resize: 'vertical',
  lineHeight: 1.5,
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      width: '100%', border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff',
      padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
      <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{title}</h2>
      {children}
    </section>
  )
}

export default function NewStagePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [companyName, setCompanyName] = useState('')
  const [city, setCity] = useState('')
  const [sector, setSector] = useState('')
  const [role, setRole] = useState('')
  const [workMode, setWorkMode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [interviewDifficulty, setInterviewDifficulty] = useState(5)
  const [interviewQuestions, setInterviewQuestions] = useState('')

  const [salary, setSalary] = useState('')
  const [hours, setHours] = useState('')
  const [atmosphere, setAtmosphere] = useState('')
  const [technologies, setTechnologies] = useState('')

  const [realMissions, setRealMissions] = useState('')
  const [beforeArriving, setBeforeArriving] = useState('')
  const [mistakesToAvoid, setMistakesToAvoid] = useState('')

  const [reportFile, setReportFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [touched, setTouched] = useState(false)

  const missingRequired = !companyName.trim() || !city.trim() || !sector || !role.trim() || !workMode

  async function handleSubmit() {
    setTouched(true)
    setErrorMsg(null)

    if (missingRequired) {
      setErrorMsg("Merci de remplir tous les champs obligatoires (marqués d'un *).")
      return
    }
    if (startDate && endDate && startDate > endDate) {
      setErrorMsg("La date de fin doit être postérieure à la date de début.")
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      let reportUrl: string | null = null
      let reportName: string | null = null
      if (reportFile) {
        const safeName = `${Date.now()}-${reportFile.name}`.replace(/\s+/g, '-')
        const path = `stage-reports/${user.id}/${safeName}`
        const { error: uploadError } = await supabase.storage.from('media').upload(path, reportFile, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('media').getPublicUrl(path)
        reportUrl = data.publicUrl
        reportName = reportFile.name
      }

      const payload = {
        author_id: user.id,
        company_name: companyName.trim(),
        city: city.trim(),
        sector,
        role: role.trim(),
        work_mode: workMode,
        start_date: startDate || null,
        end_date: endDate || null,
        interview_difficulty: interviewDifficulty,
        interview_questions: interviewQuestions.trim() || null,
        salary: salary.trim() || null,
        hours: hours.trim() || null,
        atmosphere: atmosphere.trim() || null,
        technologies: technologies.trim() || null,
        real_missions: realMissions.trim() || null,
        before_arriving: beforeArriving.trim() || null,
        mistakes_to_avoid: mistakesToAvoid.trim() || null,
        report_url: reportUrl,
        report_name: reportName,
      }

      const { error } = await supabase.from('stages').insert(payload)
      if (error) throw error

      router.push('/stageslist')
    } catch (e) {
      console.error('CREATE STAGE ERROR:', e)
      setErrorMsg("Impossible d'enregistrer ce stage pour le moment.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            aria-label="Retour au dashboard"
            title="Retour"
            style={{
              width: '38px', height: '38px', border: '1px solid #e5e7eb', borderRadius: '999px', background: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151',
            }}
          >
            <BackIcon />
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Ajouter un stage</h1>
        </div>

        {/* INFOS PRINCIPALES */}
        <Section title="Informations générales">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <FieldLabel required>Nom de l&apos;entreprise</FieldLabel>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex. Siemens" style={{ ...inputStyle, borderColor: touched && !companyName.trim() ? '#dc2626' : '#e5e7eb' }} />
            </div>
            <div>
              <FieldLabel required>Ville</FieldLabel>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Ex. Wiesbaden" style={{ ...inputStyle, borderColor: touched && !city.trim() ? '#dc2626' : '#e5e7eb' }} />
            </div>
            <div>
              <FieldLabel required>Secteur</FieldLabel>
              <select value={sector} onChange={(e) => setSector(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', borderColor: touched && !sector ? '#dc2626' : '#e5e7eb' }}>
                <option value="">Sélectionner un secteur</option>
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel required>Poste occupé</FieldLabel>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)}
                placeholder="Ex. Développeur Frontend" style={{ ...inputStyle, borderColor: touched && !role.trim() ? '#dc2626' : '#e5e7eb' }} />
            </div>
            <div>
              <FieldLabel required>Mode de travail</FieldLabel>
              <select value={workMode} onChange={(e) => setWorkMode(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', borderColor: touched && !workMode ? '#dc2626' : '#e5e7eb' }}>
                <option value="">Sélectionner un mode</option>
                {WORK_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <FieldLabel>Date de début</FieldLabel>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} />
            </div>
            <div>
              <FieldLabel>Date de fin</FieldLabel>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            Renseigner les dates active le badge &quot;🟢 En stage&quot; sur ton profil pendant la période de ton stage, et te met en relation avec les étudiants qui font le même stage au même moment.
          </p>
        </Section>

        {/* ENTRETIEN */}
        <Section title="Entretien d'embauche">
          <div>
            <FieldLabel>Difficulté de l&apos;entretien : {interviewDifficulty}/10</FieldLabel>
            <input
              type="range" min={1} max={10} value={interviewDifficulty}
              onChange={(e) => setInterviewDifficulty(Number(e.target.value))}
              style={{ width: '100%', accentColor: ORANGE }}
            />
          </div>
          <div>
            <FieldLabel>Questions posées</FieldLabel>
            <textarea value={interviewQuestions} onChange={(e) => setInterviewQuestions(e.target.value)}
              placeholder="Quelles questions t'ont été posées pendant l'entretien ?" style={textareaStyle} />
          </div>
        </Section>

        {/* CONDITIONS */}
        <Section title="Conditions du stage">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <FieldLabel>Salaire / gratification</FieldLabel>
              <input type="text" value={salary} onChange={(e) => setSalary(e.target.value)}
                placeholder="Ex. 850€/mois" style={inputStyle} />
            </div>
            <div>
              <FieldLabel>Horaires</FieldLabel>
              <input type="text" value={hours} onChange={(e) => setHours(e.target.value)}
                placeholder="Ex. 9h-17h, lundi-vendredi" style={inputStyle} />
            </div>
          </div>
          <div>
            <FieldLabel>Ambiance dans l&apos;entreprise</FieldLabel>
            <textarea value={atmosphere} onChange={(e) => setAtmosphere(e.target.value)}
              placeholder="Décris l'ambiance générale, l'esprit d'équipe..." style={textareaStyle} />
          </div>
          <div>
            <FieldLabel>Technologies / outils utilisés</FieldLabel>
            <textarea value={technologies} onChange={(e) => setTechnologies(e.target.value)}
              placeholder="Ex. React, Figma, SAP..." style={textareaStyle} />
          </div>
        </Section>

        {/* RETOUR D'EXPERIENCE */}
        <Section title="Retour d'expérience">
          <div>
            <FieldLabel>Missions réelles</FieldLabel>
            <textarea value={realMissions} onChange={(e) => setRealMissions(e.target.value)}
              placeholder="Qu'as-tu fait concrètement pendant ce stage ?" style={textareaStyle} />
          </div>
          <div>
            <FieldLabel>Ce qu&apos;il faut savoir avant d&apos;arriver</FieldLabel>
            <textarea value={beforeArriving} onChange={(e) => setBeforeArriving(e.target.value)}
              placeholder="Conseils pour les futurs stagiaires..." style={textareaStyle} />
          </div>
          <div>
            <FieldLabel>Erreurs à éviter</FieldLabel>
            <textarea value={mistakesToAvoid} onChange={(e) => setMistakesToAvoid(e.target.value)}
              placeholder="Qu'aurais-tu fait différemment ?" style={textareaStyle} />
          </div>
        </Section>

        {/* RAPPORT DE STAGE */}
        <Section title="Rapport de stage (optionnel)">
          {reportFile ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <FileIcon />
                <span style={{ fontSize: '13px', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reportFile.name}</span>
              </div>
              <button type="button" onClick={() => { setReportFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                style={{ border: 'none', background: 'transparent', color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Retirer
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                border: '1.5px dashed #cbd5e1', borderRadius: '14px', padding: '22px', cursor: 'pointer',
                background: '#f8fafc', color: '#64748b', fontSize: '13px', fontWeight: 600,
              }}
            >
              <UploadIcon /> Importer ton rapport de stage (PDF, Word...)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setReportFile(f) }}
          />
        </Section>

        {errorMsg && (
          <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingBottom: '20px' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            disabled={saving}
            style={{
              border: '1px solid #e5e7eb', background: '#fff', color: '#374151', borderRadius: '999px',
              padding: '11px 20px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              border: 'none', background: saving ? '#ffcfa8' : ORANGE, color: '#fff', borderRadius: '999px',
              padding: '11px 22px', fontSize: '14px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : `0 4px 14px ${ORANGE}55`,
            }}
          >
            {saving ? 'Enregistrement...' : 'Publier le stage'}
          </button>
        </div>
      </div>
    </main>
  )
}
