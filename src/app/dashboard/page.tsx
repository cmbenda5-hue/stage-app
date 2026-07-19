'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Profile = {
  id?: string
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  city?: string | null
  role?: string | null
  university?: string | null
  semester?: string | null
  internship_sector?: string | null
  internship_company?: string | null
  gratitude_count?: number | null
}

type PostCategory = 'vente' | 'location' | 'job' | 'colocation' | 'groupe_etude'

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
  gratitude_count: number | null
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
  category: PostCategory | null
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
  category: string | null
  author:
    | { id: string; full_name: string | null; avatar_url: string | null; university: string | null; role: string | null; gratitude_count: number | null }
    | { id: string; full_name: string | null; avatar_url: string | null; university: string | null; role: string | null; gratitude_count: number | null }[]
    | null
}

// ─── Comments types ───────────────────────────────────────────────────────────

type CommentAuthor = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

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

// ─── GIF types ────────────────────────────────────────────────────────────────

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

// ─── Messaging types ──────────────────────────────────────────────────────────

type MiniProfile = { id: string; full_name: string | null; avatar_url: string | null }

type SupabaseConversationRow = {
  id: string
  user_a: string
  user_b: string
  last_message: string | null
  last_message_at: string | null
  deleted_by_a?: string | null
  deleted_by_b?: string | null
  user_a_profile: MiniProfile | MiniProfile[] | null
  user_b_profile: MiniProfile | MiniProfile[] | null
}

type ConversationPreview = {
  id: string
  otherUser: MiniProfile
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

// ─── Stage en direct types ────────────────────────────────────────────────────

type MyStage = {
  id: string
  company_name: string
  role: string
  start_date: string | null
  end_date: string | null
}

type StageBuddy = {
  id: string
  full_name: string | null
  avatar_url: string | null
  company_name: string
}

// ─── Score de confiance entreprise types ─────────────────────────────────────

type CompanyRating = {
  avg_salary: number | null
  avg_mentorship: number | null
  avg_ambiance: number | null
  review_count: number
}

type RatingDraft = { salary: number; mentorship: number; ambiance: number }

// ─── Smart Match types ────────────────────────────────────────────────────────

type SmartAction =
  | { type: 'marketplace'; category: PostCategory }
  | { type: 'search'; query: string }
  | { type: 'stagebuddies' }

type SmartNotification = {
  id: string
  message: string
  action: SmartAction
}

// ─── Marketplace catégories ──────────────────────────────────────────────────

const MARKETPLACE_CATEGORIES: { value: PostCategory; label: string; emoji: string }[] = [
  { value: 'vente', label: 'Vente', emoji: '🛒' },
  { value: 'location', label: 'Location / Logement', emoji: '🏠' },
  { value: 'job', label: "Recherche d'emploi", emoji: '💼' },
  { value: 'colocation', label: 'Colocation', emoji: '🏠' },
  { value: 'groupe_etude', label: "Groupe d'études", emoji: '📚' },
]

const CATEGORY_LABELS: Record<string, string> = MARKETPLACE_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }), {} as Record<string, string>
)
const CATEGORY_EMOJIS: Record<string, string> = MARKETPLACE_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.emoji }), {} as Record<string, string>
)

// ─── Universités / FH / TH allemandes (pour le filtre de recherche) ─────────

const GERMAN_UNIVERSITIES = [
  'Hochschule RheinMain',
  'RWTH Aachen',
  'FH Aachen',
  'Universität Augsburg',
  'Hochschule Augsburg',
  'Freie Universität Berlin',
  'Humboldt-Universität zu Berlin',
  'Technische Universität Berlin',
  'Beuth Hochschule für Technik Berlin (HTW Berlin)',
  'Hochschule für Technik und Wirtschaft Berlin',
  'Universität Bielefeld',
  'Ruhr-Universität Bochum',
  'Hochschule Bochum',
  'Rheinische Friedrich-Wilhelms-Universität Bonn',
  'Hochschule Bonn-Rhein-Sieg',
  'Universität Bremen',
  'Hochschule Bremen',
  'Technische Universität Braunschweig',
  'Ostfalia Hochschule',
  'Technische Universität Chemnitz',
  'Technische Universität Darmstadt',
  'Hochschule Darmstadt',
  'Technische Universität Dortmund',
  'Fachhochschule Dortmund',
  'Technische Universität Dresden',
  'Hochschule für Technik und Wirtschaft Dresden',
  'Heinrich-Heine-Universität Düsseldorf',
  'Hochschule Düsseldorf',
  'Universität Duisburg-Essen',
  'Friedrich-Alexander-Universität Erlangen-Nürnberg',
  'Universität Erfurt',
  'Fachhochschule Erfurt',
  'Goethe-Universität Frankfurt am Main',
  'Frankfurt University of Applied Sciences',
  'Albert-Ludwigs-Universität Freiburg',
  'Justus-Liebig-Universität Gießen',
  'Technische Hochschule Mittelhessen',
  'Georg-August-Universität Göttingen',
  'HAWK Hochschule Hildesheim/Holzminden/Göttingen',
  'Universität Greifswald',
  'Universität Hamburg',
  'Technische Universität Hamburg',
  'Hochschule für Angewandte Wissenschaften Hamburg',
  'Gottfried Wilhelm Leibniz Universität Hannover',
  'Hochschule Hannover',
  'Ruprecht-Karls-Universität Heidelberg',
  'SRH Hochschule Heidelberg',
  'Universität Hohenheim',
  'Universität Jena (Friedrich-Schiller-Universität)',
  'Ernst-Abbe-Hochschule Jena',
  'Karlsruher Institut für Technologie (KIT)',
  'Hochschule Karlsruhe',
  'Universität Kassel',
  'Christian-Albrechts-Universität zu Kiel',
  'Fachhochschule Kiel',
  'Universität Koblenz',
  'Universität zu Köln',
  'Technische Hochschule Köln',
  'Universität Konstanz',
  'HTWG Konstanz',
  'Universität Leipzig',
  'HTWK Leipzig',
  'Universität zu Lübeck',
  'Technische Hochschule Lübeck',
  'Leuphana Universität Lüneburg',
  'Johannes Gutenberg-Universität Mainz',
  'Hochschule Mainz',
  'Universität Mannheim',
  'Hochschule Mannheim',
  'Philipps-Universität Marburg',
  'Technische Universität München',
  'Ludwig-Maximilians-Universität München',
  'Hochschule München',
  'Westfälische Wilhelms-Universität Münster',
  'Fachhochschule Münster',
  'Friedrich-Alexander-Universität Nürnberg',
  'Technische Hochschule Nürnberg Georg Simon Ohm',
  'Universität Osnabrück',
  'Hochschule Osnabrück',
  'Universität Paderborn',
  'Universität Potsdam',
  'Fachhochschule Potsdam',
  'Universität Regensburg',
  'Ostbayerische Technische Hochschule Regensburg',
  'Universität Rostock',
  'Universität des Saarlandes',
  'Hochschule für Technik und Wirtschaft des Saarlandes',
  'Universität Siegen',
  'Universität Stuttgart',
  'Hochschule für Technik Stuttgart',
  'Eberhard Karls Universität Tübingen',
  'Universität Ulm',
  'Technische Hochschule Ulm',
  'Bergische Universität Wuppertal',
  'Julius-Maximilians-Universität Würzburg',
  'Technische Hochschule Würzburg-Schweinfurt',
  'Bauhaus-Universität Weimar',
  'Technische Universität Ilmenau',
]

// Liste d'émojis courants, sans dépendance externe (pas de package à installer).
const EMOJI_LIST = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😉', '😎', '🤩',
  '🥳', '😇', '🙂', '🙃', '😅', '😆', '😜', '🤔', '🤗', '🥲',
  '👍', '👎', '👏', '🙌', '🙏', '💪', '✌️', '🤞', '👌', '🤙',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💯',
  '🔥', '✨', '⭐', '🎉', '🎊', '🎓', '📚', '✏️', '💡', '🚀',
  '👀', '😮', '😢', '😭', '😡', '😱', '🥺', '😴', '💼', '🎯',
  '✅', '❌', '📌', '📢', '🙋', '🙋‍♂️', '🙋‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️',
]

const ORANGE = '#ff6b1a'

// ─── Utility ──────────────────────────────────────────────────────────────────

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

function timeAgoShort(dateStr: string | null) {
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

function normalizeCompanyName(name: string) {
  return name.trim().toLowerCase()
}

function isDateActive(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return false
  const today = new Date().toISOString().slice(0, 10)
  return startDate <= today && today <= endDate
}

function rangesOverlap(aStart: string | null, aEnd: string | null, bStart: string | null, bEnd: string | null) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false
  return aStart <= bEnd && bStart <= aEnd
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function FilterIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M10 19h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function UserIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke={ORANGE} strokeWidth="1.8"/><path d="M5.5 19C6.5 15.5 9 14 12 14C15 14 17.5 15.5 18.5 19" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function MessageIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}
function BellIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ShoppingBagIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.8"/><path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function TagIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.59 3.17L4 3a1 1 0 0 0-1 1l.17 5.59a2 2 0 0 0 .66 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></svg>
}
function CameraIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function EditIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
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
function ImageIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.8"/><polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LinkIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
function MoreIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>
}
function HandshakeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12l4-4 4 3 3-3 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 12l4 6 3-2 3 2 4-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TwinIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7"/><circle cx="16" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7"/><path d="M2.5 19c1-3 3-4.5 5.5-4.5S12 16 13 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M11 19c1-3 3-4.5 5.5-4.5S21 16 22 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
}
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
function TreeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.7"/><circle cx="5" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.7"/><circle cx="19" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7.5v5M12 12.5L5 16.7M12 12.5l7 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
}

// ─── Badge "T" (Mon stage / Mes stages) ──────────────────────────────────────

function StageBadgeIcon() {
  return (
    <span style={{ color: '#fff', fontWeight: 900, fontSize: '17px', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1 }}>
      T
    </span>
  )
}
function ListIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor"/></svg>
}
function PlusIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function CloseIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><path d="M6 6l12 12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>
}

// ─── Gratitude badge (🙏) ─────────────────────────────────────────────────────

function GratitudeBadge({ count }: { count: number }) {
  if (!count || count <= 0) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 800,
      color: '#b45309', background: '#fef3c7', borderRadius: '999px', padding: '2px 8px',
    }}>
      🙏 {count}
    </span>
  )
}

// ─── Étoiles cliquables (pour la notation entreprise) ────────────────────────

