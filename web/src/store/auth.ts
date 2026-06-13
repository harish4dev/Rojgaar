import type { Business, Partner, Role } from '@/api/client'

const SESSION_KEY = 'rojgaar.web.session'

export interface Session {
  role: Role
  user: Business | Partner
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function setSession(role: Role, user: Business | Partner) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ role, user }))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function isBusiness(session: Session | null): session is Session & { user: Business } {
  return session?.role === 'business'
}

export function isPartner(session: Session | null): session is Session & { user: Partner } {
  return session?.role === 'partner'
}

export function isProfileComplete(role: Role, user: Business | Partner): boolean {
  if (user.profile_complete === true) return true
  if (user.profile_complete === false) return false
  if (role === 'business') {
    const b = user as Business
    return !!(b.name?.trim() && b.company?.trim() && b.city?.trim() && b.industry?.trim())
  }
  const p = user as Partner
  return !!(p.name?.trim() && p.city?.trim())
}
