const ADMIN_KEY = 'pengassan_admin'
const VIEWER_KEY = 'pengassan_viewer'

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=86400; SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`
}

export function isAdminSession(): boolean {
  return getCookie(ADMIN_KEY) === 'true'
}

export function setAdminSession() {
  setCookie(ADMIN_KEY, 'true')
}

export function isViewerSession(): boolean {
  return getCookie(VIEWER_KEY) === 'true'
}

export function setViewerSession() {
  setCookie(VIEWER_KEY, 'true')
}

export function clearAllSessions() {
  deleteCookie(ADMIN_KEY)
  deleteCookie(VIEWER_KEY)
}

export function hasAnySession(): boolean {
  return isAdminSession() || isViewerSession()
}
