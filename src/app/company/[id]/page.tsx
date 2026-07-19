'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ORANGE = '#ff6b1a'

type StageAuthor = {
  id: string
  full_name: string | null
  avatar_url: string | null
  university: string | null
  role: string | null
}

type Stage = {
  id: string
  author_id: string
  company_name: string
  city: string
  sector: string
  role: string
  work_mode: string
  interview_difficulty: number
  interview_questions: string | null
  salary: string | null
  hours: string | null
  atmosphere: string | null
  technologies: string | null
  real_missions: string | null
  before_arriving: string | null
  mistakes_to_avoid: string | null
  report_url: string | null
  report_name: string | null
  created_at: string
  author: StageAuthor
}

type SupabaseStageRow = Omit<Stage, 'author'> & {
  author:
    | StageAuthor
    | StageAuthor[]
    | null
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
function LocationIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function BriefcaseIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function DownloadIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function FileIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}
function TrashIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function UserIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke={ORANGE} strokeWidth="1.8"/><path d="M5.5 19C6.5 15.5 9 14 12 14C15 14 17.5 15.5 18.5 19" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/></svg>
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DifficultyBadge({ value }: { value: number }) {
  const color = value <= 3 ? '#16a34a' : value <= 6 ? '#f59e0b' : '#dc2626'
  const bg = value <= 3 ? '#f0fdf4' : value <= 6 ? '#fffbeb' : '#fef2f2'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 800,
      color, background: bg, borderRadius: '999px', padding: '5px 12px',
    }}>
      Difficulté d&apos;entretien : {value}/10
    </span>
  )
}

// ─── Info block (only renders if content exists) ─────────────────────────────

function InfoBlock({ title, content }: { title: string; content: string | null }) {
  if (!content) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap' }}>{content}</p>
    </div>
  )
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

// ─── Author avatar (next/image, pas de <img> brut) ───────────────────────────

