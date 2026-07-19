'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ORANGE = '#ff6b1a'

type OtherProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  university: string | null
  role: string | null
}

type MessageType = 'text' | 'gif' | 'image' | 'video' | 'video_embed' | 'document' | 'link' | 'other'

type ChatMessage = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: MessageType
  attachment_name: string | null
  attachment_mime_type: string | null
  embed_url: string | null
  provider: 'youtube' | 'vimeo' | 'dailymotion' | 'other' | null
  created_at: string
  read_at: string | null
}

type GifResult = {
  id: string
  title: string
  url: string
  preview: string
}

type GiphyItem = {
  id: string
  title: string
  images?: {
    original?: { url?: string }
    fixed_width_small?: { url?: string }
    preview_gif?: { url?: string }
  }
}

const EMOJI_LIST = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😉', '😎', '🤩',
  '🥳', '😇', '🙂', '🙃', '😅', '😆', '😜', '🤔', '🤗', '🥲',
  '👍', '👎', '👏', '🙌', '🙏', '💪', '✌️', '🤞', '👌', '🤙',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💯',
  '🔥', '✨', '⭐', '🎉', '🎊', '🎓', '📚', '✏️', '💡', '🚀',
  '👀', '😮', '😢', '😭', '😡', '😱', '🥺', '😴', '💼', '🎯',
  '✅', '❌', '📌', '📢', '🙋', '🙋‍♂️', '🙋‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️',
]

