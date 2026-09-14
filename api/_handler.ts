import type { IncomingMessage, ServerResponse } from 'node:http'
import { sendJson } from '../server/providers/http.ts'
import { transportRoutes } from '../server/transport/routes.ts'
import { ntaGtfsRealtimeRoutes } from '../server/providers/ntaGtfsRealtime/routes.ts'

// Vercel only runs files under /api as serverless functions; Vite's dev-only
// middleware (server/**/routes.ts) never executes in production, so every
// /api/providers/* and /api/transport/* request 404'd on the deployed site.
// This catch-all re-wires the same Connect handlers behind a single function.
const middlewares = [
  transportRoutes(),
  ntaGtfsRealtimeRoutes(),
]

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  for (const middleware of middlewares) {
    await middleware(request as any, response as any, () => {})
    if (response.writableEnded) return
  }
  sendJson(response, 404, { error: 'Not found' })
}
