import type { IncomingMessage, ServerResponse } from 'node:http'

export function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

export function readRouteUrl(request: IncomingMessage) {
  return new URL(request.url ?? '/', 'http://atlasops.local')
}
