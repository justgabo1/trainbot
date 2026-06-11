export function saveAuth(token: string, role: string, name: string) {
  localStorage.setItem('trainbot_token', token)
  localStorage.setItem('trainbot_role', role)
  localStorage.setItem('trainbot_name', name)
  document.cookie = `trainbot_token=${token}; path=/; max-age=${8 * 3600}; SameSite=None; Secure`
}

export function clearAuth() {
  localStorage.removeItem('trainbot_token')
  localStorage.removeItem('trainbot_role')
  localStorage.removeItem('trainbot_name')
  document.cookie = 'trainbot_token=; path=/; max-age=0; SameSite=None; Secure'
}

export function getRole(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('trainbot_role')
}

export function getName(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('trainbot_name')
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('trainbot_token')
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('trainbot_token')
}