function timeShort(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return "Aujourd'hui"
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getVideoProvider(url: string): 'youtube' | 'vimeo' | 'dailymotion' | 'other' | null {
  const v = url.toLowerCase()
  if (v.includes('youtube.com') || v.includes('youtu.be')) return 'youtube'
  if (v.includes('vimeo.com')) return 'vimeo'
  if (v.includes('dailymotion.com') || v.includes('dai.ly')) return 'dailymotion'
  return null
}

function isExternalLink(value: string) { return /^https?:\/\//i.test(value.trim()) }

function getEmbedUrl(url: string): string | null {
  const provider = getVideoProvider(url)
  if (provider === 'youtube') {
    try {
      const u = new URL(url)
      const videoId = u.hostname.includes('youtu.be') ? u.pathname.replace('/', '') : u.searchParams.get('v')
      if (!videoId) return null
      return `https://www.youtube.com/embed/${videoId}?rel=0`
    } catch { return null }
  }
  if (provider === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/)
    if (!match?.[1]) return null
    return `https://player.vimeo.com/video/${match[1]}`
  }
  if (provider === 'dailymotion') {
    const match = url.match(/video\/([a-zA-Z0-9]+)/)
    if (!match?.[1]) return null
    return `https://www.dailymotion.com/embed/video/${match[1]}`
  }
  return null
}

function getFileType(file: File): 'image' | 'video' | 'document' | 'other' {
  const name = file.name.toLowerCase()
  if (file.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return 'image'
  if (file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/.test(name)) return 'video'
  if (file.type === 'application/pdf' || /\.(doc|docx|ppt|pptx|xls|xlsx|txt|rtf|pdf)$/.test(name)) return 'document'
  return 'other'
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function UserIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke={ORANGE} strokeWidth="1.8"/><path d="M5.5 19C6.5 15.5 9 14 12 14C15 14 17.5 15.5 18.5 19" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function SendIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function EmojiIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="10" r="1.2" fill="currentColor"/><circle cx="15.5" cy="10" r="1.2" fill="currentColor"/><path d="M8 14.5C8.8 16 10.2 17 12 17C13.8 17 15.2 16 16 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function GifIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <text x="12" y="15" textAnchor="middle" fontSize="7" fontWeight="800" fill="currentColor" stroke="none" fontFamily="Inter, sans-serif">GIF</text>
    </svg>
  )
}
function ImageIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.8"/><polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LinkIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function DocumentIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}
function DownloadIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function EmojiPickerPanel({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div
      data-chat-picker
      style={{
        position: 'absolute', bottom: '54px', left: 0, width: '292px', maxHeight: '230px', overflowY: 'auto',
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px',
        boxShadow: '0 14px 32px rgba(0,0,0,0.16)', padding: '10px', zIndex: 70,
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px',
      }}
    >
      {EMOJI_LIST.map((emoji, i) => (
        <button
          key={`${emoji}-${i}`}
          type="button"
          onClick={() => onSelect(emoji)}
          style={{
            border: 'none', background: 'transparent', fontSize: '20px', lineHeight: 1,
            padding: '6px 0', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.12s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1e6' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

// ─── GIF Picker (Giphy) ───────────────────────────────────────────────────────

function GifPickerPanel({ onSelect }: { onSelect: (gif: GifResult) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GifResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSearch(q: string) {
    const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY
    if (!apiKey) {
      setError("Clé GIPHY manquante. Vérifie NEXT_PUBLIC_GIPHY_API_KEY dans .env.local puis redémarre le serveur.")
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const endpoint = q.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(q.trim())}&limit=24&rating=pg&lang=fr`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=24&rating=pg`
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`Giphy a répondu avec le statut ${res.status}`)
      const json = await res.json()
      const mapped: GifResult[] = (json.data ?? [])
        .map((item: GiphyItem): GifResult => ({
          id: item.id,
          title: item.title,
          url: item.images?.original?.url ?? '',
          preview: item.images?.fixed_width_small?.url ?? item.images?.preview_gif?.url ?? '',
        }))
        .filter((gif: GifResult) => gif.url && gif.preview)
      setResults(mapped)
      if (mapped.length === 0) setError('Aucun GIF trouvé.')
    } catch (e) {
      console.error('GIF SEARCH ERROR:', e)
      setError("Impossible de charger les GIFs pour le moment.")
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runSearch('')
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { void runSearch(query) }, 450)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div
      data-chat-picker
      style={{
        position: 'absolute', bottom: '54px', left: 0, width: '320px', background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 14px 32px rgba(0,0,0,0.16)',
        padding: '10px', zIndex: 70,
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un GIF..."
        autoFocus
        style={{
          width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: '10px',
          padding: '8px 10px', fontSize: '13px', outline: 'none', marginBottom: '8px',
          fontFamily: 'inherit', color: '#0f172a',
        }}
      />
      {loading && <div style={{ fontSize: '13px', color: '#64748b', padding: '6px 2px' }}>Chargement...</div>}
      {!loading && error && <div style={{ fontSize: '13px', color: '#dc2626', padding: '6px 2px' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
          {results.map((gif) => (
            <button
              key={gif.id}
              type="button"
              onClick={() => onSelect(gif)}
              title={gif.title || 'GIF'}
              style={{ border: 'none', padding: 0, borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#f1f5f9', height: '76px' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gif.preview} alt={gif.title || 'GIF'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Composer icon button ─────────────────────────────────────────────────────

function ComposerIconBtn({ icon, onClick, label, active, disabled }: { icon: React.ReactNode; onClick?: () => void; label: string; active?: boolean; disabled?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      data-chat-picker-trigger="true"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '38px', height: '38px', border: 'none', borderRadius: '50%',
        background: (hov || active) ? '#fff1e6' : 'transparent', color: (hov || active) ? ORANGE : '#6b7280',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease', flexShrink: 0,
      }}>
      {icon}
    </button>
  )
}

// ─── Message bubble content ──────────────────────────────────────────────────

function MessageContent({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) {
  if (msg.message_type === 'gif' || msg.message_type === 'image') {
    return (
      <div style={{ borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={msg.content} alt={msg.attachment_name || 'Image'} style={{ display: 'block', maxWidth: '240px', maxHeight: '260px', objectFit: 'cover' }} />
      </div>
    )
  }

  if (msg.message_type === 'video') {
    return (
      <div style={{ borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#000' }}>
        <video src={msg.content} controls style={{ display: 'block', maxWidth: '260px', maxHeight: '280px' }} />
      </div>
    )
  }

  if (msg.message_type === 'video_embed' && msg.embed_url) {
    return (
      <div style={{ borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#000', width: '260px' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
          <iframe src={msg.embed_url} title={msg.attachment_name || 'Vidéo'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: '0' }} />
        </div>
      </div>
    )
  }

  if (msg.message_type === 'document' || msg.message_type === 'other') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', minWidth: '200px',
        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isMine ? ORANGE : '#fff', border: isMine ? 'none' : '1px solid #e5e7eb',
        color: isMine ? '#fff' : '#0f172a',
      }}>
        <div style={{ flexShrink: 0 }}><DocumentIcon /></div>
        <div style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {msg.attachment_name || 'Fichier'}
        </div>
        <a href={msg.content} target="_blank" rel="noopener noreferrer"
          style={{ flexShrink: 0, color: isMine ? '#fff' : ORANGE, display: 'inline-flex' }}
          aria-label="Télécharger" title="Télécharger">
          <DownloadIcon />
        </a>
      </div>
    )
  }

  if (msg.message_type === 'link') {
    return (
      <a href={msg.content} target="_blank" rel="noopener noreferrer" style={{
        display: 'block', minWidth: '200px', maxWidth: '260px', padding: '10px 12px', textDecoration: 'none',
        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isMine ? ORANGE : '#fff', border: isMine ? 'none' : '1px solid #e5e7eb',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: isMine ? '#fff' : ORANGE, marginBottom: '2px' }}>Lien partagé</div>
        <div style={{ fontSize: '13px', color: isMine ? '#fff' : '#0f172a', wordBreak: 'break-word' }}>{msg.content}</div>
      </a>
    )
  }

  // text
  return (
    <div style={{
      background: isMine ? ORANGE : '#fff',
      color: isMine ? '#fff' : '#0f172a',
      border: isMine ? 'none' : '1px solid #e5e7eb',
      borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      padding: '10px 14px', fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    }}>
      {msg.content}
    </div>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const otherUserId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : null

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messageTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)

  function appendMessageDeduped(msg: ChatMessage) {
    setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]))
  }

  useEffect(() => {
    async function init() {
      if (!otherUserId) { setNotFound(true); setLoading(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (user.id === otherUserId) { router.replace('/dashboard'); return }
      setCurrentUserId(user.id)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, university, role')
        .eq('id', otherUserId)
        .single()
      if (profileError || !profileData) { setNotFound(true); setLoading(false); return }
      setOtherProfile(profileData as OtherProfile)

      const { data: convId, error: convError } = await supabase.rpc('get_or_create_chat_conversation', {
        p_other_user_id: otherUserId,
      })
      if (convError || !convId) { setNotFound(true); setLoading(false); return }
      setConversationId(convId as string)

      const { data: messageRows, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, conversation_id, sender_id, content, message_type, attachment_name, attachment_mime_type, embed_url, provider, created_at, read_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
      if (!messagesError && messageRows) setMessages(messageRows as ChatMessage[])

      await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .eq('sender_id', otherUserId)
        .is('read_at', null)

      setLoading(false)
    }
    init()
  }, [otherUserId, router])

  // ── Réception en temps réel ──
  useEffect(() => {
    if (!conversationId || !currentUserId) return

    const channel = supabase
      .channel(`chat-messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const newMsg = payload.new as ChatMessage
          appendMessageDeduped(newMsg)
          if (newMsg.sender_id !== currentUserId) {
            await supabase.from('chat_messages').update({ read_at: new Date().toISOString() }).eq('id', newMsg.id)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Ferme les panneaux au clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as HTMLElement
      const inPicker = t?.closest?.('[data-chat-picker]')
      const inTrigger = t?.closest?.('[data-chat-picker-trigger]')
      if (!inPicker && !inTrigger) {
        setShowEmojiPicker(false)
        setShowGifPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function insertEmoji(emoji: string) {
    const textarea = messageTextareaRef.current
    if (!textarea) { setMessageText((prev) => prev + emoji); return }
    const start = textarea.selectionStart ?? messageText.length
    const end = textarea.selectionEnd ?? messageText.length
    const newText = messageText.slice(0, start) + emoji + messageText.slice(end)
    setMessageText(newText)
    requestAnimationFrame(() => {
      textarea.focus()
      const pos = start + emoji.length
      textarea.setSelectionRange(pos, pos)
    })
  }

  async function insertMessageRow(payload: {
    content: string
    message_type: MessageType
    attachment_name?: string | null
    attachment_mime_type?: string | null
    embed_url?: string | null
    provider?: 'youtube' | 'vimeo' | 'dailymotion' | 'other' | null
  }) {
    if (!conversationId || !currentUserId) return
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: payload.content,
        message_type: payload.message_type,
        attachment_name: payload.attachment_name ?? null,
        attachment_mime_type: payload.attachment_mime_type ?? null,
        embed_url: payload.embed_url ?? null,
        provider: payload.provider ?? null,
      })
      .select()
      .single()
    if (error) throw error
    appendMessageDeduped(data as ChatMessage)
  }

  async function handleSend() {
    const text = messageText.trim()
    if (!text || sending) return
    setSending(true)
    try {
      await insertMessageRow({ content: text, message_type: 'text' })
      setMessageText('')
    } catch (e) {
      console.error('SEND MESSAGE ERROR:', e)
      alert("Impossible d'envoyer le message pour le moment.")
    } finally {
      setSending(false)
    }
  }

  async function handleSendGif(gif: GifResult) {
    if (sending) return
    setShowGifPicker(false)
    setSending(true)
    try {
      await insertMessageRow({ content: gif.url, message_type: 'gif', attachment_name: gif.title || 'GIF' })
    } catch (e) {
      console.error('SEND GIF ERROR:', e)
      alert("Impossible d'envoyer le GIF pour le moment.")
    } finally {
      setSending(false)
    }
  }

  async function handleSendLink() {
    const link = window.prompt('Colle le lien à partager')
    if (!link || !link.trim()) return
    const trimmed = link.trim()
    setSending(true)
    try {
      const provider = getVideoProvider(trimmed)
      if (provider) {
        const embedUrl = getEmbedUrl(trimmed)
        await insertMessageRow({
          content: trimmed, message_type: 'video_embed', embed_url: embedUrl, provider, attachment_name: trimmed,
        })
      } else if (isExternalLink(trimmed)) {
        await insertMessageRow({ content: trimmed, message_type: 'link' })
      } else {
        alert("Ce lien ne semble pas valide (il doit commencer par http:// ou https://).")
      }
    } catch (e) {
      console.error('SEND LINK ERROR:', e)
      alert("Impossible d'envoyer le lien pour le moment.")
    } finally {
      setSending(false)
    }
  }

  async function handleFileSelected(file: File) {
    if (!conversationId || !currentUserId) return
    setUploading(true)
    try {
      const safeName = `${Date.now()}-${file.name}`.replace(/\s+/g, '-')
      const path = `chat/${conversationId}/${safeName}`
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      const fileType = getFileType(file)
      await insertMessageRow({
        content: data.publicUrl,
        message_type: fileType,
        attachment_name: file.name,
        attachment_mime_type: file.type || null,
      })
    } catch (e) {
      console.error('UPLOAD FILE ERROR:', e)
      alert("Impossible d'envoyer ce fichier pour le moment.")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: '#64748b' }}>Chargement de la conversation...</div>
      </main>
    )
  }

  if (notFound || !otherProfile) {
    return (
      <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '24px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>Impossible de charger cette conversation.</p>
          <button type="button" onClick={() => router.push('/dashboard')} style={{ marginTop: '14px', border: 'none', background: ORANGE, color: '#fff', borderRadius: '999px', padding: '10px 18px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
            Retour au dashboard
          </button>
        </div>
      </main>
    )
  }

  let lastDay = ''

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* TOP BAR */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#fff',
        borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button type="button" onClick={() => router.push('/chatlist')} aria-label="Retour" title="Retour"
          style={{ width: '38px', height: '38px', border: '1px solid #f1f5f9', borderRadius: '999px', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151', flexShrink: 0 }}>
          <ArrowLeftIcon />
        </button>

        <button type="button" onClick={() => router.push(`/etudiantpublic/${otherProfile.id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'transparent', cursor: 'pointer', minWidth: 0 }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', background: '#ffe3d1', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {otherProfile.avatar_url ? (
              <Image src={otherProfile.avatar_url} alt={otherProfile.full_name || 'Avatar'} fill sizes="38px" style={{ objectFit: 'cover' }} unoptimized />
            ) : <UserIcon />}
          </div>
          <div style={{ minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {otherProfile.full_name || 'Étudiant·e'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {otherProfile.university || otherProfile.role || ''}
            </div>
          </div>
        </button>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
            Aucun message pour le moment.<br />Dis bonjour à {otherProfile.full_name || "l'étudiant·e"} !
          </div>
        ) : messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          const thisDay = dayLabel(msg.created_at)
          const showDaySeparator = thisDay !== lastDay
          lastDay = thisDay
          return (
            <div key={msg.id}>
              {showDaySeparator && (
                <div style={{ textAlign: 'center', margin: '14px 0 10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', background: '#eef2f7', borderRadius: '999px', padding: '4px 12px' }}>
                    {thisDay}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '6px' }}>
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  <MessageContent msg={msg} isMine={isMine} />
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', padding: '0 4px' }}>
                    {timeShort(msg.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div style={{ padding: '10px 16px 12px', background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <div style={{ position: 'relative' }}>
            <ComposerIconBtn icon={<EmojiIcon />} label="Émoji" active={showEmojiPicker}
              onClick={() => { setShowEmojiPicker((prev) => !prev); setShowGifPicker(false) }} />
            {showEmojiPicker && <EmojiPickerPanel onSelect={insertEmoji} />}
          </div>
          <div style={{ position: 'relative' }}>
            <ComposerIconBtn icon={<GifIcon />} label="GIF" active={showGifPicker}
              onClick={() => { setShowGifPicker((prev) => !prev); setShowEmojiPicker(false) }} />
            {showGifPicker && <GifPickerPanel onSelect={handleSendGif} />}
          </div>
          <ComposerIconBtn icon={<ImageIcon />} label="Envoyer un média" disabled={uploading}
            onClick={() => fileInputRef.current?.click()} />
          <ComposerIconBtn icon={<LinkIcon />} label="Partager un lien" disabled={sending}
            onClick={handleSendLink} />
          {uploading && <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>Envoi du fichier...</span>}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            ref={messageTextareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Écrire un message..."
            rows={1}
            style={{
              flex: 1, resize: 'none', border: '1px solid #e5e7eb', borderRadius: '18px', padding: '10px 16px',
              outline: 'none', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.5, maxHeight: '120px', color: '#0f172a',
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            aria-label="Envoyer"
            title="Envoyer"
            style={{
              width: '42px', height: '42px', borderRadius: '50%', border: 'none', flexShrink: 0,
              background: messageText.trim() && !sending ? ORANGE : '#e2e8f0',
              color: messageText.trim() && !sending ? '#fff' : '#94a3b8',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: messageText.trim() && !sending ? 'pointer' : 'not-allowed',
            }}
          >
            <SendIcon />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) await handleFileSelected(file)
            e.target.value = ''
          }}
        />
      </div>
    </main>
  )
}
