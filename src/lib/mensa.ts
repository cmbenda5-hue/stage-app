// ─── Catalogue des cantines (Studierendenwerk Frankfurt am Main - swffm.de) ──
// Utilisé par app/api/mensa (scraping serveur) et app/dashboard/MensaPanel
// (affichage). Pour ajouter une cantine : trouver son "slug" dans l'URL
// https://www.swffm.de/essen-trinken/speiseplaene/<slug> puis l'ajouter ici.

export type CanteenSlug =
  | 'mensa-accent'
  | 'mensa-point'
  | 'mensa-ruesselsheim'
  | 'mensa-casino'
  | 'mensa-esswerk'
  | 'cafeteria-bockenheim'
  | 'hochschule-fuer-musik-und-darstellende-kunst'

export type CanteenOption = {
  slug: CanteenSlug
  name: string
  city: string
}

export const CANTEEN_CATALOG: CanteenOption[] = [
  { slug: 'mensa-accent', name: 'Mensa accent', city: 'Wiesbaden' },
  { slug: 'mensa-point', name: 'Mensa POINT', city: 'Wiesbaden' },
  { slug: 'mensa-ruesselsheim', name: 'Mensa Rüsselsheim', city: 'Rüsselsheim' },
  { slug: 'mensa-casino', name: 'Mensa Casino', city: 'Frankfurt am Main' },
  { slug: 'mensa-esswerk', name: 'Mensa essWERK', city: 'Frankfurt am Main' },
  { slug: 'cafeteria-bockenheim', name: 'Cafeteria Bockenheim', city: 'Frankfurt am Main' },
  { slug: 'hochschule-fuer-musik-und-darstellende-kunst', name: 'Mensa HfMDK', city: 'Frankfurt am Main' },
]

// Association université (telle que saisie dans profiles.university) -> cantines.
// Clé normalisée : minuscules, espaces superflus retirés. Ajoute une entrée par
// université pour lui associer une ou plusieurs cantines.
const UNIVERSITY_CANTEENS: Record<string, CanteenSlug[]> = {
  'hochschule rheinmain': ['mensa-ruesselsheim', 'mensa-accent'],
  'frankfurt university of applied sciences': ['mensa-esswerk'],
  'goethe-universität frankfurt am main': ['mensa-casino', 'cafeteria-bockenheim'],
  'hochschule für musik und darstellende kunst': ['hochschule-fuer-musik-und-darstellende-kunst'],
}

function normalizeUniversity(value: string): string {
  return value.trim().toLowerCase()
}

export function getCanteensForUniversity(university: string | null | undefined): CanteenOption[] {
  if (!university) return []
  const slugs = UNIVERSITY_CANTEENS[normalizeUniversity(university)]
  if (!slugs) return []
  return CANTEEN_CATALOG.filter((c) => slugs.includes(c.slug))
}
