'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { hasAnySession, isAdminSession } from '@/lib/admin-auth'
import NavTabs from '@/components/NavTabs'
import { InstallAppButton } from '@/components/InstallPrompt'

type QuickLink = {
  title: string
  description: string
  href: string
  adminOnly?: boolean
  icon: React.ReactNode
}

const iconProps = {
  className: 'w-6 h-6',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Grievance & Issue Tracker',
    description: 'See the issues the chapter is working on and follow their progress.',
    href: '/tracker',
    icon: (
      <svg {...iconProps}><rect x="3" y="3" width="7" height="18" rx="1.5" /><rect x="14" y="3" width="7" height="11" rx="1.5" /></svg>
    ),
  },
  {
    title: 'Events',
    description: 'Upcoming meetings, congresses and chapter activities.',
    href: '/events',
    icon: (
      <svg {...iconProps}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    ),
  },
  {
    title: 'Chapter Officials',
    description: 'Meet the Executive Council and Trustees of the chapter.',
    href: '/officials',
    icon: (
      <svg {...iconProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
  },
  {
    title: 'Recommendations',
    description: 'Review recommendations submitted by members.',
    href: '/recommendations',
    adminOnly: true,
    icon: (
      <svg {...iconProps}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    ),
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !hasAnySession()) {
        router.push('/login')
        return
      }
      setIsAdmin(isAdminSession())

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
      setFirstName(profile?.full_name?.trim().split(/\s+/)[0] ?? null)
      setLoading(false)
    }
    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  const links = QUICK_LINKS.filter((l) => !l.adminOnly || isAdmin)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <Link href="/" aria-label="Go to the Welcome page" className="flex items-center gap-3 shrink-0 rounded-lg hover:opacity-90 transition-opacity">
            <Image src="/Pengassan Logo.png" alt="PENGASSAN logo" width={64} height={64} className="h-12 sm:h-16 w-auto object-contain shrink-0" />
            <Image src="/NMDPRA Logo.png" alt="NMDPRA logo" width={64} height={64} className="h-12 sm:h-16 w-auto object-contain shrink-0" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">Welcome</h1>
            <p className="text-green-300 text-xs mt-0.5">PENGASSAN NMDPRA — Enugu Chapter</p>
          </div>
          <div className="ml-auto">
            <InstallAppButton />
          </div>
        </div>
        <div className="max-w-5xl mx-auto">
          <NavTabs isAdmin={isAdmin} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Greeting */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome{firstName ? `, Comrade ${firstName}` : ', Comrade'}!
          </h2>
          <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">
            This is the member platform of the Petroleum and Natural Gas Senior Staff Association of
            Nigeria (PENGASSAN), NMDPRA Enugu Chapter. Use it to follow the issues we are pursuing on
            your behalf, keep up with chapter events and get to know your officials.
          </p>
        </section>

        {/* Quick links */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Get started</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex gap-4 items-start hover:border-green-600 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 rounded-lg bg-green-50 text-green-800 flex items-center justify-center shrink-0 group-hover:bg-green-800 group-hover:text-white transition-colors">
                  {link.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 group-hover:text-green-800">{link.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Assistant pointer */}
        <section className="bg-green-800 text-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-white border-2 border-white shrink-0 flex items-center justify-center p-2">
            <Image src="/Pengassan Logo.png" alt="PENGASSAN logo" width={64} height={64} className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-bold text-lg">Have a question about your rights at work?</p>
            <p className="text-green-100 text-sm mt-1">
              Tap the round button at the bottom right of any page to ask The Comrades&rsquo;
              Assistant. It answers from the PENGASSAN Constitution and Nigerian labour law.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
