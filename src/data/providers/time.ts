export const OPW_RECENT_MS = 45 * 60 * 1000
export const OPW_STALE_MS = 3 * 60 * 60 * 1000
export const BIKES_RECENT_MS = 10 * 60 * 1000
export const BIKES_STALE_MS = 60 * 60 * 1000
export const SONITUS_STALE_MS = {
  warning: 45 * 60 * 1000,
  offline: 6 * 60 * 60 * 1000,
}

export function ageInMs(value?: string): number | null {
  if (!value) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? Date.now() - timestamp : null
}

export function relativeAge(value?: string): string {
  const age = ageInMs(value)
  if (age === null) return 'Unknown'
  const minutes = Math.max(0, Math.round(age / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} hr ago`
  return `${Math.round(hours / 24)} days ago`
}

export function toIsoFromDublinLocal(value?: string): string | undefined {
  if (!value) return undefined
  const normalised = value.includes('T') ? value : value.replace(' ', 'T')
  const parsed = Date.parse(normalised.endsWith('Z') ? normalised : `${normalised}Z`)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined
}
