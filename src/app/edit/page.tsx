'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  city?: string | null
  role?: string | null
  university?: string | null
  semester?: string | null
  internship_sector?: string | null
  internship_company?: string | null
}

const ORANGE = '#ff6b1a'

const SEMESTER_OPTIONS = [
  'Semestre 1', 'Semestre 2', 'Semestre 3', 'Semestre 4',
  'Semestre 5', 'Semestre 6', 'Semestre 7', 'Semestre 8',
  'Semestre 9', 'Semestre 10',
]

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSITÉS / FH / TH ALLEMANDES + FILIÈRES
//
// La liste "Hochschule RheinMain" est complète (fournie par l'utilisateur,
// Bachelor + Master fusionnés sans doublons).
// Les autres établissements utilisent un catalogue générique de filières
// courantes en Allemagne — à remplacer/compléter au cas par cas en ajoutant
// une entrée dédiée dans UNIVERSITY_PROGRAMS (même format que RheinMain).
// ─────────────────────────────────────────────────────────────────────────────

const GENERIC_PROGRAMS = [
  'Betriebswirtschaftslehre',
  'Wirtschaftsinformatik',
  'Wirtschaftsingenieurwesen',
  'Informatik',
  'Angewandte Informatik',
  'Elektrotechnik',
  'Maschinenbau',
  'Bauingenieurwesen',
  'Architektur',
  'Mechatronik',
  'Medieninformatik',
  'Medientechnik',
  'Kommunikationsdesign',
  'International Business',
  'International Management',
  'Soziale Arbeit',
  'Psychologie',
  'Rechtswissenschaften',
  'Wirtschaftsrecht',
  'Medizintechnik',
  'Gesundheitsökonomie',
  'Umwelttechnik',
  'Chemie',
  'Physik',
  'Mathematik',
  'Biologie',
  'Pädagogik',
  'Germanistik',
  'Anglistik',
  'Politikwissenschaft',
  'Media & Communication',
]

const HOCHSCHULE_RHEINMAIN_PROGRAMS = [
  'Advanced Media Technology',
  'AI and Advanced Information Technologies',
  'Angewandte Informatik',
  'Angewandte Physik',
  'Angewandte Physik – Angewandte Ingenieurwissenschaften',
  'Applied Physics',
  'Architektur',
  'Architektur | Bauen mit Bestand',
  'Audiovisuelle Technologien und Künstliche Intelligenz – Angewandte Ingenieurwissenschaften',
  'Baukulturerbe',
  'Baukulturerbe | Sustainable Heritage Conservation',
  'Bauingenieurwesen',
  'Berufsbegleitendes Ingenieurstudium Elektrotechnik',
  'Berufsbegleitendes Ingenieurstudium Maschinenbau',
  'Biomedical Engineering',
  'Bio- und Umwelttechnik',
  'Business & Law',
  'Business Administration',
  'Controlling and Finance',
  'Digital Business Management',
  'Electrical Engineering – Connected Systems',
  'Elektro- und Luftfahrttechnik',
  'Elektro- und Luftfahrttechnik – Angewandte Ingenieurwissenschaften',
  'Elektrotechnik',
  'Elektrotechnik – Angewandte Ingenieurwissenschaften',
  'Elektrotechnik und Management (berufsbegleitend)',
  'Financial Services (dual)',
  'Gesundheitsbezogene Soziale Arbeit',
  'Gesundheitsökonomie',
  'Immobilienmanagement',
  'Informatik – Software und System Engineering',
  'Innenarchitektur – Conceptual Design',
  'Innovative Produktgestaltung und Produktion (berufsbegleitend)',
  'Interdisziplinäre Ingenieurwissenschaften',
  'International Management',
  'Internationale Soziale Arbeit',
  'Internationales Wirtschaftsingenieurwesen',
  'Kindheit, Jugend, (Ganztags)Schule',
  'Kommunikationsdesign',
  'Kommunikationsdesign – Crossmedia Spaces',
  'Konstruktiver Ingenieurbau / Baumanagement',
  'Kooperatives Ingenieurstudium Elektrotechnik',
  'Kooperatives Ingenieurstudium Mechatronik',
  'Kooperatives Ingenieurstudium Medientechnik',
  'Management im Gesundheitswesen',
  'Maschinenbau',
  'Maschinenbau – Angewandte Ingenieurwissenschaften',
  'Mechatronik – Angewandte Ingenieurwissenschaften',
  'Media & Design Management',
  'Media Management',
  'Media: Conception & Production',
  'Medieninformatik',
  'Medieninformatik – Intelligente und Interaktive Systeme',
  'Medientechnik',
  'Medizintechnik',
  'Medizintechnik – Angewandte Ingenieurwissenschaften',
  'Mobilitätsmanagement',
  'Nachhaltige Mobilität',
  'Psychosoziale Beratung und Coaching',
  'Real Estate',
  'Sales and Marketing Management',
  'Screen Arts',
  'Soziale Arbeit',
  'Soziale Arbeit BASA-online',
  'Soziale Arbeit mit dem Schwerpunkt Bildung',
  'Soziale Arbeit mit dem Schwerpunkt Sozialraumentwicklung und -organisation',
  'Soziales Recht',
  'Steuerrecht (dual)',
  'Studienrichtung Fahrzeugtechnik',
  'Studienrichtung Internationale Technische Zusammenarbeit',
  'Studienrichtung Mechatronik',
  'Studienrichtung Medizintechnik',
  'Studienrichtung Virtuelle Produkt- und Prozessentwicklung',
  'Sustainable and Digital Aviation',
  'Sustainable Engineering – Angewandte Ingenieurwissenschaften',
  'Technische Informatik',
  'Umweltmanagement und Stadtplanung in Ballungsräumen',
  'Umwelttechnik',
  'Umwelttechnik – Angewandte Ingenieurwissenschaften',
  'Wirtschaftsinformatik',
  'Wirtschaftsinformatik – Information Systems & Digital Transformation',
  'Wirtschaftsingenieurwesen',
  'Wirtschaftsingenieurwesen – Angewandte Ingenieurwissenschaften',
  'Wirtschaftsingenieurwesen (berufsbegleitend)',
  'Wirtschaftsingenieurwesen – Information Systems & Digital Transformation',
  'Wirtschaftsrecht',
]

