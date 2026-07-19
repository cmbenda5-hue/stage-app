'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ORANGE = '#ff6b1a'

type MiniProfile = { id: string; full_name: string | null; avatar_url: string | null }

type SupabaseConversationRow = {
  id: string
  user_a: string
  user_b: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
  deleted_by_a: string | null
  deleted_by_b: string | null
  user_a_profile: MiniProfile | MiniProfile[] | null
  user_b_profile: MiniProfile | MiniProfile[] | null
}

type ConversationItem = {
  id: string
  otherUser: MiniProfile
  last_message: string | null
  last_message_at: string | null
  created_at: string
  unread_count: number
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function UserIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke={ORANGE} strokeWidth="1.8"/><path d="M5.5 19C6.5 15.5 9 14 12 14C15 14 17.5 15.5 18.5 19" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function CloseIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
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

function DeleteConversationButton({ onDelete, disabled }: { onDelete: () => void; disabled: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onDelete() }}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label="Supprimer cette conversation (pour moi)"
      title="Supprimer cette conversation (pour moi)"
      style={{
        width: '30px', height: '30px', borderRadius: '999px', border: 'none',
        background: hov ? '#fee2e2' : 'transparent', color: hov ? '#dc2626' : '#94a3b8',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        flexShrink: 0, transition: 'all 0.15s ease',
      }}
    >
      <CloseIcon />
    </button>
  )
}

export default function ChatListPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchConversations() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          id, user_a, user_b, last_message, last_message_at, created_at, deleted_by_a, deleted_by_b,
          user_a_profile:profiles!chat_conversations_user_a_fkey (id, full_name, avatar_url),
          user_b_profile:profiles!chat_conversations_user_b_fkey (id, full_name, avatar_url)
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) { console.error('FETCH CONVERSATIONS ERROR:', error); setConversations([]); setLoading(false); return }

      const { data: unreadRows } = await supabase.rpc('get_chat_conversation_unread_counts')
      const unreadMap = new Map<string, number>()
      ;(unreadRows ?? []).forEach((row: { conversation_id: string; unread_count: number }) => {
        unreadMap.set(row.conversation_id, Number(row.unread_count))
      })

      const rows = (data ?? []) as SupabaseConversationRow[]
      const normalized: ConversationItem[] = rows
        // Masque les conversations que CET utilisateur a supprimées de son côté
        .filter(row => {
          const hiddenForMe = row.user_a === user.id ? row.deleted_by_a : row.deleted_by_b
          return !hiddenForMe
        })
        .map(row => {
          const profileA = Array.isArray(row.user_a_profile) ? row.user_a_profile[0] : row.user_a_profile
          const profileB = Array.isArray(row.user_b_profile) ? row.user_b_profile[0] : row.user_b_profile
          const otherUser: MiniProfile = row.user_a === user.id
            ? (profileB ?? { id: row.user_b, full_name: null, avatar_url: null })
            : (profileA ?? { id: row.user_a, full_name: null, avatar_url: null })
          return {
            id: row.id,
            otherUser,
            last_message: row.last_message,
            last_message_at: row.last_message_at,
            created_at: row.created_at,
            unread_count: unreadMap.get(row.id) ?? 0,
          }
        })
      setConversations(normalized)
      setLoading(false)
    }
    fetchConversations()
  }, [router])

  async function handleDeleteConversation(conversationId: string, otherName: string | null) {
    const confirmed = window.confirm(`Supprimer la conversation avec ${otherName || 'cet·te étudiant·e'} de ta liste ? Elle réapparaîtra si cette personne t'envoie un nouveau message.`)
    if (!confirmed) return

    setDeletingIds(prev => new Set(prev).add(conversationId))
    try {
      const { error } = await supabase.rpc('hide_chat_conversation_for_me', { p_conversation_id: conversationId })
      if (error) throw error
      setConversations(prev => prev.filter(c => c.id !== conversationId))
    } catch (e) {
      console.error('HIDE CONVERSATION ERROR:', e)
      alert("Impossible de supprimer cette conversation pour le moment.")
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(conversationId); return n })
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* TOP BAR */}
        <div style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px',
          padding: '10px 14px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '24px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)', position: 'sticky', top: '16px', zIndex: 40,
        }}>
          <button type="button" onClick={() => router.push('/dashboard')} aria-label="Retour" title="Retour"
            style={{ width: '40px', height: '40px', border: '1px solid #f1f5f9', borderRadius: '999px', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151', boxShadow: '0 1px 6px rgba(32,33,36,0.08)' }}>
            <ArrowLeftIcon />
          </button>
          <TradefairLogo onClick={() => router.push('/dashboard')} />
          <div style={{ width: '40px' }} />
        </div>

        <h1 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Messages</h1>

        {/* LISTE */}
        <section style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '22px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Chargement des conversations...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '32px 22px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
              Aucune conversation pour le moment.
            </div>
          ) : conversations.map((conv, index) => (
            <div
              key={conv.id}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 12px 14px 16px',
                borderTop: index === 0 ? 'none' : '1px solid #f1f5f9',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
            >
              <button
                type="button"
                onClick={() => router.push(`/chat/${conv.otherUser.id}`)}
                style={{
                  flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px',
                  border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: 0,
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: '#ffe3d1', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {conv.otherUser.avatar_url ? (
                    <Image src={conv.otherUser.avatar_url} alt={conv.otherUser.full_name || 'Avatar'} fill sizes="48px" style={{ objectFit: 'cover' }} unoptimized />
                  ) : <UserIcon />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: conv.unread_count > 0 ? 800 : 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.otherUser.full_name || 'Étudiant·e'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>{timeAgo(conv.last_message_at)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' }}>
                    <span style={{
                      fontSize: '13px', color: conv.unread_count > 0 ? '#0f172a' : '#64748b',
                      fontWeight: conv.unread_count > 0 ? 700 : 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>
                      {conv.last_message || 'Nouvelle conversation'}
                    </span>
                    {conv.unread_count > 0 && (
                      <span style={{
                        minWidth: '20px', height: '20px', borderRadius: '999px', background: '#dc2626', color: '#fff',
                        fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 6px', flexShrink: 0,
                      }}>
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              <DeleteConversationButton
                onDelete={() => handleDeleteConversation(conv.id, conv.otherUser.full_name)}
                disabled={deletingIds.has(conv.id)}
              />
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
