'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isAdminSession } from '@/lib/admin-auth'
import { Lane, Issue } from '@/lib/supabase'
import IssueModal from '@/components/IssueModal'

type Recommendation = {
  id: string
  name: string
  department: string | null
  message: string
  status: 'pending' | 'reviewed' | 'addressed' | 'discarded'
  created_at: string
}

const statusConfig = {
  pending:   { label: 'Pending',   color: 'bg-gray-100 text-gray-600' },
  reviewed:  { label: 'Reviewed',  color: 'bg-blue-100 text-blue-700' },
  addressed: { label: 'Addressed', color: 'bg-green-100 text-green-700' },
  discarded: { label: 'Discarded', color: 'bg-red-100 text-red-600' },
}

export default function RecommendationsPage() {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [lanes, setLanes] = useState<Lane[]>([])
  const [loading, setLoading] = useState(true)
  const [createFrom, setCreateFrom] = useState<Recommendation | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !isAdminSession()) {
        router.push('/admin')
        return
      }

      const [{ data: recs }, { data: laneData }] = await Promise.all([
        supabase.from('recommendations').select('*').order('created_at', { ascending: false }),
        supabase.from('lanes').select('*').order('order'),
      ])

      setRecommendations(recs ?? [])
      setLanes(laneData ?? [])
      setLoading(false)
    }
    init()
  }, [router])

  const updateStatus = async (id: string, status: Recommendation['status']) => {
    await supabase.from('recommendations').update({ status }).eq('id', id)
    setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  const handleCreateIssue = async (data: Partial<Issue>) => {
    const order = 0
    await supabase.from('issues').insert({ ...data, order })
    await updateStatus(createFrom!.id, 'addressed')
    setCreateFrom(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  const grouped = {
    pending:   recommendations.filter((r) => r.status === 'pending'),
    reviewed:  recommendations.filter((r) => r.status === 'reviewed'),
    addressed: recommendations.filter((r) => r.status === 'addressed'),
    discarded: recommendations.filter((r) => r.status === 'discarded'),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Recommendations</h1>
            <p className="text-green-300 text-xs mt-0.5">PENGASSAN NMDPRA</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-green-200 hover:text-white text-sm transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Board
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {(Object.keys(grouped) as Recommendation['status'][]).map((statusKey) => {
          const items = grouped[statusKey]
          if (items.length === 0) return null
          const cfg = statusConfig[statusKey]

          return (
            <section key={statusKey}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-gray-400">{items.length}</span>
              </h2>

              <div className="space-y-3">
                {items.map((rec) => (
                  <div key={rec.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-800">{rec.name}</p>
                          {rec.department && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{rec.department}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{rec.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(rec.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 items-end">
                        {/* Status selector */}
                        <select
                          value={rec.status}
                          onChange={(e) => updateStatus(rec.id, e.target.value as Recommendation['status'])}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-600"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="addressed">Addressed</option>
                          <option value="discarded">Discarded</option>
                        </select>

                        {/* Create issue button — only for non-discarded */}
                        {rec.status !== 'discarded' && (
                          <button
                            onClick={() => setCreateFrom(rec)}
                            className="text-xs px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Issue
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {recommendations.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No recommendations yet</p>
            <p className="text-sm mt-1">Submissions from members will appear here.</p>
          </div>
        )}
      </main>

      {createFrom && (
        <IssueModal
          lanes={lanes}
          defaultLaneId={lanes[0]?.id}
          issue={undefined}
          onSave={handleCreateIssue}
          onClose={() => setCreateFrom(null)}
          prefill={{ title: createFrom.name, description: createFrom.message }}
        />
      )}
    </div>
  )
}