// Liste des universités / FH / TH allemandes (choix courants).
// Ajoute librement d'autres noms ici : ils utiliseront GENERIC_PROGRAMS
// tant qu'aucune entrée dédiée n'existe dans UNIVERSITY_PROGRAMS.
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

function getProgramsForUniversity(university: string): string[] {
  if (university === 'Hochschule RheinMain') return HOCHSCHULE_RHEINMAIN_PROGRAMS
  return GENERIC_PROGRAMS
}

function UserIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke={ORANGE} strokeWidth="1.8" />
      <path d="M5.5 19C6.5 15.5 9 14 12 14C15 14 17.5 15.5 18.5 19" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
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
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}

export default function EditProfilePage() {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [university, setUniversity] = useState('')
  const [filiere, setFiliere] = useState('')
  const [semester, setSemester] = useState('')

  const [universityTouched, setUniversityTouched] = useState(false)
  const [filiereTouched, setFiliereTouched] = useState(false)

  const availablePrograms = useMemo(() => getProgramsForUniversity(university), [university])

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (error) { console.error(error); setErrorMsg("Impossible de charger le profil."); setLoading(false); return }

      const p = data as Profile
      setProfile(p)
      setFullName(p.full_name ?? '')
      setUniversity(p.university ?? '')
      setFiliere(p.role ?? '')
      setSemester(p.semester ?? '')
      setLoading(false)
    }
    fetchProfile()
  }, [router])

  function handleUniversityChange(value: string) {
    setUniversity(value)
    // Si la filière déjà choisie n'existe plus dans la nouvelle université, on la réinitialise.
    const programs = getProgramsForUniversity(value)
    if (!programs.includes(filiere)) {
      setFiliere('')
    }
  }

  const universityError = universityTouched && !university.trim()
  const filiereError = filiereTouched && !filiere.trim()

  async function handleSave() {
    if (!profile) return
    setUniversityTouched(true)
    setFiliereTouched(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!university.trim() || !filiere.trim()) {
      setErrorMsg("Merci de sélectionner ton université et ta filière avant d'enregistrer.")
      return
    }

    setSaving(true)
    try {
      const updates = {
        full_name: fullName.trim() || null,
        university: university.trim(),
        role: filiere.trim(),
        semester: semester.trim() || null,
      }
      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
      if (error) throw error
      setSuccessMsg('Profil mis à jour avec succès.')
      setTimeout(() => router.push('/dashboard'), 700)
    } catch (e) {
      console.error('UPDATE PROFILE ERROR:', e)
      setErrorMsg("Impossible d'enregistrer les modifications pour le moment.")
    } finally {
      setSaving(false)
    }
  }

  const avatarHasImage = !!profile?.avatar_url

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '18px 22px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', fontSize: '14px', color: '#64748b' }}>
          Chargement du profil...
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px 16px', color: '#0f172a' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

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
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Modifier mon profil</h1>
        </div>

        {/* FORM CARD */}
        <section style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '18px', background: '#fff', padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>

          {/* Avatar preview (lecture seule ici, la modification se fait depuis le dashboard) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', background: '#ffe3d1', position: 'relative', flexShrink: 0 }}>
              {avatarHasImage ? (
                <Image src={profile?.avatar_url ?? ''} alt="Photo de profil" fill sizes="64px" style={{ objectFit: 'cover' }} unoptimized />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon /></div>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name || "Nom de l'étudiant·e"}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                La photo de profil se change depuis le menu du tableau de bord.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <FieldLabel>Nom complet</FieldLabel>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocusedField('full_name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Ex. Amina Benali"
                style={{
                  ...inputStyle,
                  borderColor: focusedField === 'full_name' ? ORANGE : '#e5e7eb',
                  boxShadow: focusedField === 'full_name' ? `0 0 0 3px ${ORANGE}22` : 'none',
                }}
              />
            </div>

            <div>
              <FieldLabel required>Université</FieldLabel>
              <select
                value={university}
                onChange={(e) => handleUniversityChange(e.target.value)}
                onFocus={() => setFocusedField('university')}
                onBlur={() => { setFocusedField(null); setUniversityTouched(true) }}
                style={{
                  ...inputStyle,
                  borderColor: universityError ? '#dc2626' : focusedField === 'university' ? ORANGE : '#e5e7eb',
                  boxShadow: universityError ? '0 0 0 3px #fecaca55' : focusedField === 'university' ? `0 0 0 3px ${ORANGE}22` : 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Sélectionner une université / FH / TH</option>
                {GERMAN_UNIVERSITIES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {universityError && (
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#dc2626' }}>Ce champ est obligatoire.</p>
              )}
            </div>

            <div>
              <FieldLabel required>Filière</FieldLabel>
              <select
                value={filiere}
                onChange={(e) => setFiliere(e.target.value)}
                onFocus={() => setFocusedField('filiere')}
                onBlur={() => { setFocusedField(null); setFiliereTouched(true) }}
                disabled={!university}
                style={{
                  ...inputStyle,
                  borderColor: filiereError ? '#dc2626' : focusedField === 'filiere' ? ORANGE : '#e5e7eb',
                  boxShadow: filiereError ? '0 0 0 3px #fecaca55' : focusedField === 'filiere' ? `0 0 0 3px ${ORANGE}22` : 'none',
                  cursor: university ? 'pointer' : 'not-allowed',
                  opacity: university ? 1 : 0.6,
                }}
              >
                <option value="">
                  {university ? 'Sélectionner une filière' : "Choisis d'abord ton université"}
                </option>
                {availablePrograms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {filiereError && (
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#dc2626' }}>Ce champ est obligatoire.</p>
              )}
            </div>

            <div>
              <FieldLabel>Semestre</FieldLabel>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                onFocus={() => setFocusedField('semester')}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle,
                  borderColor: focusedField === 'semester' ? ORANGE : '#e5e7eb',
                  boxShadow: focusedField === 'semester' ? `0 0 0 3px ${ORANGE}22` : 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Sélectionner un semestre</option>
                {SEMESTER_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {errorMsg && (
            <div style={{ marginTop: '16px', padding: '10px 12px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px' }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ marginTop: '16px', padding: '10px 12px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: '13px' }}>
              {successMsg}
            </div>
          )}

          <div style={{ marginTop: '22px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              disabled={saving}
              style={{
                border: '1px solid #e5e7eb', background: '#fff', color: '#374151', borderRadius: '999px',
                padding: '10px 18px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                border: 'none', background: saving ? '#ffcfa8' : ORANGE, color: '#fff', borderRadius: '999px',
                padding: '10px 20px', fontSize: '14px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : `0 4px 14px ${ORANGE}55`,
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
