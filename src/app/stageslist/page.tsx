'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ORANGE = '#ff6b1a'

type Stage = {
  id: string
  company_name: string
  city: string
  sector: string
  role: string
  work_mode: string
  interview_difficulty: number
  created_at: string
  report_url: string | null
}

// ─── Tradefair Logo ───────────────────────────────────────────────────────────

function TradefairLogo({ onClick }: { onClick?: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: onClick ? 'pointer' : 'default', display: 'inline-block', position: 'relative', userSelect: 'none', transform: hovered ? 'scale(1.03)' : 'scale(1)', transition: 'transform 0.2s ease' }}
    >
      <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px', color: ORANGE, fontFamily: 'Inter, system-ui, sans-serif' }}>
        tradefair
      </span>
      <span style={{ position: 'absolute', left: 0, bottom: -2, width: hovered ? '100%' : '0%', height: '2px', background: ORANGE, transition: 'width 0.2s ease', borderRadius: '999px' }} />
    </span>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function PlusIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function LocationIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function BriefcaseIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function FileCheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><polyline points="9.5 15 11 16.5 14.5 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChevronRightIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="9 6 15 12 9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function EmptyBriefcaseIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="#ffd0ad" strokeWidth="1.6"/>
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#ffd0ad" strokeWidth="1.6" strokeLinejoin="round"/>
      <line x1="3" y1="12" x2="21" y2="12" stroke="#ffd0ad" strokeWidth="1.6"/>
      <circle cx="12" cy="12" r="1.4" fill="#ffd0ad"/>
    </svg>
  )
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DifficultyBadge({ value }: { value: number }) {
  const color = value <= 3 ? '#16a34a' : value <= 6 ? '#f59e0b' : '#dc2626'
  const bg = value <= 3 ? '#f0fdf4' : value <= 6 ? '#fffbeb' : '#fef2f2'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700,
      color, background: bg, borderRadius: '999px', padding: '3px 9px',
    }}>
      Difficulté {value}/10
    </span>
  )
}

// ─── Stage card ───────────────────────────────────────────────────────────────

function StageCard({ stage, onClick }: { stage: Stage; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', textAlign: 'left', border: `1px solid ${hovered ? ORANGE : '#e5e7eb'}`,
        borderRadius: '18px', background: '#fff', padding: '16px 18px', cursor: 'pointer',
        boxShadow: hovered ? `0 6px 18px ${ORANGE}22` : '0 1px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.18s ease', display: 'flex', alignItems: 'center', gap: '14px',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px', background: '#fff3ea', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, fontWeight: 900, fontSize: '18px',
      }}>
        {stage.company_name.charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {stage.company_name}
        </div>
        <div style={{ marginTop: '3px', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><LocationIcon /> {stage.city}</span>
          <span style={{ color: '#cbd5e1' }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><BriefcaseIcon /> {stage.role}</span>
        </div>
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: ORANGE, background: '#fff3ea', borderRadius: '999px', padding: '3px 9px' }}>
            {stage.sector}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', background: '#f1f5f9', borderRadius: '999px', padding: '3px 9px' }}>
            {stage.work_mode}
          </span>
          <DifficultyBadge value={stage.interview_difficulty} />
          {stage.report_url && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', borderRadius: '999px', padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <FileCheckIcon /> Rapport
            </span>
          )}
        </div>
      </div>

      <span style={{ color: hovered ? ORANGE : '#cbd5e1', transition: 'color 0.15s ease', flexShrink: 0 }}>
        <ChevronRightIcon />
      </span>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StagesListPage() {
  const router = useRouter()
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStages() {
      setLoading(true)
      setError('')
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data, error: fetchError } = await supabase
          .from('stages')
          .select('id, company_name, city, sector, role, work_mode, interview_difficulty, created_at, report_url')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setStages((data ?? []) as Stage[])
      } catch (e) {
        console.error('FETCH STAGES ERROR:', e)
        setError('Impossible de charger ta liste de stages pour le moment.')
      } finally {
        setLoading(false)
      }
    }
    fetchStages()
  }, [router])

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* TOP BAR */}
        <div style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px',
          padding: '10px 14px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '24px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)', position: 'sticky', top: '16px', zIndex: 40,
        }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            aria-label="Retour au dashboard"
            title="Retour"
            style={{
              width: '40px', height: '40px', border: '1px solid #f1f5f9', borderRadius: '999px', background: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151',
              boxShadow: '0 1px 6px rgba(32,33,36,0.08)',
            }}
          >
            <ArrowLeftIcon />
          </button>
          <TradefairLogo onClick={() => router.push('/dashboard')} />
          <div style={{ width: '40px' }} />
        </div>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', padding: '4px 4px 0', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>Ma liste de stages</h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#64748b' }}>
              {stages.length === 0 ? 'Aucun stage enregistré pour le moment.' : `${stages.length} stage${stages.length > 1 ? 's' : ''} enregistré${stages.length > 1 ? 's' : ''}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/newstage')}
            style={{
              border: 'none', background: ORANGE, color: '#fff', borderRadius: '999px', padding: '11px 18px',
              fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 14px ${ORANGE}55`,
              display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
            }}
          >
            <PlusIcon /> Ajouter un stage
          </button>
        </div>

        {error && (
          <div style={{ fontSize: '13px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '12px 14px' }}>
            {error}
          </div>
        )}

        {/* LIST / LOADING / EMPTY */}
        {loading ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '18px', color: '#64748b', fontSize: '14px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
            Chargement de ta liste de stages...
          </div>
        ) : stages.length === 0 ? (
          <div style={{
            border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '40px 24px',
            textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '14px',
          }}>
            <EmptyBriefcaseIllustration />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Ta liste est vide</div>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b', maxWidth: '340px' }}>
                Ajoute ton premier stage pour garder une trace de ton expérience et aider les autres étudiant·e·s.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/newstage')}
              style={{
                border: 'none', background: ORANGE, color: '#fff', borderRadius: '999px', padding: '11px 20px',
                fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 14px ${ORANGE}55`,
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
            >
              <PlusIcon /> Ajouter un stage
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stages.map((stage) => (
              <StageCard
                key={stage.id}
                stage={stage}
                onClick={() => router.push(`/company?id=${stage.id}`)}
              />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', padding: '4px 0 2px' }}>
          Tradefair — Mes stages
        </div>
      </div>
    </main>
  )
}