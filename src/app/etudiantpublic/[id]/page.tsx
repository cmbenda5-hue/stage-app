'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SECTORS = [
  'Informatique', 'Finance', 'Marketing', 'Ressources humaines', 'Ingénierie',
  'Santé', 'Éducation', 'Commerce', 'Tourisme', 'Juridique',
  'Communication', 'Logistique', 'Architecture', 'Médias', 'Immobilier', 'Industrie',
]

type Profile = {
  id: string
  full_name?: string | null
  avatar_url?: string | null
  role?: string | null
  university?: string | null
}

type PostAttachment = {
  id: string
  type: 'image' | 'video' | 'video_embed' | 'pdf' | 'document' | 'link' | 'other'
  url: string
  name?: string | null
  mime_type?: string | null
  embed_url?: string | null
  provider?: 'youtube' | 'vimeo' | 'dailymotion' | 'other' | null
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
  likes_count: number
  comments_count: number
  shares_count: number
  downloads_count: number
  attachments: PostAttachment[]
}

type SupabasePostRow = {
  id: string
  author_id: string
  content: string | null
  created_at: string
  likes_count: number | null
  comments_count: number | null
  shares_count: number | null
  downloads_count: number | null
  attachments: PostAttachment[] | null
  author:
    | { id: string; full_name: string | null; avatar_url: string | null; university: string | null; role: string | null }
    | { id: string; full_name: string | null; avatar_url: string | null; university: string | null; role: string | null }[]
    | null
}

type CommentAuthor = { id: string; full_name: string | null; avatar_url: string | null }

type Comment = {
  id: string
  post_id: string
  author_id: string
  author: CommentAuthor
  content: string
  created_at: string
  likes_count: number
}

type SupabaseCommentRow = {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  likes_count: number | null
  author:
    | { id: string; full_name: string | null; avatar_url: string | null }
    | { id: string; full_name: string | null; avatar_url: string | null }[]
    | null
}

const ORANGE = '#ff6b1a'

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

// ─── Icons ──────────────────────────────────────────────────────────────────

function UserIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke={ORANGE} strokeWidth="1.8"/><path d="M5.5 19C6.5 15.5 9 14 12 14C15 14 17.5 15.5 18.5 19" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function HeartIcon({ filled, size = 18 }: { filled?: boolean; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? ORANGE : 'none'}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={filled ? ORANGE : 'currentColor'} strokeWidth="1.8" strokeLinejoin="round"/></svg>
}
function CommentIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}
function ShareIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function DownloadIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function StageBadgeIcon() {
  return <span style={{ color: '#fff', fontWeight: 900, fontSize: '17px', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>T</span>
}
function ListIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor"/></svg>
}
function SendMessageIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2l-7 20-4-9-9-4 20-7z" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

// ─── Small reusable UI ────────────────────────────────────────────────────────

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

function HoverUnderlineName({ children, size = 18 }: { children: ReactNode; size?: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'inline-block', position: 'relative', cursor: 'pointer', color: '#0f172a', fontWeight: 800, fontSize: `${size}px` }}>
      {children}
      <span style={{ position: 'absolute', left: 0, bottom: -2, width: hovered ? '100%' : '0%', height: '2px', background: ORANGE, transition: 'width 0.25s cubic-bezier(.4,0,.2,1)', borderRadius: '999px' }} />
    </span>
  )
}

function Avatar({ src, size = 48, name, priority = false }: { src?: string | null; size?: number; name?: string | null; priority?: boolean }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #ffe3d1 0%, #ffd0ad 100%)', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src ? (
        <Image src={src} alt="Avatar" fill sizes={`${size}px`} style={{ objectFit: 'cover' }} unoptimized priority={priority} />
      ) : (
        <span style={{ fontSize: size * 0.35, fontWeight: 700, color: ORANGE }}>{initials}</span>
      )}
    </div>
  )
}

