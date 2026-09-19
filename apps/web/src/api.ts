const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://perfectwisdom-school-api.onrender.com'

export { API_BASE_URL }

export async function apiRequest<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = typeof window !== 'undefined' ? localStorage.getItem('perfect-wisdom-school-token') : null
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof data === 'object' && data && 'error' in data
      ? String(data.error)
      : `API request failed: ${response.status}`
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('perfect-wisdom-school-token')
    }
    throw new Error(message)
  }
  return data as T
}

export function setAuthToken(token: string) {
  localStorage.setItem('perfect-wisdom-school-token', token)
}

export function clearAuthToken() {
  localStorage.removeItem('perfect-wisdom-school-token')
}
