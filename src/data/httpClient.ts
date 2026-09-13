export async function readJsonResponse<T>(response: Response, label: string): Promise<T> {
  if (!response.ok) throw new Error(`${label} responded ${response.status}`)
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(`${label} returned HTML; restart the Vite server so provider middleware is active`)
  }
  return await response.json() as T
}