function StatBtn({ icon, count, onClick, active, disabled, small }: { icon: ReactNode; count: number; onClick?: () => void; active?: boolean; disabled?: boolean; small?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const [pop, setPop] = useState(false)
  return (
    <button type="button" disabled={disabled}
      onClick={() => { if (disabled) return; setPop(true); setTimeout(() => setPop(false), 220); onClick?.() }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        border: 'none', background: hovered ? (active ? `${ORANGE}18` : '#f1f5f9') : 'transparent',
        display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1, color: active ? ORANGE : '#64748b', fontSize: small ? '12px' : '13px',
        fontWeight: 600, padding: small ? '4px 8px' : '6px 10px', borderRadius: '999px', transition: 'background 0.15s ease, color 0.15s ease',
      }}>
      <span style={{ display: 'inline-flex', transform: pop ? 'scale(1.35)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1)' }}>{icon}</span>
      <span>{count}</span>
    </button>
  )
}

function CommentItem({ comment, liked, likeDisabled, onLike, onNameClick }: {
  comment: Comment; liked: boolean; likeDisabled: boolean; onLike: () => void; onNameClick: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <button type="button" onClick={onNameClick} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
        <Avatar src={comment.author.avatar_url} size={34} name={comment.author.full_name} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: '#f1f5f9', borderRadius: '14px', padding: '8px 12px', display: 'inline-block', maxWidth: '100%' }}>
          <button type="button" onClick={onNameClick} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'block', textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{comment.author.full_name || 'Étudiant·e'}</div>
          </button>
          <div style={{ fontSize: '14px', color: '#0f172a', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '2px' }}>{comment.content}</div>
        </div>
        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '4px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{timeAgo(comment.created_at)}</span>
          <StatBtn icon={<HeartIcon filled={liked} size={14} />} count={comment.likes_count} onClick={onLike} active={liked} disabled={likeDisabled} small />
        </div>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', border: 'none', background: hov ? '#fff8f3' : 'transparent', borderRadius: '12px', padding: '12px 12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#111827', fontSize: '14px', textAlign: 'left' }}>
      {icon}<span>{label}</span>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EtudiantPublicPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const studentId = params?.id

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const stagesMenuRef = useRef<HTMLDivElement | null>(null)
  const pendingLikesRef = useRef<Set<string>>(new Set())
  const pendingCommentLikesRef = useRef<Set<string>>(new Set())

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [selectedSector, setSelectedSector] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const [stagesMenuOpen, setStagesMenuOpen] = useState(false)

  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [likeInFlight, setLikeInFlight] = useState<Set<string>>(new Set())
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null)
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({})
  const [commentsLoading, setCommentsLoading] = useState<Set<string>>(new Set())
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set())
  const [commentLikeInFlight, setCommentLikeInFlight] = useState<Set<string>>(new Set())
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<Set<string>>(new Set())
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)

  function goToAuthorProfile(authorId: string) {
    if (!authorId) return
    if (authorId === currentUserId) router.push('/dashboard')
    else router.push(`/etudiantpublic/${authorId}`)
  }

  function goToChat() {
    if (!studentId) return
    router.push(`/chat/${studentId}`)
  }

  const filteredSectors = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return SECTORS
    return SECTORS.filter(s => s.toLowerCase().includes(q))
  }, [searchText])

  function handleSectorClick(sector: string) {
    setSelectedSector(sector); setSearchText(sector); setIsSearchOpen(false)
  }

  // ── Chargement du profil courant + du profil consulté ──
  useEffect(() => {
    async function init() {
      if (!studentId) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      // Si l'utilisateur consulte son propre profil via ce lien, on le renvoie sur son dashboard.
      if (user.id === studentId) { router.replace('/dashboard'); return }

      const { data: likedRows } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id)
      setLikedPostIds(new Set((likedRows ?? []).map(r => r.post_id)))
      const { data: likedCommentRows } = await supabase.from('comment_likes').select('comment_id').eq('user_id', user.id)
      setLikedCommentIds(new Set((likedCommentRows ?? []).map(r => r.comment_id)))

      const { data, error } = await supabase.from('profiles').select('id, full_name, avatar_url, role, university').eq('id', studentId).single()
      if (error || !data) { setNotFound(true); setLoading(false); return }
      setViewedProfile(data as Profile)
      setLoading(false)
    }
    init()
  }, [studentId, router])

  // ── Chargement des posts de l'étudiant consulté ──
  useEffect(() => {
    async function fetchPosts() {
      if (!studentId) return
      setPostsLoading(true)
      try {
        const { data, error } = await supabase.from('posts').select(`
          id, author_id, content, created_at, likes_count, comments_count, shares_count, downloads_count, attachments,
          author:profiles!posts_author_id_fkey (id, full_name, avatar_url, university, role)
        `).eq('author_id', studentId).order('created_at', { ascending: false })
        if (error) { setPosts([]); return }
        const rows = (data ?? []) as SupabasePostRow[]
        const normalized: Post[] = rows.map(item => ({
          id: item.id, author_id: item.author_id, content: item.content ?? '',
          created_at: item.created_at,
          likes_count: item.likes_count ?? 0, comments_count: item.comments_count ?? 0,
          shares_count: item.shares_count ?? 0, downloads_count: item.downloads_count ?? 0,
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
      } catch (e) { console.error(e); setPosts([]) }
      finally { setPostsLoading(false) }
    }
    if (viewedProfile) fetchPosts()
  }, [viewedProfile, studentId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node
      if (stagesMenuRef.current && !stagesMenuRef.current.contains(t)) setStagesMenuOpen(false)
      if (wrapperRef.current && !wrapperRef.current.contains(t)) setIsSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLikePost(postId: string) {
    if (!currentUserId) return
    if (pendingLikesRef.current.has(postId)) return
    pendingLikesRef.current.add(postId)
    setLikeInFlight(prev => new Set(prev).add(postId))

    const alreadyLiked = likedPostIds.has(postId)
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: alreadyLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 } : p))
    setLikedPostIds(prev => { const n = new Set(prev); if (alreadyLiked) n.delete(postId); else n.add(postId); return n })

    try {
      const { error } = await supabase.rpc('toggle_post_like', { p_post_id: postId })
      if (error) throw error
      const { data: freshPost, error: fetchError } = await supabase.from('posts').select('likes_count').eq('id', postId).single()
      if (!fetchError && freshPost) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: freshPost.likes_count ?? p.likes_count } : p))
      }
    } catch (e) {
      console.error('LIKE ERROR:', e)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: alreadyLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) } : p))
      setLikedPostIds(prev => { const n = new Set(prev); if (alreadyLiked) n.add(postId); else n.delete(postId); return n })
    } finally {
      pendingLikesRef.current.delete(postId)
      setLikeInFlight(prev => { const n = new Set(prev); n.delete(postId); return n })
    }
  }

  async function handleSharePost(post: Post) {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
    try {
      if (navigator.share) { await navigator.share({ title: 'Tradefair', text: `${post.author.full_name || 'Un étudiant'} a publié sur Tradefair`, url: shareUrl }) }
      else { await navigator.clipboard.writeText(shareUrl); alert('Lien copié.') }
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, shares_count: p.shares_count + 1 } : p))
    } catch (e) { console.error(e) }
  }

  async function handleDownloadAttachment(attachment: PostAttachment) {
    try {
      const res = await fetch(attachment.url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = attachment.name || 'download'
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch { alert("Téléchargement impossible.") }
  }

  async function fetchCommentsForPost(postId: string) {
    setCommentsLoading(prev => new Set(prev).add(postId))
    try {
      const { data, error } = await supabase.from('comments').select(`
        id, post_id, author_id, content, created_at, likes_count,
        author:profiles!comments_author_id_fkey (id, full_name, avatar_url)
      `).eq('post_id', postId).order('created_at', { ascending: true })
      if (error) throw error
      const rows = (data ?? []) as SupabaseCommentRow[]
      const normalized: Comment[] = rows.map(row => ({
        id: row.id, post_id: row.post_id, author_id: row.author_id,
        content: row.content, created_at: row.created_at, likes_count: row.likes_count ?? 0,
        author: {
          id: Array.isArray(row.author) ? row.author[0]?.id ?? '' : row.author?.id ?? '',
          full_name: Array.isArray(row.author) ? row.author[0]?.full_name ?? null : row.author?.full_name ?? null,
          avatar_url: Array.isArray(row.author) ? row.author[0]?.avatar_url ?? null : row.author?.avatar_url ?? null,
        },
      }))
      setCommentsByPost(prev => ({ ...prev, [postId]: normalized }))
    } catch (e) { console.error('FETCH COMMENTS ERROR:', e) }
    finally { setCommentsLoading(prev => { const n = new Set(prev); n.delete(postId); return n }) }
  }

  function handleToggleComments(postId: string) {
    const willOpen = openCommentPostId !== postId
    setOpenCommentPostId(willOpen ? postId : null)
    if (willOpen && !commentsByPost[postId]) fetchCommentsForPost(postId)
  }

  async function handleAddComment(postId: string) {
    if (!currentUserId) return
    const text = (commentTexts[postId] || '').trim()
    if (!text) return
    setSubmittingComment(prev => new Set(prev).add(postId))
    try {
      const { data: myProfile } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', currentUserId).single()
      const { data, error } = await supabase.from('comments').insert({ post_id: postId, author_id: currentUserId, content: text }).select().single()
      if (error) throw error
      const newComment: Comment = {
        id: data.id, post_id: postId, author_id: currentUserId,
        author: { id: currentUserId, full_name: myProfile?.full_name ?? null, avatar_url: myProfile?.avatar_url ?? null },
        content: data.content, created_at: data.created_at, likes_count: 0,
      }
      setCommentsByPost(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), newComment] }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      setCommentTexts(prev => ({ ...prev, [postId]: '' }))

      const { data: freshPost, error: fetchError } = await supabase.from('posts').select('comments_count').eq('id', postId).single()
      if (!fetchError && freshPost) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: freshPost.comments_count ?? p.comments_count } : p))
      }
    } catch (e) {
      console.error('ADD COMMENT ERROR:', e)
      alert("Impossible d'ajouter le commentaire pour le moment.")
    } finally {
      setSubmittingComment(prev => { const n = new Set(prev); n.delete(postId); return n })
    }
  }

  async function handleLikeComment(commentId: string, postId: string) {
    if (!currentUserId) return
    if (pendingCommentLikesRef.current.has(commentId)) return
    pendingCommentLikesRef.current.add(commentId)
    setCommentLikeInFlight(prev => new Set(prev).add(commentId))

    const alreadyLiked = likedCommentIds.has(commentId)
    setCommentsByPost(prev => ({
      ...prev,
      [postId]: (prev[postId] ?? []).map(c => c.id === commentId ? { ...c, likes_count: alreadyLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1 } : c),
    }))
    setLikedCommentIds(prev => { const n = new Set(prev); if (alreadyLiked) n.delete(commentId); else n.add(commentId); return n })

    try {
      const { error } = await supabase.rpc('toggle_comment_like', { p_comment_id: commentId })
      if (error) throw error
      const { data: freshComment, error: fetchError } = await supabase.from('comments').select('likes_count').eq('id', commentId).single()
      if (!fetchError && freshComment) {
        setCommentsByPost(prev => ({
          ...prev,
          [postId]: (prev[postId] ?? []).map(c => c.id === commentId ? { ...c, likes_count: freshComment.likes_count ?? c.likes_count } : c),
        }))
      }
    } catch (e) {
      console.error('COMMENT LIKE ERROR:', e)
      setCommentsByPost(prev => ({
        ...prev,
        [postId]: (prev[postId] ?? []).map(c => c.id === commentId ? { ...c, likes_count: alreadyLiked ? c.likes_count + 1 : Math.max(0, c.likes_count - 1) } : c),
      }))
      setLikedCommentIds(prev => { const n = new Set(prev); if (alreadyLiked) n.add(commentId); else n.delete(commentId); return n })
    } finally {
      pendingCommentLikesRef.current.delete(commentId)
      setCommentLikeInFlight(prev => { const n = new Set(prev); n.delete(commentId); return n })
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '18px 22px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', fontSize: '14px', color: '#64748b' }}>
          Chargement du profil...
        </div>
      </main>
    )
  }

  if (notFound || !viewedProfile) {
    return (
      <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>Cet·te étudiant·e est introuvable.</p>
          <button type="button" onClick={() => router.push('/dashboard')} style={{ marginTop: '14px', border: 'none', background: ORANGE, color: '#fff', borderRadius: '999px', padding: '10px 18px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
            Retour au dashboard
          </button>
        </div>
      </main>
    )
  }

  const avatarHasImage = !!viewedProfile.avatar_url

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a' }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .post-card { animation: fadeSlideIn 0.3s ease; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* TOP BAR (pas de messages reçus, pas d'avatar profil perso) */}
        <div style={{
          width: '100%', display: 'grid', gridTemplateColumns: '220px 1fr 220px', alignItems: 'center', gap: '14px',
          padding: '10px 14px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '24px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)', position: 'sticky', top: '16px', zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'start', marginLeft: '8px' }}>
            <TradefairLogo onClick={() => router.push('/dashboard')} />
          </div>

          {/* Search */}
          <div ref={wrapperRef} style={{ width: '100%', maxWidth: '820px', minWidth: 0, position: 'relative', justifySelf: 'center', zIndex: 30 }}>
            <div style={{
              border: `1px solid ${isSearchOpen ? ORANGE : '#dfe1e5'}`, borderRadius: isSearchOpen ? '18px 18px 0 0' : '999px',
              padding: '0 14px', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: isSearchOpen ? `0 10px 24px ${ORANGE}22` : '0 1px 6px rgba(32,33,36,0.10)',
              background: '#ffffff', transition: 'all 0.18s ease', height: '42px', width: '100%',
            }}>
              <span style={{ color: isSearchOpen ? ORANGE : '#9aa0a6' }}><SearchIcon /></span>
              <input
                type="text" value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setIsSearchOpen(true) }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Rechercher un secteur de stage..."
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', background: 'transparent', height: '100%', color: '#111827' }}
              />
              {searchText && (
                <button type="button" onClick={() => { setSearchText(''); setSelectedSector(''); setIsSearchOpen(true) }}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#9aa0a6', lineHeight: 1, padding: 0 }}
                  aria-label="Effacer la recherche">×</button>
              )}
            </div>

            {isSearchOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: `1px solid ${ORANGE}`,
                borderTop: 'none', borderRadius: '0 0 18px 18px', boxShadow: `0 12px 22px ${ORANGE}1f`,
                overflow: 'hidden', zIndex: 20, maxHeight: '320px', overflowY: 'auto',
              }}>
                {filteredSectors.length === 0 ? (
                  <div style={{ padding: '14px 18px', color: '#666', fontSize: '15px' }}>Aucun secteur trouvé.</div>
                ) : filteredSectors.map((sector) => {
                  const active = selectedSector === sector
                  return (
                    <button key={sector} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleSectorClick(sector)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none',
                        background: active ? '#fff3ea' : 'white',
                        cursor: 'pointer', fontSize: '14px', fontWeight: active ? 700 : 500,
                        color: active ? ORANGE : '#111827', borderBottom: '1px solid #f3f4f6', transition: 'all 0.15s ease',
                      }}>
                      {sector}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bouton envoyer un message (fond blanc) + badge "Mon stage" de l'étudiant consulté */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifySelf: 'end' }}>
            <button
              type="button"
              onClick={goToChat}
              aria-label={`Envoyer un message à ${viewedProfile.full_name || "l'étudiant·e"}`}
              title={`Envoyer un message à ${viewedProfile.full_name || "l'étudiant·e"}`}
              style={{
                width: '44px', height: '44px', border: '1px solid #f1f5f9', borderRadius: '999px', background: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxShadow: '0 1px 6px rgba(32,33,36,0.08)', transition: 'transform 0.18s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <SendMessageIcon />
            </button>

            <div ref={stagesMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setStagesMenuOpen((prev) => !prev)}
                aria-label={`Stages de ${viewedProfile.full_name || "l'étudiant·e"}`}
                title={`Stages de ${viewedProfile.full_name || "l'étudiant·e"}`}
                style={{
                  width: '44px', height: '44px', border: 'none', borderRadius: '999px', background: ORANGE,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: `0 1px 8px ${ORANGE}55`, transition: 'transform 0.18s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <StageBadgeIcon />
              </button>

              {stagesMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '54px', width: '260px', background: '#fff',
                  border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 14px 36px rgba(0,0,0,0.14)',
                  zIndex: 80, overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                      Stages de {viewedProfile.full_name || "l'étudiant·e"}
                    </div>
                  </div>
                  <div style={{ padding: '8px' }}>
                    <MenuItem
                      icon={<ListIcon />}
                      label="Voir la liste de stages"
                      onClick={() => { setStagesMenuOpen(false); router.push(`/stageslist/${viewedProfile.id}`) }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* PROFILE CARD (lecture seule) */}
          <section style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', background: '#ffe3d1', position: 'relative', flexShrink: 0 }}>
                {avatarHasImage ? (
                  <Image src={viewedProfile.avatar_url ?? ''} alt="Photo de profil" fill sizes="72px" style={{ objectFit: 'cover' }} unoptimized priority />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon /></div>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ marginBottom: '4px' }}>
                  <HoverUnderlineName>{viewedProfile.full_name || "Nom de l'étudiant·e"}</HoverUnderlineName>
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '3px' }}>{viewedProfile.university || "Nom de l'université"}</div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>{viewedProfile.role || 'Filière étudiée'}</div>
              </div>
              <button
                type="button"
                onClick={goToChat}
                style={{
                  border: `1px solid ${ORANGE}`, background: '#fff', color: ORANGE, borderRadius: '999px',
                  padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                }}
              >
                Envoyer un message
              </button>
            </div>
          </section>

          {/* Pas de bloc "Quoi de neuf" ici : c'est un profil consulté, pas le sien */}

          {/* Sector filter pill */}
          {selectedSector && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Filtré par :</span>
              <button type="button" onClick={() => { setSelectedSector(''); setSearchText('') }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff3ea', color: ORANGE, border: '1px solid #ffd0ad', borderRadius: '999px', padding: '4px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {selectedSector} <span style={{ fontSize: '16px', lineHeight: 1 }}>×</span>
              </button>
            </div>
          )}

          {/* FEED de l'étudiant consulté */}
          <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {postsLoading ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '18px', color: '#64748b', fontSize: '14px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                Chargement des publications...
              </div>
            ) : posts.length === 0 ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '22px', color: '#64748b', fontSize: '14px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                Aucun post pour le moment.
              </div>
            ) : posts.map((post, index) => {
              const liked = likedPostIds.has(post.id)
              const postComments = commentsByPost[post.id] ?? []
              const isCommentsLoading = commentsLoading.has(post.id)
              const isSubmittingComment = submittingComment.has(post.id)

              return (
                <article key={post.id} className="post-card" style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '14px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Avatar src={post.author.avatar_url} size={52} name={post.author.full_name} priority={index === 0} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                            <HoverUnderlineName size={15}>{post.author.full_name || 'Étudiant·e'}</HoverUnderlineName>
                            <span style={{ color: '#94a3b8' }}>·</span>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>{timeAgo(post.created_at)}</span>
                          </div>
                          <div style={{ marginTop: '4px', color: '#64748b', fontSize: '13px' }}>
                            {post.author.university || post.author.role || 'Étudiant·e'}
                          </div>
                        </div>
                        {/* Pas de menu "..." : ce n'est pas le propriétaire du post qui consulte */}
                      </div>

                      {post.content && (
                        <p style={{ margin: '10px 0 0', fontSize: '15px', lineHeight: 1.55, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                      )}

                      {post.attachments.length > 0 && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {post.attachments.map((attachment) => (
                            <div key={attachment.id}>
                              {attachment.type === 'image' && (
                                <button type="button" onClick={() => setSelectedImagePreview(attachment.url)}
                                  style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f8fafc', padding: 0, cursor: 'pointer' }}>
                                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10' }}>
                                    <Image src={attachment.url} alt={attachment.name || 'Image'} fill sizes="900px" style={{ objectFit: 'cover' }} unoptimized />
                                  </div>
                                </button>
                              )}
                              {(attachment.type === 'pdf' || attachment.type === 'document' || attachment.type === 'other') && (
                                <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '14px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{attachment.type.toUpperCase()}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name || 'Fichier'}</div>
                                  </div>
                                  <a href={attachment.url} target="_blank" rel="noopener noreferrer"
                                    style={{ border: 'none', background: ORANGE, color: '#fff', borderRadius: '999px', padding: '10px 14px', fontSize: '13px', fontWeight: 800, textDecoration: 'none' }}>Ouvrir</a>
                                </div>
                              )}
                              {attachment.type === 'link' && (
                                <a href={attachment.url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'block', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '14px', background: '#f8fafc', textDecoration: 'none', color: '#0f172a' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: ORANGE }}>Lien partagé</div>
                                  <div style={{ marginTop: '4px', fontSize: '13px', color: '#64748b', wordBreak: 'break-word' }}>{attachment.url}</div>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <StatBtn icon={<HeartIcon filled={liked} />} count={post.likes_count} onClick={() => handleLikePost(post.id)} active={liked} disabled={likeInFlight.has(post.id)} />
                          <StatBtn icon={<CommentIcon />} count={post.comments_count} onClick={() => handleToggleComments(post.id)} active={openCommentPostId === post.id} />
                          <StatBtn icon={<ShareIcon />} count={post.shares_count} onClick={() => handleSharePost(post)} />
                        </div>
                        {post.attachments.some(a => a.type !== 'video' && a.type !== 'video_embed') && (
                          <StatBtn icon={<DownloadIcon />} count={post.downloads_count}
                            onClick={() => { const a = post.attachments.find(x => x.type !== 'video' && x.type !== 'video_embed'); if (a) handleDownloadAttachment(a) }} />
                        )}
                      </div>

                      {openCommentPostId === post.id && (
                        <div style={{ marginTop: '12px', padding: '12px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                          {isCommentsLoading ? (
                            <div style={{ fontSize: '13px', color: '#64748b', padding: '4px 2px 10px' }}>Chargement des commentaires...</div>
                          ) : postComments.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>
                              {postComments.map((comment) => (
                                <CommentItem
                                  key={comment.id}
                                  comment={comment}
                                  liked={likedCommentIds.has(comment.id)}
                                  likeDisabled={commentLikeInFlight.has(comment.id)}
                                  onLike={() => handleLikeComment(comment.id, post.id)}
                                  onNameClick={() => goToAuthorProfile(comment.author_id)}
                                />
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', color: '#94a3b8', padding: '4px 2px 10px' }}>Aucun commentaire pour l&apos;instant. Sois le premier à commenter !</div>
                          )}

                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <textarea
                                value={commentTexts[post.id] || ''}
                                onChange={(e) => setCommentTexts((p) => ({ ...p, [post.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(post.id) }
                                }}
                                placeholder="Écrire un commentaire..."
                                style={{ width: '100%', minHeight: '72px', resize: 'vertical', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '10px 12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.5, background: '#fff', color: '#0f172a' }}
                              />
                              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!commentTexts[post.id]?.trim() || isSubmittingComment}
                                  style={{
                                    border: 'none',
                                    background: commentTexts[post.id]?.trim() && !isSubmittingComment ? ORANGE : '#e2e8f0',
                                    color: commentTexts[post.id]?.trim() && !isSubmittingComment ? '#fff' : '#94a3b8',
                                    borderRadius: '999px', padding: '9px 14px', fontSize: '13px', fontWeight: 800,
                                    cursor: commentTexts[post.id]?.trim() && !isSubmittingComment ? 'pointer' : 'not-allowed',
                                  }}>
                                  {isSubmittingComment ? 'Envoi...' : 'Commenter'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </section>

          <div style={{ display: 'flex', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', padding: '4px 0 2px' }}>
            Tradefair · Profil public
          </div>
        </div>
      </div>

      {selectedImagePreview && (
        <div onClick={() => setSelectedImagePreview(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
            <button type="button" onClick={() => setSelectedImagePreview(null)}
              style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2, border: 'none', background: 'rgba(15,23,42,0.8)', color: '#fff', borderRadius: '999px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
            <div style={{ position: 'relative', width: '90vw', height: '90vh' }}>
              <Image src={selectedImagePreview} alt="Aperçu" fill sizes="90vw" style={{ objectFit: 'contain' }} unoptimized />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
