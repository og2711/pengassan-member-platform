import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (url, options) =>
      fetch(url, { ...options, signal: AbortSignal.timeout(10000) }),
  },
})

export type Lane = {
  id: string
  title: string
  color: string
  order: number
}

export type Issue = {
  id: string
  lane_id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  order: number
  created_at: string
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type IssueUpdate = {
  id: string
  issue_id: string
  content: string
  author_name: string | null
  created_at: string
}

export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  return local
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export type Recommendation = {
  id: string
  name: string
  department: string
  message: string
  created_at: string
  status: 'pending' | 'reviewed'
}

export type EventType = 'meeting' | 'workshop' | 'seminar' | 'social' | 'union' | 'other'

export type OrgEvent = {
  id: string
  title: string
  type: EventType
  date: string
  time: string
  location: string
  description: string | null
  attendees: string[]
  pictures: string[]
  created_at: string
}