function AuthorAvatar({ avatarUrl, fullName }: { avatarUrl: string | null; fullName: string | null }) {
  return (
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#ffe3d1', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={fullName || 'Avatar'}
          fill
          sizes="32px"
          style={{ objectFit: 'cover' }}
          unoptimized
        />
      ) : (
        <UserIcon />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StageDetailPage() {
  const router = useRouter()
  const params = useParams()
  const stageId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : null

  const [stage, setStage] = useState<Stage | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchStage() {
      if (!stageId) { setError('Aucun stage sélectionné.'); setLoading(false); return }
      setLoading(true)
      setError('')
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setCurrentUserId(user.id)

        // Pas de filtre sur author_id : la policy "stages_select_all" autorise
        // tout utilisateur connecté à consulter n'importe quel stage.
        const { data, error: fetchError } = await supabase
          .from('stages')
          .select(`
            id, author_id, company_name, city, sector, role, work_mode,
            interview_difficulty, interview_questions, salary, hours, atmosphere,
            technologies, real_missions, before_arriving, mistakes_to_avoid,
            report_url, report_name, created_at,
            author:profiles!stages_author_id_fkey (id, full_name, avatar_url, university, role)
          `)
          .eq('id', stageId)
          .single()

        if (fetchError) throw fetchError

        const row = data as SupabaseStageRow
        const normalized: Stage = {
          ...row,
          author: Array.isArray(row.author)
            ? (row.author[0] ?? { id: '', full_name: null, avatar_url: null, university: null, role: null })
            : (row.author ?? { id: '', full_name: null, avatar_url: null, university: null, role: null }),
        }
        setStage(normalized)
      } catch (e) {
        console.error('FETCH STAGE ERROR:', e)
        setError('Impossible de trouver ce stage.')
      } finally {
        setLoading(false)
      }
    }
    fetchStage()
  }, [stageId, router])

  function goToAuthorProfile() {
    if (!stage) return
    if (stage.author_id === currentUserId) {
      router.push('/dashboard')
    } else {
      router.push(`/etudiantpublic/${stage.author_id}`)
    }
  }

  async function handleDownloadReport() {
    if (!stage?.report_url) return
    setIsDownloading(true)
    try {
      const res = await fetch(stage.report_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = stage.report_name || 'rapport-de-stage'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('DOWNLOAD ERROR:', e)
      alert('Téléchargement impossible.')
    } finally {
      setIsDownloading(false)
    }
  }

  async function handleDelete() {
    if (!stage) return
    if (!window.confirm(`Supprimer le stage chez ${stage.company_name} ?`)) return
    setIsDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { error: deleteError } = await supabase
        .from('stages')
        .delete()
        .eq('id', stage.id)
        .eq('author_id', user.id)

      if (deleteError) throw deleteError
      router.push('/stageslist')
    } catch (e) {
      console.error('DELETE STAGE ERROR:', e)
      alert('Impossible de supprimer ce stage pour le moment.')
      setIsDeleting(false)
    }
  }

  const isOwner = !!stage && !!currentUserId && stage.author_id === currentUserId

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '18px 22px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', fontSize: '14px', color: '#64748b' }}>
          Chargement du stage...
        </div>
      </main>
    )
  }

  if (error || !stage) {
    return (
      <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '28px', textAlign: 'center',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)', maxWidth: '380px',
        }}>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b' }}>{error || 'Stage introuvable.'}</p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{ border: 'none', background: ORANGE, color: '#fff', borderRadius: '999px', padding: '11px 20px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
          >
            Retour au tableau de bord
          </button>
        </div>
      </main>
    )
  }

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
            onClick={() => router.back()}
            aria-label="Retour"
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

        {/* AUTEUR DU STAGE */}
        <button
          type="button"
          onClick={goToAuthorProfile}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e5e7eb', borderRadius: '999px',
            background: '#fff', padding: '8px 14px 8px 8px', cursor: 'pointer', alignSelf: 'flex-start',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <AuthorAvatar avatarUrl={stage.author.avatar_url} fullName={stage.author.full_name} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
            Publié par {stage.author.full_name || 'Étudiant·e'}
          </span>
        </button>

        {/* HEADER — company summary card */}
        <section style={{
          width: '100%', border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff',
          padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '16px', background: '#fff3ea', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, fontWeight: 900, fontSize: '22px',
            }}>
              {stage.company_name.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 900, color: '#0f172a' }}>{stage.company_name}</h1>
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><LocationIcon /> {stage.city}</span>
                <span style={{ color: '#cbd5e1' }}>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><BriefcaseIcon /> {stage.role}</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: ORANGE, background: '#fff3ea', borderRadius: '999px', padding: '4px 10px' }}>
                  {stage.sector}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', background: '#f1f5f9', borderRadius: '999px', padding: '4px 10px' }}>
                  {stage.work_mode}
                </span>
              </div>
            </div>

            {/* Le bouton supprimer n'apparaît que pour le propriétaire du stage */}
            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Supprimer ce stage"
                title="Supprimer ce stage"
                style={{
                  border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: '999px',
                  width: '38px', height: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.6 : 1, flexShrink: 0,
                }}
              >
                <TrashIcon />
              </button>
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            <DifficultyBadge value={stage.interview_difficulty} />
          </div>
        </section>

        {/* REPORT DOWNLOAD — visible pour tout le monde si un rapport existe */}
        {stage.report_url && (
          <section style={{
            width: '100%', border: '1px solid #ffd0ad', borderRadius: '18px', background: '#fff8f3',
            padding: '16px 20px', boxSizing: 'border-box', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px', background: '#fff', color: ORANGE,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #ffd0ad',
              }}>
                <FileIcon />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Rapport de stage</div>
                <div style={{ fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {stage.report_name || 'Fichier disponible'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={isDownloading}
              style={{
                border: 'none', background: ORANGE, color: '#fff', borderRadius: '999px', padding: '10px 18px',
                fontSize: '13px', fontWeight: 800, cursor: isDownloading ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                boxShadow: `0 4px 14px ${ORANGE}55`, opacity: isDownloading ? 0.7 : 1,
              }}
            >
              <DownloadIcon /> {isDownloading ? 'Téléchargement...' : 'Télécharger'}
            </button>
          </section>
        )}

        {/* DETAILS */}
        <Section title="Entretien d'embauche">
          <InfoBlock title="Questions posées" content={stage.interview_questions} />
          {!stage.interview_questions && (
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Aucune question renseignée.</p>
          )}
        </Section>

        <Section title="Conditions du stage">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {stage.salary && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Salaire / gratification</div>
                <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{stage.salary}</div>
              </div>
            )}
            {stage.hours && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Horaires</div>
                <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{stage.hours}</div>
              </div>
            )}
          </div>
          <InfoBlock title="Ambiance dans l'entreprise" content={stage.atmosphere} />
          <InfoBlock title="Technologies / outils utilisés" content={stage.technologies} />
        </Section>

        <Section title="Retour d'expérience">
          <InfoBlock title="Missions réelles" content={stage.real_missions} />
          <InfoBlock title="Ce qu'il faut savoir avant d'arriver" content={stage.before_arriving} />
          <InfoBlock title="Erreurs à éviter" content={stage.mistakes_to_avoid} />
        </Section>

        <div style={{ display: 'flex', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', padding: '4px 0 20px' }}>
          Tradefair — {stage.company_name}
        </div>
      </div>
    </main>
  )
}
