'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ORANGE = '#ff6b1a'

type PostCategory = 'vente' | 'location' | 'job' | 'colocation' | 'groupe_etude'

const MARKETPLACE_CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'vente', label: 'Vente' },
  { value: 'location', label: 'Location / Logement' },
  { value: 'job', label: "Recherche d'emploi" },
  { value: 'colocation', label: 'Colocation' },
  { value: 'groupe_etude', label: "Groupe d'études" },
]

const CATEGORY_LABELS: Record<string, string> = MARKETPLACE_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }), {} as Record<string, string>
)

type PostAttachment = {
  id: string
  type: 'image' | 'video' | 'video_embed' | 'pdf' | 'document' | 'link' | 'other'
  url: string
  name?: string | null
}

type PostAuthor = {
  id: string
  full_name: string | null
  avatar_url: string | null
  university: string | null
  role: string | null
}

type Post = {
  id: string
  author_id: string
  author: PostAuthor
  content: string
  created_at: string
  category: PostCategory
  attachments: PostAttachment[]
}

type SupabasePostRow = {
  id: string
  author_id: string
  content: string | null
  created_at: string
  attachments: PostAttachment[] | null
  category: string | null
  author:
    | { id: string; full_name: string | null; avatar_url: string | null; university: string | null; role: string | null }
    | { id: string; full_name: string | null; avatar_url: string | null; university: string | null; role: string | null }[]
    | null
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function UserIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke={ORANGE} strokeWidth="1.8"/><path d="M5.5 19C6.5 15.5 9 14 12 14C15 14 17.5 15.5 18.5 19" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/></svg>
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

function Avatar({ src, size = 44, name }: { src?: string | null; size?: number; name?: string | null }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: '#ffe3d1', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src ? (
        <Image src={src} alt={name || 'Avatar'} fill sizes={`${size}px`} style={{ objectFit: 'cover' }} unoptimized />
      ) : (
        <UserIcon />
      )}
    </div>
  )
}

function CategoryTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${active ? ORANGE : '#e5e7eb'}`,
        background: active ? ORANGE : '#fff',
        color: active ? '#fff' : '#374151',
        borderRadius: '999px', padding: '8px 16px', fontSize: '13px', fontWeight: 700,
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}

// ─── Inner component (utilise useSearchParams) ───────────────────────────────

function MarketplaceInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as PostCategory | null

  const [activeCategory, setActiveCategory] = useState<PostCategory | 'all'>(initialCategory ?? 'all')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMarketplacePosts() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setCurrentUserId(user.id)

        let queryBuilder = supabase
          .from('posts')
          .select(`
            id, author_id, content, created_at, attachments, category,
            author:profiles!posts_author_id_fkey (id, full_name, avatar_url, university, role)
          `)
          .not('category', 'is', null)
          .order('created_at', { ascending: false })

        if (activeCategory !== 'all') {
          queryBuilder = queryBuilder.eq('category', activeCategory)
        }

        const { data, error } = await queryBuilder
        if (error) { setPosts([]); return }

        const rows = (data ?? []) as SupabasePostRow[]
        const normalized: Post[] = rows
          .filter(item => !!item.category)
          .map(item => ({
            id: item.id, author_id: item.author_id, content: item.content ?? '',
            created_at: item.created_at,
            category: item.category as PostCategory,
            attachments: Array.isArray(item.attachments) ? item.attachments : [],
            author: {
              id: Array.isArray(item.author) ? item.author[0]?.id ?? '' : item.author?.id ?? '',
              full_name: Array.isArray(item.author) ? item.author[0]?.full_name ?? null : item.author?.full_name ?? null,
              avatar_url: Array.isArray(item.author) ? item.author[0]?.avatar_url ?? null : item.author?.avatar_url ?? null,
              university: Array.isArray(item.author) ? item.author[0]?.university ?? null : item.author?.university ?? null,
              role: Array.isArray(item.author) ? item.author[0]?.role ?? null : item.author?.role ?? null,
            },
          }))
        setPosts(normalized)
      } catch (e) {
        console.error('FETCH MARKETPLACE ERROR:', e)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    fetchMarketplacePosts()
  }, [activeCategory, router])

  function goToAuthorProfile(authorId: string) {
    if (!authorId) return
    if (authorId === currentUserId) router.push('/dashboard')
    else router.push(`/etudiantpublic/${authorId}`)
  }

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
          <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 900, color: '#0f172a' }}>Marketplace étudiante</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Vente, location, colocation, jobs et groupes d&apos;études — entre étudiant·e·s vérifié·e·s
          </p>
        </div>

        {/* CATEGORY TABS */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          <CategoryTab label="Tout" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
          {MARKETPLACE_CATEGORIES.map((c) => (
            <CategoryTab key={c.value} label={c.label} active={activeCategory === c.value} onClick={() => setActiveCategory(c.value)} />
          ))}
        </div>

        {/* FEED */}
        <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '18px', color: '#64748b', fontSize: '14px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              Chargement des annonces...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '22px', color: '#64748b', fontSize: '14px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              Aucune annonce dans cette catégorie pour le moment.
            </div>
          ) : posts.map((post) => (
            <article key={post.id} style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '14px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <button type="button" onClick={() => goToAuthorProfile(post.author_id)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                  <Avatar src={post.author.avatar_url} name={post.author.full_name} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                    <button type="button" onClick={() => goToAuthorProfile(post.author_id)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      {post.author.full_name || 'Étudiant·e'}
                    </button>
                    <span style={{ color: '#94a3b8' }}>·</span>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>{timeAgo(post.created_at)}</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: ORANGE, background: '#fff3ea', borderRadius: '999px', padding: '2px 9px' }}>
                      {CATEGORY_LABELS[post.category]}
                    </span>
                  </div>
                  <div style={{ marginTop: '2px', fontSize: '12px', color: '#64748b' }}>
                    {post.author.university || post.author.role || 'Étudiant·e vérifié·e'}
                  </div>

                  {post.content && (
                    <p style={{ margin: '10px 0 0', fontSize: '15px', lineHeight: 1.55, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                  )}

                  {post.attachments.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {post.attachments.map((attachment) => (
                        attachment.type === 'image' ? (
                          <div key={attachment.id} style={{ width: '100%', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative', aspectRatio: '16 / 10' }}>
                            <Image src={attachment.url} alt={attachment.name || 'Image'} fill sizes="700px" style={{ objectFit: 'cover' }} unoptimized />
                          </div>
                        ) : null
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => router.push(`/chat/${post.author_id}`)}
                      style={{
                        border: 'none', background: ORANGE, color: '#fff', borderRadius: '999px',
                        padding: '9px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                      }}
                    >
                      Contacter
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div style={{ display: 'flex', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', padding: '4px 0 20px' }}>
          Tradefair Marketplace — réservé aux étudiant·e·s vérifié·e·s
        </div>
      </div>
    </main>
  )
}

// ─── Page export (Suspense requis pour useSearchParams) ──────────────────────

export default function MarketplacePage(): ReactNode {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: '#64748b', fontFamily: 'Inter, system-ui, sans-serif' }}>Chargement...</div>
      </main>
    }>
      <MarketplaceInner />
    </Suspense>
  )
}
