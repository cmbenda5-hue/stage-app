'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ORANGE = '#ff6b1a'

type StudentAuthor = {
  id: string
  full_name: string | null
  avatar_url: string | null
  university: string | null
  role: string | null
}

type SupabaseStageRow = {
  id: string
  author_id: string
  company_name: string
  city: string
  sector: string
  role: string
  created_at: string
  author: StudentAuthor | StudentAuthor[] | null
}

type StudentEntry = {
  id: string
  full_name: string | null
  avatar_url: string | null
  university: string | null
  role: string | null
  company_name: string
  city: string
  stage_role: string
  match_count: number
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function UserIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke={ORANGE} strokeWidth="1.8"/><path d="M5.5 19C6.5 15.5 9 14 12 14C15 14 17.5 15.5 18.5 19" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function LocationIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function BriefcaseIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function GraduationIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22 10L12 5 2 10l10 5 10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}

function TradefairLogo({ onClick }: { onClick?: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: onClick ? 'pointer' : 'default', display: 'inline-block', position: 'relative', userSelect: 'none', transform: hovered ? 'scale(1.03)' : 'scale(1)', transition: 'transform 0.2s ease' }}
    >
      <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px', color: ORANGE, fontFamily: 'Inter, system-ui, sans-serif' }}>tradefair</span>
      <span style={{ position: 'absolute', left: 0, bottom: -2, width: hovered ? '100%' : '0%', height: '2px', background: ORANGE, transition: 'width 0.2s ease', borderRadius: '999px' }} />
    </span>
  )
}

// ─── Inner component (utilise useSearchParams) ───────────────────────────────

function EtudiantSecteurInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const university = searchParams.get('university') ?? ''
  const query = searchParams.get('q') ?? ''

  const [students, setStudents] = useState<StudentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStudents() {
      if (!university && !query) {
        setError('Aucun critère de recherche renseigné.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // On récupère tous les stages (avec l'auteur) puis on filtre côté client :
        // - par université (profils.university) si un filtre est actif
        // - par correspondance texte sur le nom de l'étudiant, sa filière (profils.role)
        //   ou le nom de l'entreprise du stage, si une recherche libre est renseignée.
        const { data, error: fetchError } = await supabase
          .from('stages')
          .select(`
            id, author_id, company_name, city, sector, role, created_at,
            author:profiles!stages_author_id_fkey (id, full_name, avatar_url, university, role)
          `)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        const rows = (data ?? []) as SupabaseStageRow[]
        const q = query.trim().toLowerCase()
        const map = new Map<string, StudentEntry>()

        for (const row of rows) {
          const author = Array.isArray(row.author) ? row.author[0] : row.author
          if (!author) continue

          // Filtre université (si actif)
          if (university && author.university !== university) continue

          // Filtre recherche libre (si renseignée)
          if (q) {
            const nameMatch = (author.full_name ?? '').toLowerCase().includes(q)
            const filiereMatch = (author.role ?? '').toLowerCase().includes(q)
            const companyMatch = (row.company_name ?? '').toLowerCase().includes(q)
            if (!nameMatch && !filiereMatch && !companyMatch) continue
          }

          const existing = map.get(row.author_id)
          if (existing) {
            existing.match_count += 1
          } else {
            map.set(row.author_id, {
              id: author.id,
              full_name: author.full_name,
              avatar_url: author.avatar_url,
              university: author.university,
              role: author.role,
              company_name: row.company_name,
              city: row.city,
              stage_role: row.role,
              match_count: 1,
            })
          }
        }

        setStudents(Array.from(map.values()))
      } catch (e) {
        console.error('FETCH STUDENTS ERROR:', e)
        setError('Impossible de charger les étudiants correspondants.')
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [university, query, router])

  const titleParts: string[] = []
  if (university) titleParts.push(university)
  if (query) titleParts.push(`« ${query} »`)
  const title = titleParts.length > 0 ? titleParts.join(' · ') : 'Résultats'

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

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
        <div>
          <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 900, color: '#0f172a' }}>
            {title}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Étudiant·e·s correspondant à ta recherche, ayant effectué au moins un stage
          </p>
        </div>

        {/* LISTE */}
        {loading ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '22px', color: '#64748b', fontSize: '14px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
            Chargement des étudiant·e·s...
          </div>
        ) : error ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '22px', color: '#64748b', fontSize: '14px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
            {error}
          </div>
        ) : students.length === 0 ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '22px', color: '#64748b', fontSize: '14px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
            Aucun·e étudiant·e ne correspond à cette recherche.
          </div>
        ) : (
          <section style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            {students.map((student, index) => (
              <button
                key={student.id}
                type="button"
                onClick={() => router.push(`/etudiantpublic/${student.id}`)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
                  border: 'none', background: '#fff', cursor: 'pointer', textAlign: 'left',
                  borderTop: index === 0 ? 'none' : '1px solid #f1f5f9',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', background: '#ffe3d1', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {student.avatar_url ? (
                    <Image src={student.avatar_url} alt={student.full_name || 'Avatar'} fill sizes="52px" style={{ objectFit: 'cover' }} unoptimized />
                  ) : <UserIcon />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {student.full_name || 'Étudiant·e'}
                  </div>
                  <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#94a3b8' }}>
                    {student.university && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <GraduationIcon /> {student.university}
                      </span>
                    )}
                    {student.role && (
                      <span>{student.role}</span>
                    )}
                  </div>
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <BriefcaseIcon /> {student.stage_role} chez {student.company_name}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <LocationIcon /> {student.city}
                    </span>
                  </div>
                </div>
                {student.match_count > 1 && (
                  <span style={{
                    fontSize: '11px', fontWeight: 700, color: ORANGE, background: '#fff3ea', borderRadius: '999px',
                    padding: '4px 10px', flexShrink: 0, whiteSpace: 'nowrap',
                  }}>
                    {student.match_count} stages
                  </span>
                )}
              </button>
            ))}
          </section>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', padding: '4px 0 20px' }}>
          Tradefair
        </div>
      </div>
    </main>
  )
}

// ─── Page export (Suspense requis pour useSearchParams) ──────────────────────

export default function EtudiantSecteurPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: '#64748b', fontFamily: 'Inter, system-ui, sans-serif' }}>Chargement...</div>
      </main>
    }>
      <EtudiantSecteurInner />
    </Suspense>
  )
}