function StarPicker({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
      <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} étoiles`}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px' }}>
            <StarIcon filled={n <= value} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Modal générique (overlay) ────────────────────────────────────────────────

function ModalOverlay({ onClose, children, maxWidth = '480px' }: { onClose: () => void; children: ReactNode; maxWidth?: string }) {
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth, maxHeight: '85vh', overflowY: 'auto', background: '#fff', borderRadius: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', padding: '22px' }}>
        {children}
      </div>
    </div>
  )
}

// ─── CV vivant : graphe SVG radial ────────────────────────────────────────────

function LivingCvGraph({ profile, myStages }: { profile: Profile; myStages: MyStage[] }) {
  const centerX = 220
  const centerY = 200
  const radius = 140

  const nodes: { label: string; sub?: string; color: string }[] = []
  myStages.slice(0, 5).forEach((s) => nodes.push({ label: s.company_name, sub: s.role, color: ORANGE }))
  if (profile.role) nodes.push({ label: profile.role, sub: 'Filière', color: '#2563eb' })
  if (profile.university) nodes.push({ label: profile.university, sub: 'Université', color: '#0891b2' })
  nodes.push({ label: `🙏 ${profile.gratitude_count ?? 0}`, sub: 'Gratitude reçue', color: '#b45309' })

  const angleStep = (2 * Math.PI) / Math.max(nodes.length, 1)

  return (
    <svg viewBox="0 0 440 400" width="100%" height="360" style={{ display: 'block' }}>
      {nodes.map((node, i) => {
        const angle = i * angleStep - Math.PI / 2
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        return (
          <g key={i}>
            <line x1={centerX} y1={centerY} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1.5" />
          </g>
        )
      })}
      {/* Nœud central */}
      <circle cx={centerX} cy={centerY} r="42" fill="#fff3ea" stroke={ORANGE} strokeWidth="2" />
      <text x={centerX} y={centerY - 2} textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f172a">
        {(profile.full_name || 'Toi').split(' ')[0]}
      </text>
      <text x={centerX} y={centerY + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">Ton profil</text>

      {nodes.map((node, i) => {
        const angle = i * angleStep - Math.PI / 2
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        const shortLabel = node.label.length > 16 ? node.label.slice(0, 15) + '…' : node.label
        return (
          <g key={`node-${i}`}>
            <circle cx={x} cy={y} r="34" fill="#fff" stroke={node.color} strokeWidth="2" />
            <text x={x} y={y - 2} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0f172a">{shortLabel}</text>
            {node.sub && <text x={x} y={y + 11} textAnchor="middle" fontSize="8" fill="#94a3b8">{node.sub}</text>}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Campus Pulse : bandeau d'activité en direct ─────────────────────────────

function CampusPulseTicker({ items }: { items: string[] }) {
  if (items.length === 0) return null
  const looped = [...items, ...items]
  return (
    <div style={{
      width: '100%', overflow: 'hidden', borderRadius: '999px', background: '#fff8f2',
      border: '1px solid #ffe3c8', padding: '9px 0', position: 'relative',
    }}>
      <div style={{
        display: 'flex', gap: '36px', whiteSpace: 'nowrap',
        animation: `campusPulseScroll ${Math.max(items.length * 6, 18)}s linear infinite`,
        paddingLeft: '20px',
      }}>
        {looped.map((text, i) => (
          <span key={i} style={{ fontSize: '13px', color: '#7c4a12', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Emoji Picker (sans dépendance externe) ──────────────────────────────────

function EmojiPickerPanel({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div
      data-emoji-picker
      style={{
        position: 'absolute',
        bottom: '46px',
        left: 0,
        width: '292px',
        maxHeight: '230px',
        overflowY: 'auto',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        boxShadow: '0 14px 32px rgba(0,0,0,0.16)',
        padding: '10px',
        zIndex: 70,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
      }}
    >
      {EMOJI_LIST.map((emoji, i) => (
        <button
          key={`${emoji}-${i}`}
          type="button"
          onClick={() => onSelect(emoji)}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '20px',
            lineHeight: 1,
            padding: '6px 0',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background 0.12s ease',
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
      setError("Clé GIPHY manquante. Vérifie NEXT_PUBLIC_GIPHY_API_KEY dans .env.local puis redémarre le serveur (npm run dev).")
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

  // Charge les GIFs "trending" dès l'ouverture du panneau.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runSearch('')
  }, [])

  // Recherche avec un léger debounce à chaque frappe.
  useEffect(() => {
    const timer = setTimeout(() => {
      void runSearch(query)
    }, 450)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div
      data-emoji-picker
      style={{
        position: 'absolute',
        bottom: '46px',
        left: 0,
        width: '320px',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        boxShadow: '0 14px 32px rgba(0,0,0,0.16)',
        padding: '10px',
        zIndex: 70,
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

// ─── Category Picker (Marketplace) ───────────────────────────────────────────

function CategoryPickerPanel({ onSelect }: { onSelect: (category: PostCategory) => void }) {
  return (
    <div
      data-emoji-picker
      style={{
        position: 'absolute',
        bottom: '46px',
        left: 0,
        width: '240px',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        boxShadow: '0 14px 32px rgba(0,0,0,0.16)',
        padding: '8px',
        zIndex: 70,
      }}
    >
      <div style={{ padding: '6px 8px 8px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Marketplace
      </div>
      {MARKETPLACE_CATEGORIES.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onSelect(c.value)}
          style={{
            width: '100%', textAlign: 'left', border: 'none', background: 'transparent',
            padding: '9px 10px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
            fontWeight: 600, color: '#0f172a', transition: 'background 0.12s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1e6' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          {c.emoji} {c.label}
        </button>
      ))}
    </div>
  )
}

// ─── Video Components ─────────────────────────────────────────────────────────

function AutoPlayVideo({ src, name }: { src: string; name?: string | null }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    el.playsInline = true
    el.loop = false
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          try { await el.play() } catch { }
        } else { el.pause() }
      },
      { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] }
    )
    observer.observe(el)
    return () => { observer.disconnect(); el.pause() }
  }, [])

  async function togglePlay() {
    const el = videoRef.current
    if (!el) return
    if (el.paused) { try { await el.play(); setIsPlaying(true) } catch { } }
    else { el.pause(); setIsPlaying(false) }
  }

  function toggleMute() {
    const el = videoRef.current
    if (!el) return
    el.muted = !el.muted
    setIsMuted(el.muted)
  }

  async function toggleFullscreen() {
    const el = videoRef.current
    if (!el) return
    if (!document.fullscreenElement) { await el.requestFullscreen?.(); setIsFullscreen(true) }
    else { await document.exitFullscreen?.(); setIsFullscreen(false) }
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', background: '#000', position: 'relative' }}>
      <video
        ref={videoRef}
        src={src}
        muted={isMuted}
        controls={false}
        playsInline
        preload="metadata"
        style={{ width: '100%', display: 'block', maxHeight: '520px', objectFit: 'cover' }}
        onClick={togglePlay}
        onPlay={() => { setIsPlaying(true); setIsMuted(videoRef.current?.muted ?? true) }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          const el = videoRef.current
          if (el && el.duration) setProgress((el.currentTime / el.duration) * 100)
        }}
      />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.2)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: ORANGE, transition: 'width 0.1s linear' }} />
      </div>
      <div style={{ position: 'absolute', left: '12px', right: '12px', bottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
          {name || 'Vidéo'}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" onClick={togglePlay} style={{ border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button type="button" onClick={toggleMute} style={{ border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button type="button" onClick={toggleFullscreen} style={{ border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            {isFullscreen ? '⊡' : '⊞'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EmbeddedVideoFrame({ attachment }: { attachment: PostAttachment }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const src = attachment.embed_url || ''
    const observer = new IntersectionObserver(([entry]) => {
      if (!src) return
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) { iframe.src = src }
      else {
        if (src.includes('youtube.com/embed')) iframe.src = src.replace('autoplay=1', 'autoplay=0')
        else if (src.includes('player.vimeo.com/video')) iframe.src = src.replace('autoplay=1', 'autoplay=0')
        else if (src.includes('dailymotion.com/embed/video')) iframe.src = src.replace('autoplay=1', 'autoplay=0')
      }
    }, { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] })
    observer.observe(iframe)
    return () => observer.disconnect()
  }, [attachment.embed_url])

  if (!attachment.embed_url) return null
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
        <iframe ref={iframeRef} src={attachment.embed_url} title={attachment.name || 'Vidéo'}
          allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: '0' }} />
      </div>
    </div>
  )
}

// ─── Hover Underline ──────────────────────────────────────────────────────────

function HoverUnderlineName({ children, size = 18 }: { children: ReactNode; size?: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'inline-block', position: 'relative', cursor: 'pointer', color: '#0f172a', fontWeight: 800, fontSize: `${size}px` }}
    >
      {children}
      <span style={{ position: 'absolute', left: 0, bottom: -2, width: hovered ? '100%' : '0%', height: '2px', background: ORANGE, transition: 'width 0.25s cubic-bezier(.4,0,.2,1)', borderRadius: '999px' }} />
    </span>
  )
}

// ─── Tradefair Logo (uniform orange) ─────────────────────────────────────────

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

// ─── Avatar ───────────────────────────────────────────────────────────────────

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

// ─── Stat Button (with pop animation) ────────────────────────────────────────

function StatBtn({ icon, count, onClick, active, disabled, small }: { icon: ReactNode; count: number; onClick?: () => void; active?: boolean; disabled?: boolean; small?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const [pop, setPop] = useState(false)
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => { if (disabled) return; setPop(true); setTimeout(() => setPop(false), 220); onClick?.() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: 'none',
        background: hovered ? (active ? `${ORANGE}18` : '#f1f5f9') : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        color: active ? ORANGE : '#64748b',
        fontSize: small ? '12px' : '13px',
        fontWeight: 600,
        padding: small ? '4px 8px' : '6px 10px',
        borderRadius: '999px',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      <span style={{ display: 'inline-flex', transform: pop ? 'scale(1.35)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1)' }}>
        {icon}
      </span>
      <span>{count}</span>
    </button>
  )
}

// ─── Composer icon button (round, icon only) ─────────────────────────────────

function ComposerIconBtn({ icon, onClick, label, active, emojiTrigger }: { icon: ReactNode; onClick?: () => void; label: string; active?: boolean; emojiTrigger?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      data-emoji-trigger={emojiTrigger ? 'true' : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '38px', height: '38px', border: 'none', borderRadius: '50%',
        background: (hov || active) ? '#fff1e6' : 'transparent', color: (hov || active) ? ORANGE : '#6b7280',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s ease',
      }}>
      {icon}
    </button>
  )
}

// ─── Comment item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment, liked, likeDisabled, onLike, onNameClick,
}: {
  comment: Comment
  liked: boolean
  likeDisabled: boolean
  onLike: () => void
  onNameClick: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <button type="button" onClick={onNameClick} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
        <Avatar src={comment.author.avatar_url} size={34} name={comment.author.full_name} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: '#f1f5f9', borderRadius: '14px', padding: '8px 12px', display: 'inline-block', maxWidth: '100%' }}>
          <button type="button" onClick={onNameClick} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'block', textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
              {comment.author.full_name || 'Étudiant·e'}
            </div>
          </button>
          <div style={{ fontSize: '14px', color: '#0f172a', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '2px' }}>
            {comment.content}
          </div>
        </div>
        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '4px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{timeAgo(comment.created_at)}</span>
          <StatBtn icon={<HeartIcon filled={liked} size={14} />} count={comment.likes_count} onClick={onLike} active={liked} disabled={likeDisabled} small />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const avatarMenuRef = useRef<HTMLDivElement | null>(null)
  const stagesMenuRef = useRef<HTMLDivElement | null>(null)
  const messagesMenuRef = useRef<HTMLDivElement | null>(null)
  const smartMatchRef = useRef<HTMLDivElement | null>(null)
  const pendingLikesRef = useRef<Set<string>>(new Set())
  const pendingCommentLikesRef = useRef<Set<string>>(new Set())
  const pendingGratitudeRef = useRef<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const postFileInputRef = useRef<HTMLInputElement | null>(null)
  const postTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const commentTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Search bar state ──
  const [searchText, setSearchText] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [filterUniversity, setFilterUniversity] = useState('')
  const [showUniversityFilter, setShowUniversityFilter] = useState(false)
  const [universityFilterSearch, setUniversityFilterSearch] = useState('')

  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false)
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [stagesMenuOpen, setStagesMenuOpen] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [likeInFlight, setLikeInFlight] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [postsLoading, setPostsLoading] = useState(true)
  const [postText, setPostText] = useState('')
  const [postLink, setPostLink] = useState('')
  const [postFiles, setPostFiles] = useState<File[]>([])
  const [postCategory, setPostCategory] = useState<PostCategory | ''>('')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [postMenuOpenId, setPostMenuOpenId] = useState<string | null>(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)
  const [textareaFocused, setTextareaFocused] = useState(false)
  const [publishPulse, setPublishPulse] = useState(false)

  // ── Emoji / GIF picker state ──
  const [showPostEmojiPicker, setShowPostEmojiPicker] = useState(false)
  const [emojiPickerForComment, setEmojiPickerForComment] = useState<string | null>(null)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [selectedGif, setSelectedGif] = useState<GifResult | null>(null)

  // ── Comments state ──
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({})
  const [commentsLoading, setCommentsLoading] = useState<Set<string>>(new Set())
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set())
  const [commentLikeInFlight, setCommentLikeInFlight] = useState<Set<string>>(new Set())
  const [submittingComment, setSubmittingComment] = useState<Set<string>>(new Set())

  // ── Messaging state ──
  const [unreadCount, setUnreadCount] = useState(0)
  const [conversationsPreview, setConversationsPreview] = useState<ConversationPreview[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)

  // ── Smart Match state (Stage Twin + Stage Buddies + Marketplace) ──
  const [smartMatchOpen, setSmartMatchOpen] = useState(false)
  const [smartNotifications, setSmartNotifications] = useState<SmartNotification[]>([])
  const [loadingSmartMatch, setLoadingSmartMatch] = useState(false)

  // ── Chaîne de gratitude (🙏) ──
  const [thankedAuthorIds, setThankedAuthorIds] = useState<Set<string>>(new Set())

  // ── Mode "Stage en direct" ──
  const [myStages, setMyStages] = useState<MyStage[]>([])
  const [activeStage, setActiveStage] = useState<MyStage | null>(null)
  const [stageBuddies, setStageBuddies] = useState<StageBuddy[]>([])
  const [showStageBuddiesModal, setShowStageBuddiesModal] = useState(false)

  // ── Score de confiance entreprise ──
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, RatingDraft>>({})
  const [communityRatings, setCommunityRatings] = useState<Record<string, CompanyRating>>({})
  const [savingRatingFor, setSavingRatingFor] = useState<string | null>(null)
  const [savedRatingFor, setSavedRatingFor] = useState<Set<string>>(new Set())

  // ── CV vivant ──
  const [showCvModal, setShowCvModal] = useState(false)

  const filteredUniversitiesForFilter = useMemo(() => {
    const q = universityFilterSearch.trim().toLowerCase()
    if (!q) return GERMAN_UNIVERSITIES
    return GERMAN_UNIVERSITIES.filter(u => u.toLowerCase().includes(q))
  }, [universityFilterSearch])

  // ── Pouls du campus : phrases générées à partir des posts déjà chargés ──
  const campusPulseItems = useMemo(() => {
    const recentCategoryPosts = posts.filter(p => p.category).slice(0, 8)
    return recentCategoryPosts.map((p) => {
      const name = p.author.full_name?.split(' ')[0] || 'Un·e étudiant·e'
      const emoji = CATEGORY_EMOJIS[p.category as string] || '📢'
      switch (p.category) {
        case 'colocation': return `${emoji} ${name} cherche un·e colocataire`
        case 'location': return `${emoji} ${name} propose ou cherche un logement`
        case 'job': return `${emoji} ${name} recherche un emploi ou une mission`
        case 'vente': return `${emoji} ${name} vend un article`
        case 'groupe_etude': return `${emoji} ${name} cherche un partenaire de révision`
        default: return `${emoji} Nouvelle annonce de ${name}`
      }
    })
  }, [posts])

  // ── Entreprises distinctes issues de mes stages (pour la notation) ──
  const myCompanies = useMemo(() => {
    const map = new Map<string, string>()
    myStages.forEach(s => { map.set(normalizeCompanyName(s.company_name), s.company_name) })
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }))
  }, [myStages])

  // ── Navigation vers le dashboard perso ou le profil public d'un autre étudiant ──
  function goToAuthorProfile(authorId: string) {
    if (!authorId) return
    if (authorId === profile?.id) {
      router.push('/dashboard')
    } else {
      router.push(`/etudiantpublic/${authorId}`)
    }
  }

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (error) { console.error(error); setLoading(false); return }
      setProfile(data as Profile)
      setCurrentUserId(user.id)
      const { data: likedRows } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id)
      setLikedPostIds(new Set((likedRows ?? []).map(r => r.post_id)))
      const { data: likedCommentRows } = await supabase.from('comment_likes').select('comment_id').eq('user_id', user.id)
      setLikedCommentIds(new Set((likedCommentRows ?? []).map(r => r.comment_id)))
      const { data: thankedRows } = await supabase.from('gratitude_thanks').select('receiver_id').eq('giver_id', user.id)
      setThankedAuthorIds(new Set((thankedRows ?? []).map(r => r.receiver_id)))

      // Mode "Stage en direct" : charge mes stages et détermine le stage actif
      const { data: stageRows } = await supabase
        .from('stages')
        .select('id, company_name, role, start_date, end_date')
        .eq('author_id', user.id)
      const stages = (stageRows ?? []) as MyStage[]
      setMyStages(stages)
      const active = stages.find(s => isDateActive(s.start_date, s.end_date)) ?? null
      setActiveStage(active)

      setLoading(false)
    }
    fetchProfile()
  }, [router])

  useEffect(() => {
    async function fetchPosts() {
      setPostsLoading(true)
      try {
        const { data, error } = await supabase.from('posts').select(`
          id, author_id, content, created_at, likes_count, comments_count, shares_count, downloads_count, attachments, category,
          author:profiles!posts_author_id_fkey (id, full_name, avatar_url, university, role, gratitude_count)
        `).order('created_at', { ascending: false })
        if (error) { setPosts([]); return }
        const rows = (data ?? []) as SupabasePostRow[]
        const normalized: Post[] = rows.map(item => ({
          id: item.id, author_id: item.author_id, content: item.content ?? '',
          created_at: item.created_at,
          likes_count: item.likes_count ?? 0, comments_count: item.comments_count ?? 0,
          shares_count: item.shares_count ?? 0, downloads_count: item.downloads_count ?? 0,
          attachments: Array.isArray(item.attachments) ? item.attachments : [],
          category: (item.category as PostCategory | null) ?? null,
          author: {
            id: Array.isArray(item.author) ? item.author[0]?.id ?? '' : item.author?.id ?? '',
            full_name: Array.isArray(item.author) ? item.author[0]?.full_name ?? null : item.author?.full_name ?? null,
            avatar_url: Array.isArray(item.author) ? item.author[0]?.avatar_url ?? null : item.author?.avatar_url ?? null,
            university: Array.isArray(item.author) ? item.author[0]?.university ?? null : item.author?.university ?? null,
            role: Array.isArray(item.author) ? item.author[0]?.role ?? null : item.author?.role ?? null,
            gratitude_count: Array.isArray(item.author) ? item.author[0]?.gratitude_count ?? 0 : item.author?.gratitude_count ?? 0,
          },
        }))
        setPosts(normalized)
      } catch (e) { console.error(e); setPosts([]) }
      finally { setPostsLoading(false) }
    }
    if (profile) fetchPosts()
  }, [profile])

  // ── Stage buddies : étudiants en stage au même moment dans la même entreprise ──
  useEffect(() => {
    async function fetchStageBuddies() {
      if (!activeStage || !profile?.id) { setStageBuddies([]); return }
      try {
        const { data: allStages } = await supabase
          .from('stages')
          .select('author_id, company_name, start_date, end_date, author:profiles!stages_author_id_fkey (id, full_name, avatar_url)')
        if (!allStages) { setStageBuddies([]); return }
        const myKey = normalizeCompanyName(activeStage.company_name)
        const buddies: StageBuddy[] = []
        const seen = new Set<string>()
        for (const row of allStages as Array<{ author_id: string; company_name: string; start_date: string | null; end_date: string | null; author: { id: string; full_name: string | null; avatar_url: string | null } | { id: string; full_name: string | null; avatar_url: string | null }[] | null }>) {
          if (row.author_id === profile.id) continue
          if (normalizeCompanyName(row.company_name) !== myKey) continue
          if (!rangesOverlap(activeStage.start_date, activeStage.end_date, row.start_date, row.end_date)) continue
          if (seen.has(row.author_id)) continue
          const author = Array.isArray(row.author) ? row.author[0] : row.author
          if (!author) continue
          seen.add(row.author_id)
          buddies.push({ id: author.id, full_name: author.full_name, avatar_url: author.avatar_url, company_name: row.company_name })
        }
        setStageBuddies(buddies)
      } catch (e) {
        console.error('FETCH STAGE BUDDIES ERROR:', e)
        setStageBuddies([])
      }
    }
    fetchStageBuddies()
  }, [activeStage, profile])

  // ── Smart Match : Stage Twin + Stage Buddies + suggestions Marketplace ──
  useEffect(() => {
    async function fetchSmartMatch() {
      if (!profile?.id) return
      setLoadingSmartMatch(true)
      try {
        const notifications: SmartNotification[] = []

        // 0) Stage Buddies : en stage au même moment, même entreprise
        if (activeStage && stageBuddies.length > 0) {
          notifications.push({
            id: 'stagebuddies',
            action: { type: 'stagebuddies' },
            message: `🟢 ${stageBuddies.length} étudiant${stageBuddies.length > 1 ? 's' : ''} ${stageBuddies.length > 1 ? 'sont' : 'est'} en stage avec toi chez ${activeStage.company_name} en ce moment !`,
          })
        }

        // 1) Stage Twin : d'autres étudiants ont fait un stage dans la même entreprise (tous historiques)
        const { data: allStages } = await supabase.from('stages').select('author_id, company_name')
        if (allStages && allStages.length > 0) {
          const myCompaniesSet = new Set(
            allStages.filter(s => s.author_id === profile.id).map(s => normalizeCompanyName(s.company_name))
          )
          if (myCompaniesSet.size > 0) {
            const matches = new Map<string, { company: string; authors: Set<string> }>()
            allStages.forEach((s) => {
              const key = normalizeCompanyName(s.company_name)
              if (myCompaniesSet.has(key) && s.author_id !== profile.id) {
                const existing = matches.get(key)
                if (existing) existing.authors.add(s.author_id)
                else matches.set(key, { company: s.company_name, authors: new Set([s.author_id]) })
              }
            })
            Array.from(matches.values()).slice(0, 3).forEach((m, idx) => {
              const count = m.authors.size
              notifications.push({
                id: `twin-${idx}`,
                message: `👯 ${count} étudiant${count > 1 ? 's' : ''} ${count > 1 ? 'ont' : 'a'} aussi fait un stage chez ${m.company}. Découvre leurs profils et demande des conseils !`,
                action: { type: 'search', query: m.company },
              })
            })
          }
        }

        // 2) Colocataires cherchés dans ta université
        if (profile.university) {
          const { data: colocRows } = await supabase
            .from('posts')
            .select('author_id, author:profiles!posts_author_id_fkey (university)')
            .eq('category', 'colocation')
          const colocAuthors = new Set<string>()
          ;(colocRows ?? []).forEach((row: { author_id: string; author: { university: string | null } | { university: string | null }[] | null }) => {
            const author = Array.isArray(row.author) ? row.author[0] : row.author
            if (author?.university === profile.university && row.author_id !== profile.id) {
              colocAuthors.add(row.author_id)
            }
          })
          if (colocAuthors.size > 0) {
            notifications.push({
              id: 'coloc',
              action: { type: 'marketplace', category: 'colocation' },
              message: `🏠 ${colocAuthors.size} étudiant${colocAuthors.size > 1 ? 's' : ''} de ton université cherche${colocAuthors.size > 1 ? 'nt' : ''} un·e colocataire.`,
            })
          }
        }

        // 3) Partenaires de révision dans ta filière
        if (profile.role) {
          const { data: studyRows } = await supabase
            .from('posts')
            .select('author_id, author:profiles!posts_author_id_fkey (role)')
            .eq('category', 'groupe_etude')
          const studyAuthors = new Set<string>()
          ;(studyRows ?? []).forEach((row: { author_id: string; author: { role: string | null } | { role: string | null }[] | null }) => {
            const author = Array.isArray(row.author) ? row.author[0] : row.author
            if (author?.role === profile.role && row.author_id !== profile.id) {
              studyAuthors.add(row.author_id)
            }
          })
          if (studyAuthors.size > 0) {
            notifications.push({
              id: 'study',
              action: { type: 'marketplace', category: 'groupe_etude' },
              message: `📚 ${studyAuthors.size} étudiant${studyAuthors.size > 1 ? 's' : ''} de ton cursus cherche${studyAuthors.size > 1 ? 'nt' : ''} un partenaire pour réviser.`,
            })
          }
        }

        // 4) Offres d'emploi partagées récemment
        const { data: jobRows } = await supabase.from('posts').select('author_id').eq('category', 'job')
        const jobAuthors = new Set<string>((jobRows ?? []).map((r: { author_id: string }) => r.author_id).filter((id: string) => id !== profile.id))
        if (jobAuthors.size > 0) {
          notifications.push({
            id: 'job',
            action: { type: 'marketplace', category: 'job' },
            message: `💼 ${jobAuthors.size} offre${jobAuthors.size > 1 ? 's' : ''} d'emploi ou de mission partagée${jobAuthors.size > 1 ? 's' : ''} récemment.`,
          })
        }

        setSmartNotifications(notifications)
      } catch (e) {
        console.error('SMART MATCH ERROR:', e)
        setSmartNotifications([])
      } finally {
        setLoadingSmartMatch(false)
      }
    }
    fetchSmartMatch()
  }, [profile, activeStage, stageBuddies])

  // ── Messaging: compteur total non-lus + aperçu conversations ──
  async function fetchUnreadTotal() {
    const { data, error } = await supabase.rpc('get_chat_total_unread_count')
    if (!error) setUnreadCount(Number(data ?? 0))
  }

  async function fetchConversationsPreview() {
    if (!currentUserId) return
    setLoadingConversations(true)
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          id, user_a, user_b, last_message, last_message_at, deleted_by_a, deleted_by_b,
          user_a_profile:profiles!chat_conversations_user_a_fkey (id, full_name, avatar_url),
          user_b_profile:profiles!chat_conversations_user_b_fkey (id, full_name, avatar_url)
        `)
        .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(5)
      if (error) throw error

      const { data: unreadRows } = await supabase.rpc('get_chat_conversation_unread_counts')
      const unreadMap = new Map<string, number>()
      ;(unreadRows ?? []).forEach((row: { conversation_id: string; unread_count: number }) => {
        unreadMap.set(row.conversation_id, Number(row.unread_count))
      })

      const rows = (data ?? []) as SupabaseConversationRow[]
      const normalized: ConversationPreview[] = rows
        .filter(row => {
          const hiddenForMe = row.user_a === currentUserId ? row.deleted_by_a : row.deleted_by_b
          return !hiddenForMe
        })
        .map(row => {
          const profileA = Array.isArray(row.user_a_profile) ? row.user_a_profile[0] : row.user_a_profile
          const profileB = Array.isArray(row.user_b_profile) ? row.user_b_profile[0] : row.user_b_profile
          const otherUser: MiniProfile = row.user_a === currentUserId
            ? (profileB ?? { id: row.user_b, full_name: null, avatar_url: null })
            : (profileA ?? { id: row.user_a, full_name: null, avatar_url: null })
          return {
            id: row.id,
            otherUser,
            last_message: row.last_message,
            last_message_at: row.last_message_at,
            unread_count: unreadMap.get(row.id) ?? 0,
          }
        })
      setConversationsPreview(normalized)
    } catch (e) {
      console.error('FETCH CONVERSATIONS PREVIEW ERROR:', e)
      setConversationsPreview([])
    } finally {
      setLoadingConversations(false)
    }
  }

  useEffect(() => {
    if (!currentUserId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUnreadTotal()
    fetchConversationsPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId])

  // ── Rafraîchit le badge en temps réel dès qu'un nouveau message arrive ──
  useEffect(() => {
    if (!currentUserId) return
    const channel = supabase
      .channel('dashboard-messages-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        fetchUnreadTotal()
        if (messagesOpen) fetchConversationsPreview()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, messagesOpen])

  function handleToggleMessages() {
    setMessagesOpen((prev) => {
      const willOpen = !prev
      if (willOpen) fetchConversationsPreview()
      return willOpen
    })
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node
      if (wrapperRef.current && !wrapperRef.current.contains(t)) {
        setIsSearchFocused(false)
        setShowUniversityFilter(false)
      }
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(t)) setIsAvatarMenuOpen(false)
      if (stagesMenuRef.current && !stagesMenuRef.current.contains(t)) setStagesMenuOpen(false)
      if (messagesMenuRef.current && !messagesMenuRef.current.contains(t)) setMessagesOpen(false)
      if (smartMatchRef.current && !smartMatchRef.current.contains(t)) setSmartMatchOpen(false)
      const inMenu = (t as HTMLElement)?.closest?.('[data-post-menu]')
      const inBtn = (t as HTMLElement)?.closest?.('[data-post-menu-button]')
      if (!inMenu && !inBtn) setPostMenuOpenId(null)
      const inEmojiPicker = (t as HTMLElement)?.closest?.('[data-emoji-picker]')
      const inEmojiTrigger = (t as HTMLElement)?.closest?.('[data-emoji-trigger]')
      if (!inEmojiPicker && !inEmojiTrigger) {
        setShowPostEmojiPicker(false)
        setEmojiPickerForComment(null)
        setShowGifPicker(false)
        setShowCategoryPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleToggleSmartMatch() {
    setSmartMatchOpen((prev) => !prev)
  }

  function handleSmartNotificationClick(action: SmartAction) {
    setSmartMatchOpen(false)
    if (action.type === 'marketplace') {
      router.push(`/marketplace?category=${action.category}`)
    } else if (action.type === 'search') {
      router.push(`/etudiantsecteur?q=${encodeURIComponent(action.query)}`)
    } else {
      setShowStageBuddiesModal(true)
    }
  }

  // ── Recherche : nom d'étudiant, filière, ou entreprise, avec filtre université optionnel ──
  function handleSearchSubmit() {
    const q = searchText.trim()
    if (!q && !filterUniversity) return
    const params = new URLSearchParams()
    if (filterUniversity) params.set('university', filterUniversity)
    if (q) params.set('q', q)
    router.push(`/etudiantsecteur?${params.toString()}`)
  }

  function handleSelectUniversityFilter(u: string) {
    setFilterUniversity(u)
    setShowUniversityFilter(false)
    setUniversityFilterSearch('')
  }

  function handleClearUniversityFilter() {
    setFilterUniversity('')
  }

  async function handleLogout() {
    await supabase.auth.signOut(); router.push('/login')
  }

  // ── Chaîne de gratitude : dire "Merci" à l'auteur d'un post ──
  async function handleGiveGratitude(authorId: string) {
    if (!currentUserId || authorId === currentUserId) return
    if (thankedAuthorIds.has(authorId)) return
    if (pendingGratitudeRef.current.has(authorId)) return
    pendingGratitudeRef.current.add(authorId)

    setThankedAuthorIds(prev => new Set(prev).add(authorId))
    setPosts(prev => prev.map(p => p.author_id === authorId
      ? { ...p, author: { ...p.author, gratitude_count: (p.author.gratitude_count ?? 0) + 1 } }
      : p))

    try {
      const { error } = await supabase.rpc('give_gratitude', { p_receiver_id: authorId })
      if (error) throw error
    } catch (e) {
      console.error('GIVE GRATITUDE ERROR:', e)
      setThankedAuthorIds(prev => { const n = new Set(prev); n.delete(authorId); return n })
      setPosts(prev => prev.map(p => p.author_id === authorId
        ? { ...p, author: { ...p.author, gratitude_count: Math.max(0, (p.author.gratitude_count ?? 1) - 1) } }
        : p))
    } finally {
      pendingGratitudeRef.current.delete(authorId)
    }
  }

  // ── Score de confiance entreprise ──
  function openRatingModal() {
    setShowRatingModal(true)
    myCompanies.forEach((c) => {
      if (!ratingDrafts[c.key]) {
        setRatingDrafts(prev => ({ ...prev, [c.key]: { salary: 0, mentorship: 0, ambiance: 0 } }))
      }
      supabase.rpc('get_company_rating', { p_company_name: c.name }).then(({ data, error }) => {
        if (error) { console.error('GET COMPANY RATING ERROR:', error); return }
        const row = Array.isArray(data) ? data[0] : data
        if (row) {
          setCommunityRatings(prev => ({
            ...prev,
            [c.key]: {
              avg_salary: row.avg_salary, avg_mentorship: row.avg_mentorship,
              avg_ambiance: row.avg_ambiance, review_count: Number(row.review_count ?? 0),
            },
          }))
        }
      })
    })
  }

  function updateRatingDraft(companyKey: string, field: keyof RatingDraft, value: number) {
    setRatingDrafts(prev => ({
      ...prev,
      [companyKey]: { ...(prev[companyKey] ?? { salary: 0, mentorship: 0, ambiance: 0 }), [field]: value },
    }))
  }

  async function submitCompanyRating(companyKey: string, companyName: string) {
    const draft = ratingDrafts[companyKey]
    if (!draft || draft.salary === 0 || draft.mentorship === 0 || draft.ambiance === 0) {
      alert('Merci de donner une note (1 à 5) pour les trois critères.')
      return
    }
    setSavingRatingFor(companyKey)
    try {
      const { error } = await supabase.rpc('upsert_company_rating', {
        p_company_name: companyName,
        p_salary_rating: draft.salary,
        p_mentorship_rating: draft.mentorship,
        p_ambiance_rating: draft.ambiance,
      })
      if (error) throw error
      setSavedRatingFor(prev => new Set(prev).add(companyKey))
      const { data } = await supabase.rpc('get_company_rating', { p_company_name: companyName })
      const row = Array.isArray(data) ? data[0] : data
      if (row) {
        setCommunityRatings(prev => ({
          ...prev,
          [companyKey]: {
            avg_salary: row.avg_salary, avg_mentorship: row.avg_mentorship,
            avg_ambiance: row.avg_ambiance, review_count: Number(row.review_count ?? 0),
          },
        }))
      }
    } catch (e) {
      console.error('SUBMIT COMPANY RATING ERROR:', e)
      alert("Impossible d'enregistrer ta note pour le moment.")
    } finally {
      setSavingRatingFor(null)
    }
  }

  // ── Insertion d'émoji au niveau du curseur (post principal) ──
  function insertEmojiIntoPost(emoji: string) {
    const textarea = postTextareaRef.current
    if (!textarea) {
      setPostText((prev) => prev + emoji)
      return
    }
    const start = textarea.selectionStart ?? postText.length
    const end = textarea.selectionEnd ?? postText.length
    const newText = postText.slice(0, start) + emoji + postText.slice(end)
    setPostText(newText)
    requestAnimationFrame(() => {
      textarea.focus()
      const pos = start + emoji.length
      textarea.setSelectionRange(pos, pos)
    })
  }

  // ── Insertion d'émoji au niveau du curseur (commentaire) ──
  function insertEmojiIntoComment(postId: string, emoji: string) {
    const textarea = commentTextareaRefs.current[postId]
    const current = commentTexts[postId] || ''
    if (!textarea) {
      setCommentTexts((prev) => ({ ...prev, [postId]: current + emoji }))
      return
    }
    const start = textarea.selectionStart ?? current.length
    const end = textarea.selectionEnd ?? current.length
    const newText = current.slice(0, start) + emoji + current.slice(end)
    setCommentTexts((prev) => ({ ...prev, [postId]: newText }))
    requestAnimationFrame(() => {
      textarea.focus()
      const pos = start + emoji.length
      textarea.setSelectionRange(pos, pos)
    })
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
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`
      } catch { return null }
    }
    if (provider === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/)
      if (!match?.[1]) return null
      return `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1&title=0&byline=0&portrait=0`
    }
    if (provider === 'dailymotion') {
      const match = url.match(/video\/([a-zA-Z0-9]+)/)
      if (!match?.[1]) return null
      return `https://www.dailymotion.com/embed/video/${match[1]}?autoplay=1&mute=1`
    }
    return null
  }

  function getFileType(file: File): PostAttachment['type'] {
    const name = file.name.toLowerCase()
    if (file.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return 'image'
    if (file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/.test(name)) return 'video'
    if (file.type === 'application/pdf' || /\.pdf$/.test(name)) return 'pdf'
    if (file.type.includes('document') || /\.(doc|docx|ppt|pptx|xls|xlsx|txt|rtf)$/.test(name)) return 'document'
    return 'other'
  }

  async function uploadPostFile(file: File) {
    const safeName = `${Date.now()}-${file.name}`.replace(/\s+/g, '-')
    const path = `posts/${profile?.id ?? 'unknown'}/${safeName}`
    const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('media').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleCreatePost() {
    if (!profile) return
    if (!postText.trim() && !postLink.trim() && postFiles.length === 0 && !selectedGif) return
    setIsCreatingPost(true)
    try {
      const uploadedAttachments: PostAttachment[] = []
      if (postLink.trim()) {
        const link = postLink.trim()
        const provider = getVideoProvider(link)
        const embedUrl = provider ? getEmbedUrl(link) : null
        uploadedAttachments.push({
          id: crypto.randomUUID(),
          type: provider ? 'video_embed' : isExternalLink(link) ? 'link' : 'other',
          url: link, name: link, mime_type: 'text/html', embed_url: embedUrl, provider,
        })
      }
      if (selectedGif) {
        uploadedAttachments.push({
          id: crypto.randomUUID(),
          type: 'image',
          url: selectedGif.url,
          name: selectedGif.title || 'GIF',
          mime_type: 'image/gif',
        })
      }
      for (const file of postFiles) {
        const url = await uploadPostFile(file)
        uploadedAttachments.push({ id: crypto.randomUUID(), type: getFileType(file), url, name: file.name, mime_type: file.type || null })
      }
      const payload = {
        author_id: profile.id, content: postText.trim(), attachments: uploadedAttachments,
        likes_count: 0, comments_count: 0, shares_count: 0, downloads_count: 0,
        category: postCategory || null,
      }
      const { data, error } = await supabase.from('posts').insert(payload).select().single()
      if (error) throw error
      const newPost: Post = {
        id: data.id, author_id: data.author_id, content: data.content ?? '',
        created_at: data.created_at, likes_count: 0, comments_count: 0, shares_count: 0, downloads_count: 0,
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        category: (data.category as PostCategory | null) ?? null,
        author: {
          id: profile.id ?? '', full_name: profile.full_name ?? null, avatar_url: profile.avatar_url ?? null,
          university: profile.university ?? null, role: profile.role ?? null, gratitude_count: profile.gratitude_count ?? 0,
        },
      }
      setPosts(prev => [newPost, ...prev])
      setPostText(''); setPostLink(''); setPostFiles([]); setSelectedGif(null); setPostCategory('')
      if (postFileInputRef.current) postFileInputRef.current.value = ''
      setTextareaFocused(false)
      setShowPostEmojiPicker(false)
      setShowGifPicker(false)
      setShowCategoryPicker(false)
      setPublishPulse(true); setTimeout(() => setPublishPulse(false), 500)
    } catch (e) { console.error(e); alert("Impossible de publier le post pour le moment.") }
    finally { setIsCreatingPost(false) }
  }

  async function handleDeletePost(postId: string) {
    if (!window.confirm("Supprimer ce post ?")) return
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) { alert("Non connecté."); return }
    const { data, error } = await supabase.from('posts').delete().eq('id', postId).eq('author_id', authData.user.id).select('id')
    if (error) { alert(error.message); return }
    if (!data || data.length === 0) { alert("Suppression bloquée."); return }
    setPosts(prev => prev.filter(p => p.id !== postId))
    setPostMenuOpenId(null)
  }

  async function handleLikePost(postId: string) {
    if (!currentUserId) return
    if (pendingLikesRef.current.has(postId)) return
    pendingLikesRef.current.add(postId)
    setLikeInFlight(prev => new Set(prev).add(postId))

    const alreadyLiked = likedPostIds.has(postId)
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: alreadyLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 } : p))
    setLikedPostIds(prev => {
      const n = new Set(prev)
      if (alreadyLiked) n.delete(postId)
      else n.add(postId)
      return n
    })

    try {
      const { error } = await supabase.rpc('toggle_post_like', { p_post_id: postId })
      if (error) throw error

      const { data: freshPost, error: fetchError } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single()
      if (!fetchError && freshPost) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: freshPost.likes_count ?? p.likes_count } : p))
      }
    } catch (e) {
      console.error('LIKE ERROR:', e)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: alreadyLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) } : p))
      setLikedPostIds(prev => {
        const n = new Set(prev)
        if (alreadyLiked) n.add(postId)
        else n.delete(postId)
        return n
      })
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

  async function handleAvatarUpload(file: File) {
    if (!profile) return
    try {
      const safeName = `${Date.now()}-${file.name}`.replace(/\s+/g, '-')
      const path = `avatars/${profile.id}/${safeName}`
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile.id)
      if (updateError) throw updateError
      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : prev)
      alert('Photo de profil mise à jour avec succès.')
    } catch (err) { console.error(err); alert("Impossible d'importer la photo.") }
  }

  // ── Comments logic ──────────────────────────────────────────────────────────

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
    } catch (e) {
      console.error('FETCH COMMENTS ERROR:', e)
    } finally {
      setCommentsLoading(prev => { const n = new Set(prev); n.delete(postId); return n })
    }
  }

  function handleToggleComments(postId: string) {
    const willOpen = openCommentPostId !== postId
    setOpenCommentPostId(willOpen ? postId : null)
    if (willOpen && !commentsByPost[postId]) {
      fetchCommentsForPost(postId)
    }
  }

  async function handleAddComment(postId: string) {
    if (!profile?.id) return
    const text = (commentTexts[postId] || '').trim()
    if (!text) return
    setSubmittingComment(prev => new Set(prev).add(postId))
    try {
      const { data, error } = await supabase.from('comments').insert({
        post_id: postId, author_id: profile.id, content: text,
      }).select().single()
      if (error) throw error
      const newComment: Comment = {
        id: data.id, post_id: postId, author_id: profile.id,
        author: { id: profile.id, full_name: profile.full_name ?? null, avatar_url: profile.avatar_url ?? null },
        content: data.content, created_at: data.created_at, likes_count: 0,
      }
      setCommentsByPost(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), newComment] }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      setCommentTexts(prev => ({ ...prev, [postId]: '' }))
      setEmojiPickerForComment(null)

      const { data: freshPost, error: fetchError } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('id', postId)
        .single()
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
      [postId]: (prev[postId] ?? []).map(c => c.id === commentId
        ? { ...c, likes_count: alreadyLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1 }
        : c),
    }))
    setLikedCommentIds(prev => {
      const n = new Set(prev)
      if (alreadyLiked) n.delete(commentId)
      else n.add(commentId)
      return n
    })

    try {
      const { error } = await supabase.rpc('toggle_comment_like', { p_comment_id: commentId })
      if (error) throw error

      const { data: freshComment, error: fetchError } = await supabase
        .from('comments')
        .select('likes_count')
        .eq('id', commentId)
        .single()
      if (!fetchError && freshComment) {
        setCommentsByPost(prev => ({
          ...prev,
          [postId]: (prev[postId] ?? []).map(c => c.id === commentId
            ? { ...c, likes_count: freshComment.likes_count ?? c.likes_count }
            : c),
        }))
      }
    } catch (e) {
      console.error('COMMENT LIKE ERROR:', e)
      setCommentsByPost(prev => ({
        ...prev,
        [postId]: (prev[postId] ?? []).map(c => c.id === commentId
          ? { ...c, likes_count: alreadyLiked ? c.likes_count + 1 : Math.max(0, c.likes_count - 1) }
          : c),
      }))
      setLikedCommentIds(prev => {
        const n = new Set(prev)
        if (alreadyLiked) n.add(commentId)
        else n.delete(commentId)
        return n
      })
    } finally {
      pendingCommentLikesRef.current.delete(commentId)
      setCommentLikeInFlight(prev => { const n = new Set(prev); n.delete(commentId); return n })
    }
  }

  const avatarHasImage = !!profile?.avatar_url

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '18px 22px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', fontSize: '14px', color: '#64748b' }}>
          Chargement du tableau de bord...
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a' }}>
      <style>{`
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 ${ORANGE}55 } 100% { box-shadow: 0 0 0 16px ${ORANGE}00 } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes campusPulseScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes livePulse { 0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5) } 70% { box-shadow: 0 0 0 8px rgba(22,163,74,0) } 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0) } }
        .post-card { animation: fadeSlideIn 0.3s ease; }
        .live-dot { animation: livePulse 1.8s infinite; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* TOP BAR */}
        <div style={{
          width: '100%', display: 'grid', gridTemplateColumns: '220px 1fr 260px', alignItems: 'center', gap: '14px',
          padding: '10px 14px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '24px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)', position: 'sticky', top: '16px', zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'start', marginLeft: '8px' }}>
            <TradefairLogo onClick={() => router.push('/dashboard')} />
          </div>

          {/* Search : filtre université + recherche libre (étudiant / filière / entreprise) */}
          <div ref={wrapperRef} style={{ width: '100%', maxWidth: '820px', minWidth: 0, position: 'relative', justifySelf: 'center', zIndex: 30 }}>
            <div style={{
              border: `1px solid ${isSearchFocused ? ORANGE : '#dfe1e5'}`, borderRadius: '999px',
              padding: '0 6px 0 14px', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: isSearchFocused ? `0 10px 24px ${ORANGE}22` : '0 1px 6px rgba(32,33,36,0.10)',
              background: '#ffffff', transition: 'all 0.18s ease', minHeight: '42px', width: '100%',
            }}>
              <span style={{ color: isSearchFocused ? ORANGE : '#9aa0a6', flexShrink: 0 }}><SearchIcon /></span>

              {filterUniversity && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff3ea', color: ORANGE,
                  borderRadius: '999px', padding: '4px 8px 4px 10px', fontSize: '12px', fontWeight: 700,
                  flexShrink: 0, maxWidth: '220px',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filterUniversity}</span>
                  <button
                    type="button"
                    onClick={handleClearUniversityFilter}
                    aria-label="Retirer le filtre université"
                    style={{ border: 'none', background: 'transparent', color: ORANGE, cursor: 'pointer', display: 'inline-flex', padding: 0 }}
                  >
                    <CloseIcon />
                  </button>
                </span>
              )}

              <input
                type="text" value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchSubmit() } }}
                placeholder="Rechercher un·e étudiant·e, une filière, une entreprise..."
                style={{ border: 'none', outline: 'none', flex: 1, minWidth: 0, fontSize: '13px', background: 'transparent', height: '40px', color: '#111827' }}
              />

              <button
                type="button"
                onClick={() => { setShowUniversityFilter((prev) => !prev); setIsSearchFocused(true) }}
                aria-label="Filtrer par université"
                title="Filtrer par université / FH / TH"
                style={{
                  width: '32px', height: '32px', borderRadius: '999px', border: 'none', flexShrink: 0,
                  background: (showUniversityFilter || filterUniversity) ? ORANGE : '#f1f5f9',
                  color: (showUniversityFilter || filterUniversity) ? '#fff' : '#64748b',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <FilterIcon />
              </button>
            </div>

            {showUniversityFilter && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'white',
                border: `1px solid ${ORANGE}`, borderRadius: '18px', boxShadow: `0 12px 22px ${ORANGE}1f`,
                overflow: 'hidden', zIndex: 20,
              }}>
                <div style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
                  <input
                    type="text"
                    value={universityFilterSearch}
                    onChange={(e) => setUniversityFilterSearch(e.target.value)}
                    placeholder="Rechercher une université / FH / TH..."
                    autoFocus
                    style={{
                      width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: '10px',
                      padding: '8px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#0f172a',
                    }}
                  />
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {filteredUniversitiesForFilter.length === 0 ? (
                    <div style={{ padding: '14px 18px', color: '#666', fontSize: '14px' }}>Aucune université trouvée.</div>
                  ) : filteredUniversitiesForFilter.map((u) => {
                    const active = filterUniversity === u
                    return (
                      <button key={u} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelectUniversityFilter(u)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none',
                          background: active ? '#fff3ea' : 'white',
                          cursor: 'pointer', fontSize: '13px', fontWeight: active ? 700 : 500,
                          color: active ? ORANGE : '#111827', borderBottom: '1px solid #f3f4f6', transition: 'all 0.15s ease',
                        }}>
                        {u}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', justifySelf: 'end' }}>

            {/* Smart Match : cloche de notifications (Stage Buddies + Stage Twin + Marketplace) */}
            <div ref={smartMatchRef} style={{ position: 'relative' }}>
              <button type="button" onClick={handleToggleSmartMatch} aria-label="Smart Match" title="Smart Match"
                style={{
                  width: '44px', height: '44px', border: '1px solid #f1f5f9', borderRadius: '999px', background: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 1px 6px rgba(32,33,36,0.08)', transition: 'transform 0.18s ease', color: '#374151',
                  position: 'relative',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}>
                <BellIcon />
                {smartNotifications.length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px', minWidth: '20px', height: '20px',
                    borderRadius: '999px', background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: 800,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                    border: '2px solid #fff', lineHeight: 1,
                  }}>
                    {smartNotifications.length > 9 ? '9+' : smartNotifications.length}
                  </span>
                )}
              </button>
              {smartMatchOpen && (
                <div style={{ position: 'absolute', right: 0, top: '54px', width: '350px', maxHeight: '440px', overflow: 'hidden', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 14px 36px rgba(0,0,0,0.14)', zIndex: 80, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Smart Match</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Stage en direct, jumeaux de stage &amp; suggestions</div>
                  </div>
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {loadingSmartMatch ? (
                      <div style={{ padding: '18px', color: '#6b7280', fontSize: '14px' }}>Recherche de correspondances...</div>
                    ) : smartNotifications.length === 0 ? (
                      <div style={{ padding: '18px', color: '#6b7280', fontSize: '14px' }}>Aucune suggestion pour le moment.</div>
                    ) : smartNotifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => handleSmartNotificationClick(notif.action)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px',
                          border: 'none', borderBottom: '1px solid #f3f4f6', background: '#fff', cursor: 'pointer', textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '999px', background: '#fff3ea', color: ORANGE, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {notif.id === 'stagebuddies' ? '🟢' : notif.id.startsWith('twin') ? <TwinIcon /> : <BellIcon />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>{notif.message}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mon stage / Mes stages */}
            <div ref={stagesMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setStagesMenuOpen((prev) => !prev)}
                aria-label="Mon stage / Mes stages"
                title="Mon stage / Mes stages"
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
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Mon stage / Mes stages</div>
                  </div>
                  <div style={{ padding: '8px' }}>
                    <MenuItem
                      icon={<ListIcon />}
                      label="Ma liste de stages"
                      onClick={() => { setStagesMenuOpen(false); router.push('/stageslist') }}
                    />
                    <MenuItem
                      icon={<PlusIcon />}
                      label="Ajouter un stage"
                      onClick={() => { setStagesMenuOpen(false); router.push('/newstage') }}
                    />
                    <MenuItem
                      icon={<StarIcon filled />}
                      label="Noter mes entreprises"
                      onClick={() => { setStagesMenuOpen(false); openRatingModal() }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Messages reçus (avec badge non-lus) */}
            <div ref={messagesMenuRef} style={{ position: 'relative' }}>
              <button type="button" onClick={handleToggleMessages} aria-label="Messages reçus" title="Messages reçus"
                style={{
                  width: '44px', height: '44px', border: '1px solid #f1f5f9', borderRadius: '999px', background: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 1px 6px rgba(32,33,36,0.08)', transition: 'transform 0.18s ease', color: '#374151',
                  position: 'relative',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}>
                <MessageIcon />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px', minWidth: '20px', height: '20px',
                    borderRadius: '999px', background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: 800,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                    border: '2px solid #fff', lineHeight: 1,
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {messagesOpen && (
                <div style={{ position: 'absolute', right: 0, top: '54px', width: '360px', maxHeight: '520px', overflow: 'hidden', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 14px 36px rgba(0,0,0,0.14)', zIndex: 80, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: '#fafafa' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Messages reçus</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{conversationsPreview.length} conversation{conversationsPreview.length > 1 ? 's' : ''}</div>
                    </div>
                    <button type="button" onClick={() => setMessagesOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#6b7280', fontWeight: 700 }}>Fermer</button>
                  </div>
                  <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {loadingConversations ? (
                      <div style={{ padding: '18px', color: '#6b7280', fontSize: '14px' }}>Chargement...</div>
                    ) : conversationsPreview.length === 0 ? (
                      <div style={{ padding: '18px', color: '#6b7280', fontSize: '14px' }}>Aucun message reçu.</div>
                    ) : conversationsPreview.map((conv) => (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => { setMessagesOpen(false); router.push(`/chat/${conv.otherUser.id}`) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                          border: 'none', borderBottom: '1px solid #f3f4f6', background: '#fff', cursor: 'pointer', textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                      >
                        <Avatar src={conv.otherUser.avatar_url} size={38} name={conv.otherUser.full_name} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: conv.unread_count > 0 ? 800 : 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {conv.otherUser.full_name || 'Étudiant·e'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{timeAgoShort(conv.last_message_at)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontSize: '12px', color: conv.unread_count > 0 ? '#0f172a' : '#64748b', fontWeight: conv.unread_count > 0 ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {conv.last_message || 'Nouvelle conversation'}
                            </span>
                            {conv.unread_count > 0 && (
                              <span style={{ minWidth: '18px', height: '18px', borderRadius: '999px', background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>
                                {conv.unread_count > 9 ? '9+' : conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setMessagesOpen(false); router.push('/chatlist') }}
                    style={{ border: 'none', borderTop: '1px solid #f3f4f6', background: '#fafafa', color: ORANGE, fontSize: '13px', fontWeight: 800, padding: '12px', cursor: 'pointer' }}
                  >
                    Voir tous mes messages
                  </button>
                </div>
              )}
            </div>

            <div ref={avatarMenuRef} style={{ position: 'relative' }}>
              <button type="button" onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                style={{
                  width: '44px', height: '44px', border: '1px solid #f1f5f9', borderRadius: '999px', background: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: isAvatarMenuOpen ? `0 0 0 2px ${ORANGE}` : '0 1px 6px rgba(32,33,36,0.08)',
                  transition: 'box-shadow 0.18s ease', overflow: 'hidden', padding: 0, position: 'relative',
                }}
                aria-label="Ouvrir le menu du profil" title="Profil">
                {avatarHasImage ? (
                  <Image
                    src={profile?.avatar_url ?? ''}
                    alt="Photo de profil"
                    fill
                    sizes="48px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                    priority
                  />
                ) : <UserIcon />}
              </button>
              {isAvatarMenuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '52px', width: '320px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', boxShadow: '0 10px 28px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 50 }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: '#ffe3d1', flexShrink: 0, position: 'relative' }}>
                        {avatarHasImage ? (
                          <Image
                            src={profile?.avatar_url ?? ''}
                            alt="Photo de profil"
                            fill
                            sizes="42px"
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon /></div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || 'Mon profil'}</p>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#6b7280' }}>Gérer mon compte</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '8px' }}>
                    <MenuItem icon={<CameraIcon />} label="Télécharger photo de profil" onClick={() => fileInputRef.current?.click()} />
                    <MenuItem icon={<EditIcon />} label="Modifier profil" onClick={() => router.push('/edit')} />
                    <MenuItem icon={<TreeIcon />} label="Mon CV vivant" onClick={() => { setIsAvatarMenuOpen(false); setShowCvModal(true) }} />
                    <MenuItem icon={<ShoppingBagIcon />} label="Marketplace" onClick={() => { setIsAvatarMenuOpen(false); router.push('/marketplace') }} />
                    <MenuItem icon={<LogoutIcon />} label="Déconnexion" onClick={handleLogout} danger />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* POULS DU CAMPUS : bandeau d'activité en direct */}
        {campusPulseItems.length > 0 && (
          <CampusPulseTicker items={campusPulseItems} />
        )}

        {/* CONTENT */}
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '6px' }}>

          {/* PROFILE CARD */}
          <section style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', background: '#ffe3d1', position: 'relative', flexShrink: 0 }}>
                {avatarHasImage ? (
                  <Image
                    src={profile?.avatar_url ?? ''}
                    alt="Photo de profil"
                    fill
                    sizes="72px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                    priority
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon /></div>
                )}
                {activeStage && (
                  <span className="live-dot" style={{
                    position: 'absolute', bottom: '2px', right: '2px', width: '16px', height: '16px', borderRadius: '999px',
                    background: '#16a34a', border: '2px solid #fff',
                  }} />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Cliquer sur le nom redirige vers le dashboard de l'étudiant connecté (comportement identique à celui utilisé pour les auteurs de posts) */}
                  <button
                    type="button"
                    onClick={() => profile?.id && goToAuthorProfile(profile.id)}
                    style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, fontSize: '18px', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <HoverUnderlineName>{profile?.full_name || "Nom de l'étudiant·e"}</HoverUnderlineName>
                  </button>
                  <GratitudeBadge count={profile?.gratitude_count ?? 0} />
                </div>
                {activeStage && (
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 800, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '999px', padding: '3px 10px' }}>
                      🟢 En stage chez {activeStage.company_name}
                    </span>
                  </div>
                )}
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '3px' }}>{profile?.university || "Nom de l'université"}</div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '3px' }}>{profile?.role || 'Filière étudiée'}</div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>{profile?.semester || 'Semestre non renseigné'}</div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/edit')}
                style={{
                  border: `1px solid ${ORANGE}`, background: '#fff', color: ORANGE, borderRadius: '999px',
                  padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                Modifier le profil
              </button>
            </div>
          </section>

          {/* POST COMPOSER */}
          <section style={{
            width: '100%', border: `1px solid ${textareaFocused ? ORANGE : '#e5e7eb'}`, borderRadius: '18px', background: '#fff',
            padding: '14px', boxShadow: textareaFocused ? `0 1px 12px ${ORANGE}22` : '0 1px 8px rgba(0,0,0,0.04)',
            boxSizing: 'border-box', transition: 'all 0.2s ease',
            ...(publishPulse ? { animation: 'pulseGlow 0.5s ease-out' } : {}),
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: '#ffe3d1', position: 'relative', flexShrink: 0 }}>
                {avatarHasImage ? (
                  <Image
                    src={profile?.avatar_url ?? ''}
                    alt="Photo de profil"
                    fill
                    sizes="56px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon /></div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <textarea
                  ref={postTextareaRef}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  onFocus={() => setTextareaFocused(true)}
                  onBlur={() => setTextareaFocused(false)}
                  placeholder="Quoi de neuf ?"
                  style={{ width: '100%', minHeight: '110px', resize: 'vertical', border: 'none', outline: 'none', fontSize: '16px', lineHeight: 1.5, color: '#0f172a', background: 'transparent', padding: '6px 0 0', fontFamily: 'inherit' }}
                />

                {postCategory && (
                  <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff3ea', color: ORANGE, borderRadius: '999px', padding: '5px 10px 5px 12px', fontSize: '12px', fontWeight: 700 }}>
                    {CATEGORY_EMOJIS[postCategory]} Marketplace · {CATEGORY_LABELS[postCategory]}
                    <button type="button" onClick={() => setPostCategory('')} aria-label="Retirer la catégorie"
                      style={{ border: 'none', background: 'transparent', color: ORANGE, cursor: 'pointer', display: 'inline-flex', padding: 0 }}>
                      <CloseIcon />
                    </button>
                  </div>
                )}

                {postLink.trim() && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '12px', background: '#fff5ee', border: `1px solid #ffd0ad`, fontSize: '13px', color: ORANGE, wordBreak: 'break-word' }}>
                    <strong>Lien ajouté :</strong> {postLink.trim()}
                  </div>
                )}

                {selectedGif && (
                  <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedGif.preview}
                      alt={selectedGif.title || 'GIF'}
                      style={{ maxWidth: '220px', maxHeight: '160px', borderRadius: '14px', display: 'block', border: '1px solid #e5e7eb', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedGif(null)}
                      style={{ position: 'absolute', top: '6px', right: '6px', border: 'none', background: 'rgba(15,23,42,0.75)', color: '#fff', borderRadius: '999px', width: '26px', height: '26px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
                      aria-label="Retirer le GIF"
                    >×</button>
                  </div>
                )}

                {postFiles.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {postFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} style={{ padding: '10px 12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e5e7eb', fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button type="button" onClick={() => setPostFiles((prev) => prev.filter((_, i) => i !== index))}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626', fontSize: '14px', fontWeight: 700 }}>Supprimer</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'center' }}>
                <ComposerIconBtn icon={<ImageIcon />} label="Ajouter des médias" onClick={() => postFileInputRef.current?.click()} />
                <ComposerIconBtn icon={<LinkIcon />} label="Ajouter un lien" onClick={() => { const link = window.prompt('Colle ton lien ici'); if (link) setPostLink(link.trim()) }} />
                <div style={{ position: 'relative' }}>
                  <ComposerIconBtn
                    icon={<EmojiIcon />}
                    label="Émoji"
                    active={showPostEmojiPicker}
                    emojiTrigger
                    onClick={() => setShowPostEmojiPicker((prev) => !prev)}
                  />
                  {showPostEmojiPicker && (
                    <EmojiPickerPanel onSelect={(emoji) => insertEmojiIntoPost(emoji)} />
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <ComposerIconBtn
                    icon={<GifIcon />}
                    label="GIF"
                    active={showGifPicker}
                    emojiTrigger
                    onClick={() => setShowGifPicker((prev) => !prev)}
                  />
                  {showGifPicker && (
                    <GifPickerPanel onSelect={(gif) => { setSelectedGif(gif); setShowGifPicker(false) }} />
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <ComposerIconBtn
                    icon={<TagIcon />}
                    label="Marketplace"
                    active={showCategoryPicker || !!postCategory}
                    emojiTrigger
                    onClick={() => setShowCategoryPicker((prev) => !prev)}
                  />
                  {showCategoryPicker && (
                    <CategoryPickerPanel onSelect={(c) => { setPostCategory(c); setShowCategoryPicker(false) }} />
                  )}
                </div>
                {postLink.trim() && (
                  <button type="button" onClick={() => setPostLink('')} style={{ border: 'none', background: 'transparent', color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginLeft: '6px' }}>Retirer le lien</button>
                )}
              </div>

              <button
                type="button" onClick={handleCreatePost} disabled={isCreatingPost}
                style={{
                  border: 'none', background: isCreatingPost ? '#ffcfa8' : ORANGE,
                  color: '#fff', borderRadius: '999px', padding: '10px 18px', fontSize: '14px', fontWeight: 800,
                  cursor: isCreatingPost ? 'not-allowed' : 'pointer', boxShadow: isCreatingPost ? 'none' : `0 4px 14px ${ORANGE}55`,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseDown={(e) => { if (!isCreatingPost) e.currentTarget.style.transform = 'scale(0.96)' }}
                onMouseUp={(e) => { if (!isCreatingPost) e.currentTarget.style.transform = 'scale(1)' }}
              >
                {isCreatingPost ? 'Publication...' : 'Publier'}
              </button>
            </div>

            <input ref={postFileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf"
              onChange={(e) => { if (e.target.files) setPostFiles((prev) => [...prev, ...Array.from(e.target.files!)]) }} style={{ display: 'none' }} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) await handleAvatarUpload(file)
                e.target.value = ''
              }}
            />
          </section>

          {/* FEED */}
          <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {postsLoading ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '18px', color: '#64748b', fontSize: '14px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                Chargement du fil d&apos;actualité...
              </div>
            ) : posts.length === 0 ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '22px', color: '#64748b', fontSize: '14px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                Aucun post pour le moment.
              </div>
            ) : posts.map((post, index) => {
              const isOwner = profile?.id === post.author_id
              const liked = likedPostIds.has(post.id)
              const alreadyThanked = thankedAuthorIds.has(post.author_id)
              const postComments = commentsByPost[post.id] ?? []
              const isCommentsLoading = commentsLoading.has(post.id)
              const isSubmittingComment = submittingComment.has(post.id)

              return (
                <article key={post.id} className="post-card" style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '14px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <button type="button" onClick={() => goToAuthorProfile(post.author_id)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                      <Avatar src={post.author.avatar_url} size={52} name={post.author.full_name} priority={index === 0} />
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                            <button type="button" onClick={() => goToAuthorProfile(post.author_id)} style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, cursor: 'pointer' }}>
                              <HoverUnderlineName size={15}>{post.author.full_name || 'Étudiant·e'}</HoverUnderlineName>
                            </button>
                            <GratitudeBadge count={post.author.gratitude_count ?? 0} />
                            <span style={{ color: '#94a3b8' }}>·</span>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>{timeAgo(post.created_at)}</span>
                            {post.category && (
                              <span style={{ fontSize: '11px', fontWeight: 800, color: ORANGE, background: '#fff3ea', borderRadius: '999px', padding: '2px 9px' }}>
                                {CATEGORY_EMOJIS[post.category]} {CATEGORY_LABELS[post.category]}
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: '4px', color: '#64748b', fontSize: '13px' }}>
                            {post.author.university || post.author.role || 'Étudiant·e'}
                          </div>
                        </div>
                        {isOwner && (
                          <div style={{ position: 'relative' }}>
                            <button type="button" data-post-menu-button onClick={() => setPostMenuOpenId((prev) => (prev === post.id ? null : post.id))}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', fontSize: '22px', lineHeight: 1, padding: '4px 6px', borderRadius: '999px' }}
                              aria-label="Actions du post" title="Actions"><MoreIcon /></button>
                            {postMenuOpenId === post.id && (
                              <div data-post-menu style={{ position: 'absolute', right: 0, top: '34px', width: '220px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', boxShadow: '0 14px 28px rgba(0,0,0,0.12)', zIndex: 20, overflow: 'hidden' }}>
                                <button type="button" onClick={() => handleDeletePost(post.id)}
                                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '12px 14px', textAlign: 'left', cursor: 'pointer', color: '#dc2626', fontSize: '14px', fontWeight: 700 }}>
                                  Supprimer ce post
                                </button>
                              </div>
                            )}
                          </div>
                        )}
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
                              {attachment.type === 'video' && <AutoPlayVideo src={attachment.url} name={attachment.name} />}
                              {attachment.type === 'video_embed' && <EmbeddedVideoFrame attachment={attachment} />}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <StatBtn
                            icon={<HeartIcon filled={liked} />}
                            count={post.likes_count}
                            onClick={() => handleLikePost(post.id)}
                            active={liked}
                            disabled={likeInFlight.has(post.id)}
                          />
                          <StatBtn icon={<CommentIcon />} count={post.comments_count} onClick={() => handleToggleComments(post.id)} active={openCommentPostId === post.id} />
                          <StatBtn icon={<ShareIcon />} count={post.shares_count} onClick={() => handleSharePost(post)} />
                          {!isOwner && (
                            <button
                              type="button"
                              onClick={() => handleGiveGratitude(post.author_id)}
                              disabled={alreadyThanked}
                              title={alreadyThanked ? 'Merci envoyé' : `Dire merci à ${post.author.full_name || "cet·te étudiant·e"}`}
                              style={{
                                border: 'none', background: alreadyThanked ? '#fef3c7' : 'transparent',
                                color: alreadyThanked ? '#b45309' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                fontSize: '13px', fontWeight: 700, padding: '6px 10px', borderRadius: '999px',
                                cursor: alreadyThanked ? 'default' : 'pointer', transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => { if (!alreadyThanked) e.currentTarget.style.background = '#fef3c7' }}
                              onMouseLeave={(e) => { if (!alreadyThanked) e.currentTarget.style.background = 'transparent' }}
                            >
                              <HandshakeIcon /> {alreadyThanked ? 'Merci envoyé' : 'Merci'}
                            </button>
                          )}
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
                            <Avatar src={profile?.avatar_url} size={36} name={profile?.full_name} />
                            <div style={{ flex: 1 }}>
                              <textarea
                                ref={(el) => { commentTextareaRefs.current[post.id] = el }}
                                value={commentTexts[post.id] || ''}
                                onChange={(e) => setCommentTexts((p) => ({ ...p, [post.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleAddComment(post.id)
                                  }
                                }}
                                placeholder="Écrire un commentaire..."
                                style={{ width: '100%', minHeight: '72px', resize: 'vertical', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '10px 12px', outline: 'none', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.5, background: '#fff', color: '#0f172a' }}
                              />
                              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ position: 'relative' }}>
                                  <button
                                    type="button"
                                    data-emoji-trigger="true"
                                    onClick={() => setEmojiPickerForComment((prev) => (prev === post.id ? null : post.id))}
                                    title="Émoji"
                                    aria-label="Émoji"
                                    style={{
                                      border: 'none',
                                      background: emojiPickerForComment === post.id ? '#fff1e6' : 'transparent',
                                      color: emojiPickerForComment === post.id ? ORANGE : '#6b7280',
                                      borderRadius: '50%', width: '34px', height: '34px',
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      cursor: 'pointer', transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <EmojiIcon />
                                  </button>
                                  {emojiPickerForComment === post.id && (
                                    <EmojiPickerPanel onSelect={(emoji) => insertEmojiIntoComment(post.id, emoji)} />
                                  )}
                                </div>
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
            Tradefair Dashboard
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

      {/* MODAL : Stage buddies (mode Stage en direct) */}
      {showStageBuddiesModal && (
        <ModalOverlay onClose={() => setShowStageBuddiesModal(false)} maxWidth="420px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>🟢 Stage en direct</h2>
            <button type="button" onClick={() => setShowStageBuddiesModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><CloseIcon /></button>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
            {activeStage && `Ces étudiants sont en stage avec toi chez ${activeStage.company_name} en ce moment.`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stageBuddies.map((b) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '10px 12px' }}>
                <Avatar src={b.avatar_url} name={b.full_name} size={40} />
                <div style={{ flex: 1, minWidth: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.full_name || 'Étudiant·e'}
                </div>
                <button type="button" onClick={() => { setShowStageBuddiesModal(false); router.push(`/chat/${b.id}`) }}
                  style={{ border: 'none', background: ORANGE, color: '#fff', borderRadius: '999px', padding: '8px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                  Discuter
                </button>
              </div>
            ))}
          </div>
        </ModalOverlay>
      )}

      {/* MODAL : Score de confiance entreprise */}
      {showRatingModal && (
        <ModalOverlay onClose={() => setShowRatingModal(false)} maxWidth="520px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>⭐ Noter mes entreprises</h2>
            <button type="button" onClick={() => setShowRatingModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><CloseIcon /></button>
          </div>
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#64748b' }}>
            Réservé aux étudiant·e·s ayant réellement fait un stage dans l&apos;entreprise concernée.
          </p>
          {myCompanies.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#94a3b8', padding: '18px 0', textAlign: 'center' }}>
              Ajoute d&apos;abord un stage pour pouvoir noter une entreprise.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {myCompanies.map((c) => {
                const draft = ratingDrafts[c.key] ?? { salary: 0, mentorship: 0, ambiance: 0 }
                const community = communityRatings[c.key]
                const saved = savedRatingFor.has(c.key)
                return (
                  <div key={c.key} style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{c.name}</span>
                      {community && community.review_count > 0 && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{community.review_count} avis</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
                      <StarPicker label="Rémunération" value={draft.salary} onChange={(v) => updateRatingDraft(c.key, 'salary', v)} />
                      <StarPicker label="Encadrement" value={draft.mentorship} onChange={(v) => updateRatingDraft(c.key, 'mentorship', v)} />
                      <StarPicker label="Ambiance" value={draft.ambiance} onChange={(v) => updateRatingDraft(c.key, 'ambiance', v)} />
                    </div>
                    {community && community.review_count > 0 && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                        Moyenne communauté : 💰 {community.avg_salary ?? '–'}/5 · 🎓 {community.avg_mentorship ?? '–'}/5 · 😊 {community.avg_ambiance ?? '–'}/5
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => submitCompanyRating(c.key, c.name)}
                      disabled={savingRatingFor === c.key}
                      style={{
                        border: 'none', background: saved ? '#dcfce7' : ORANGE, color: saved ? '#15803d' : '#fff',
                        borderRadius: '999px', padding: '9px 16px', fontSize: '13px', fontWeight: 800,
                        cursor: savingRatingFor === c.key ? 'not-allowed' : 'pointer', width: '100%',
                      }}
                    >
                      {savingRatingFor === c.key ? 'Enregistrement...' : saved ? '✓ Note enregistrée' : 'Enregistrer ma note'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </ModalOverlay>
      )}

      {/* MODAL : CV vivant */}
      {showCvModal && profile && (
        <ModalOverlay onClose={() => setShowCvModal(false)} maxWidth="540px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>🪢 Mon CV vivant</h2>
            <button type="button" onClick={() => setShowCvModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><CloseIcon /></button>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>
            Ton parcours construit automatiquement à partir de ce que tu as réellement fait sur Tradefair — pas un PDF que tu rédiges.
          </p>
          <LivingCvGraph profile={profile} myStages={myStages} />
        </ModalOverlay>
      )}

    </main>
  )
}

// ─── Mini components ──────────────────────────────────────────────────────────

function MenuItem({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick?: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', border: 'none', background: hov ? (danger ? '#fff5f5' : '#fff8f3') : 'transparent', borderRadius: '12px', padding: '12px 12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: danger ? '#dc2626' : '#111827', fontSize: '14px', textAlign: 'left' }}>
      {icon}<span>{label}</span>
    </button>
  )
}
