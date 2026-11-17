import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { corsHeaders } from '@/lib/cors'
import { CANTEEN_CATALOG } from '@/lib/mensa'

// Cheerio utilise l'environnement Node.js classique, pas le runtime Edge.
export const runtime = 'nodejs'

// Recharge le cache serveur toutes les 30 minutes.
export const revalidate = 1800

const GERMAN_MONTHS: Record<string, number> = {
  Januar: 1,
  Februar: 2,
  März: 3,
  April: 4,
  Mai: 5,
  Juni: 6,
  Juli: 7,
  August: 8,
  September: 9,
  Oktober: 10,
  November: 11,
  Dezember: 12,
}

type MensaDish = {
  name: string
  tag: string | null
  allergens: string | null
  price: string | null
}

type MensaDay = {
  label: string
  isToday: boolean
  dishes: MensaDish[]
}

type MensaResult = {
  slug: string
  name: string
  city: string
  sourceUrl: string
  days: MensaDay[]
  error?: string
}

function parseDayLabel(
  label: string,
): { day: number; month: number } | null {
  const match = label.match(
    /(\d{1,2})\.\s*([A-Za-zäöüÄÖÜ]+)/,
  )

  if (!match) return null

  const day = parseInt(match[1], 10)
  const month = GERMAN_MONTHS[match[2]]

  if (!month) return null

  return { day, month }
}

async function fetchCanteenMenu(
  slug: string,
  name: string,
  city: string,
): Promise<MensaResult> {
  const sourceUrl =
    `https://www.swffm.de/essen-trinken/speiseplaene/${slug}`

  try {
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; TradefairMensaBot/1.0)',
      },
      next: {
        revalidate: 1800,
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    const root = $('#page-content').length
      ? $('#page-content')
      : $('body')

    const days: MensaDay[] = []
    const now = new Date()

    // Date du jour en Europe/Berlin.
    const berlinToday = new Date(
      now.toLocaleString('en-US', {
        timeZone: 'Europe/Berlin',
      }),
    )

    const todayDay = berlinToday.getDate()
    const todayMonth = berlinToday.getMonth() + 1

    // Les libellés de jour peuvent être dans un titre ou en gras.
    root
      .find('h1,h2,h3,h4,h5,h6,strong,b,table')
      .each((_i, el) => {
        const tagName = el.tagName?.toLowerCase() ?? ''

        if (
          tagName.startsWith('h') ||
          tagName === 'strong' ||
          tagName === 'b'
        ) {
          const text = $(el)
            .text()
            .replace(/\s+/g, ' ')
            .trim()

          if (
            /^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)/.test(
              text,
            )
          ) {
            const parsed = parseDayLabel(text)

            const isToday =
              !!parsed &&
              parsed.day === todayDay &&
              parsed.month === todayMonth

            // Évite les doublons de libellés.
            const alreadyAdded = days.some(
              (day) => day.label === text,
            )

            if (!alreadyAdded) {
              days.push({
                label: text,
                isToday,
                dishes: [],
              })
            }
          }

          return
        }

        if (tagName === 'table' && days.length > 0) {
          const current = days[days.length - 1]

          $(el)
            .find('tr')
            .each((_j, tr) => {
              const tds = $(tr).find('td')

              if (tds.length < 2) return

              const nameCell = $(tds[0])
              const priceCell = $(tds[tds.length - 1])

              const boldName = nameCell
                .find('strong, b')
                .first()
                .text()
                .trim()

              const fallbackName = nameCell
                .text()
                .split('\n')[0]
                .trim()

              const dishName = boldName || fallbackName

              if (!dishName) return

              const fullText = nameCell
                .text()
                .replace(/\s+/g, ' ')
                .trim()

              const afterName = fullText.startsWith(dishName)
                ? fullText.slice(dishName.length)
                : ''

              const allergenMatch = afterName.match(
                /^\s*\\(([^)]+)\\)/,
              )

              const imgAlt =
                nameCell.find('img').first().attr('alt') || ''

              const tag = /vegan|vegetarisch/i.test(imgAlt)
                ? imgAlt
                : null

              const priceMatch = priceCell
                .text()
                .match(/(\d+[,.]\d{2})\s*€/)

              current.dishes.push({
                name: dishName,
                tag,
                allergens: allergenMatch
                  ? allergenMatch[1]
                  : null,
                price: priceMatch
                  ? `${priceMatch[1].replace('.', ',')} €`
                  : null,
              })
            })
        }
      })

    return {
      slug,
      name,
      city,
      sourceUrl,
      days,
    }
  } catch (e) {
    console.error(`MENSA FETCH ERROR (${slug}):`, e)

    return {
      slug,
      name,
      city,
      sourceUrl,
      days: [],
      error: 'Impossible de charger le menu pour le moment.',
    }
  }
}

// Réponse à la vérification préalable du navigateur.
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  })
}

export async function GET(req: NextRequest) {
  const headers = corsHeaders(req)

  try {
    const requestedSlugs =
      req.nextUrl.searchParams.getAll('slug')

    const targets =
      requestedSlugs.length > 0
        ? CANTEEN_CATALOG.filter((canteen) =>
            requestedSlugs.includes(canteen.slug),
          )
        : CANTEEN_CATALOG

    if (targets.length === 0) {
      return NextResponse.json(
        { canteens: [] },
        { headers },
      )
    }

    const results = await Promise.all(
      targets.map((canteen) =>
        fetchCanteenMenu(
          canteen.slug,
          canteen.name,
          canteen.city,
        ),
      ),
    )

    return NextResponse.json(
      { canteens: results },
      { headers },
    )
  } catch (e) {
    console.error('MENSA API ROUTE ERROR:', e)

    return NextResponse.json(
      {
        canteens: [],
        error: 'Erreur serveur inattendue.',
      },
      {
        status: 500,
        headers,
      },
    )
  }
}
