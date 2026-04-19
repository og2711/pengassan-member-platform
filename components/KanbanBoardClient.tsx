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
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/Pengassan Logo.png" alt="PENGASSAN logo" width={58} height={58} style={{ height: '58px', width: 'auto' }} className="object-contain" />
            <Image src="/NMDPRA Logo.png" alt="NMDPRA logo" width={58} height={58} style={{ height: '58px', width: 'auto' }} className="object-contain" />
            <div>
              <h1 className="text-xl font-bold tracking-normal">PENGASSAN NMDPRA — Enugu Chapter</h1>
              <p className="text-green-300 text-xs mt-0.5">Grievance & Issue Tracker</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <MemberAvatars currentUserId={currentUserId} />
            {currentProfile && (
              <div className="flex items-center gap-2 border-l border-green-700 pl-4">
                <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0 ${currentProfile.avatar_url ? 'bg-white' : 'bg-green-600'}`}>
                  {currentProfile.avatar_url ? (
                    <Image src={currentProfile.avatar_url} alt={currentProfile.full_name ?? ''} width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    (currentProfile.full_name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  )}
                </div>
                <span className="text-green-200 text-xs">{currentProfile.full_name}</span>
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => router.push('/recommendations')}
                className="text-green-200 hover:text-yellow-400 text-sm border border-green-500 rounded-full px-3 py-1 hover:border-yellow-400 transition-colors"
              >
                Recommendations
              </button>
            )}
            <span className="text-green-300 text-xs border border-green-500 rounded-full px-3 py-1">
              {isAdmin ? 'Admin' : 'Member'}
            </span>
            <button
              onClick={handleLogout}
              className="text-green-200 hover:text-white transition-colors text-sm"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      {/* Board */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Issues Board</h2>
            <p className="text-sm text-gray-500 mt-0.5">Track grievances and issues across all stages</p>
          </div>
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
