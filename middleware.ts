import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PHONE_UA =
  /Android.+Mobile|iPhone|iPod|Windows Phone|IEMobile|Opera Mini|BlackBerry|webOS/i

// Ces pages restent sur le site, même sur téléphone
const STAY_ON_SITE = ['/api', '/call', '/live', '/auth', '/_next']

function redirectPhones(request: NextRequest) {
  const mobileUrl = process.env.MOBILE_SITE_URL
  if (!mobileUrl) return null

  const { pathname } = request.nextUrl

  if (
    STAY_ON_SITE.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    return null
  }

  // Images, icônes et fichiers
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return null

  if (!PHONE_UA.test(request.headers.get('user-agent') ?? '')) {
    return null
  }

  // Les liens de profil et de chat gardent leur destination
  const profile = pathname.match(/^\/etudiantpublic\/([^/]+)/)

  if (profile) {
    return NextResponse.redirect(
      new URL(`/student/${profile[1]}`, mobileUrl),
    )
  }

  const chat = pathname.match(/^\/(chat|groupchat)\/([^/]+)/)

  if (chat) {
    return NextResponse.redirect(
      new URL(`/${chat[1]}/${chat[2]}`, mobileUrl),
    )
  }

  return NextResponse.redirect(new URL('/', mobileUrl))
}

export async function middleware(request: NextRequest) {
  const phoneRedirect = redirectPhones(request)
  if (phoneRedirect) return phoneRedirect

  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
