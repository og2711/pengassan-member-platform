const ADMIN_KEY = 'pengassan_admin'
const VIEWER_KEY = 'pengassan_viewer'

export function isAdminSession(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(ADMIN_KEY) === 'true'
}

export function setAdminSession() {
  sessionStorage.setItem(ADMIN_KEY, 'true')
}

export function isViewerSession(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(VIEWER_KEY) === 'true'
}

export function setViewerSession() {
  sessionStorage.setItem(VIEWER_KEY, 'true')
}

export function clearAllSessions() {
  sessionStorage.removeItem(ADMIN_KEY)
  sessionStorage.removeItem(VIEWER_KEY)
}

export function hasAnySession(): boolean {
  return isAdminSession() || isViewerSession()
}
