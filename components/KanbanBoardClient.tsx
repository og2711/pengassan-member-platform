'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Lane, Issue, Profile, supabase } from '@/lib/supabase'
import { isAdminSession, hasAnySession, clearAllSessions } from '@/lib/admin-auth'
import KanbanBoard from './KanbanBoard'
import RecommendationForm from './RecommendationForm'
import MemberAvatars from './MemberAvatars'

type Props = {
  initialLanes: Lane[]
  initialIssues: Issue[]
}

export default function KanbanBoardClient({ initialLanes, initialIssues }: Props) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !hasAnySession()) {
        router.push('/login')
        return
      }
      const admin = isAdminSession()
      setIsAdmin(admin)
      setCurrentUserId(admin ? session.user.id : null)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setCurrentProfile(profile)
    }
    checkSession()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAllSessions()
    setIsAdmin(false)
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-800 text-white shadow-md">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <Image src="/Pengassan Logo.png" alt="PENGASSAN logo" width={48} height={48} style={{ height: '44px', width: 'auto' }} className="object-contain shrink-0" />
            <Image src="/NMDPRA Logo.png" alt="NMDPRA logo" width={48} height={48} style={{ height: '44px', width: 'auto' }} className="object-contain shrink-0" />
            <div>
              <h1 className="text-sm sm:text-2xl font-bold tracking-normal leading-tight">PENGASSAN NMDPRA - Enugu Chapter</h1>
              <p className="text-green-300 text-s mt-0.5">Grievance & Issue Tracker</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-2 sm:gap-4 text-sm flex-wrap">
            <MemberAvatars currentUserId={currentUserId} />
            {currentProfile && (
              <div className="flex items-center gap-2 border-l border-green-700 pl-3">
                <div className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0 ${currentProfile.avatar_url ? 'bg-white' : 'bg-green-600'}`}>
                  {currentProfile.avatar_url ? (
                    <Image src={currentProfile.avatar_url} alt={currentProfile.full_name ?? ''} width={28} height={28} className="w-full h-full object-cover" />
                  ) : (
                    (currentProfile.full_name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  )}
                </div>
                <span className="text-green-200 text-xs hidden sm:inline">{currentProfile.full_name}</span>
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => router.push('/recommendations')}
                className="text-green-200 hover:text-yellow-400 text-xs sm:text-sm border border-green-500 rounded-full px-2 sm:px-3 py-1 hover:border-yellow-400 transition-colors"
              >
                Recommendations
              </button>
            )}
            <span className="text-green-300 text-xs border border-green-500 rounded-full px-2 py-1">
              {isAdmin ? 'Admin' : 'Member'}
            </span>
            <button onClick={handleLogout} className="text-green-200 hover:text-white transition-colors text-xs sm:text-sm">
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      {/* Board */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Employee Issues Board</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track Grievances and Productivity Issues</p>
        </div>

        <KanbanBoard
          initialLanes={initialLanes}
          initialIssues={initialIssues}
          isAdmin={isAdmin}
        />

        <RecommendationForm />
      </main>
    </div>
  )
}
