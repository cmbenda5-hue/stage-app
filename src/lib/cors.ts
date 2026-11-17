import type { NextRequest } from 'next/server'

// Sites autorisés à appeler les routes /api du site : l'app mobile (web) et son serveur de test local.
const ALLOWED_ORIGINS = [
  'https://m.tradefair-app.de',
  'https://stage-app-mobile.vercel.app',
  'http://localhost:8081',
  'http://localhost:19006',
]

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin')
  const headers: Record<string, string> = { Vary: 'Origin' }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
  }
  return headers
}