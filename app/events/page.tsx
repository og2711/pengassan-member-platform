'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { OrgEvent, supabase } from '@/lib/supabase'
import { hasAnySession, isAdminSession } from '@/lib/admin-auth'
import EventDetailModal, { EVENT_TYPE_CONFIG } from '@/components/EventDetailModal'
import EventFormModal from '@/components/EventFormModal'
import NavTabs from '@/components/NavTabs'

type Filter = 'upcoming' | 'past' | 'all'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function DateBadge({ dateStr }: { dateStr: string }) {
  const d = new Date(dateStr + 'T00:00:00')
  return (
    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-green-700 text-white shrink-0">
      <span className="text-xl font-bold leading-none">{d.getDate()}</span>
      <span className="text-xs font-medium leading-none mt-1">
        {d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
      </span>
    </div>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents]             = useState<OrgEvent[]>([])
  const [loading, setLoading]           = useState(true)
  const [fetchError, setFetchError]     = useState('')
  const [isAdmin, setIsAdmin]           = useState(false)
  const [filter, setFilter]             = useState<Filter>('all')
  const [selectedEvent, setSelectedEvent] = useState<OrgEvent | null>(null)
  const [editingEvent, setEditingEvent] = useState<OrgEvent | undefined>(undefined)
  const [showForm, setShowForm]         = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !hasAnySession()) { router.push('/login'); return }
      setIsAdmin(isAdminSession())

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })

      if (error) setFetchError(error.message)
      setEvents(data ?? [])
      setLoading(false)
    }
    init()
  }, [router])

  const openCreate = () => {
    setEditingEvent(undefined)
    setShowForm(true)
  }

  const openEdit = (event: OrgEvent) => {
    setSelectedEvent(null)
    setEditingEvent(event)
    setShowForm(true)
  }

  const handleSave = async (
    data: Omit<OrgEvent, 'id' | 'created_at'>,
    id?: string,
  ) => {
    if (id) {
      const { data: updated } = await supabase
        .from('events')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (updated) setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)))
    } else {
      const { data: created } = await supabase
        .from('events')
        .insert(data)
        .select()
        .single()
      if (created) setEvents((prev) => [...prev, created])
    }
    setShowForm(false)
    setEditingEvent(undefined)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('events').delete().eq('id', id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setSelectedEvent(null)
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = events
    .filter((e) => {
      if (filter === 'upcoming') return e.date >= today
      if (filter === 'past')     return e.date < today
      return true
    })
    .sort((a, b) =>
      filter === 'past'
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date)
    )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 max-w-md w-full text-center">
          <p className="font-semibold text-red-600 mb-1">Could not load events</p>
          <p className="text-sm text-gray-500 mb-4">{fetchError}</p>
          <p className="text-xs text-gray-400">
            If this is a new installation, run the <code className="bg-gray-100 px-1 py-0.5 rounded">CREATE TABLE events</code> migration in your Supabase SQL editor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">Events</h1>
            <p className="text-green-300 text-xs mt-0.5">PENGASSAN NMDPRA — Enugu Chapter</p>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </button>
          )}
        </div>
        <div className="max-w-5xl mx-auto">
          <NavTabs isAdmin={isAdmin} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8">
          {(['all', 'upcoming', 'past'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400 hover:text-green-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-2">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium">No {filter !== 'all' ? filter : ''} events</p>
            {isAdmin ? (
              <button
                onClick={openCreate}
                className="mt-3 text-sm text-green-700 hover:text-green-900 underline underline-offset-2"
              >
                Add the first event
              </button>
            ) : (
              <p className="text-sm mt-1">Check back later for updates.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((event) => {
              const isPast = event.date < today
              const cfg = EVENT_TYPE_CONFIG[event.type]
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full text-left bg-white rounded-xl border shadow-sm p-5 flex gap-4 items-start hover:border-green-300 hover:shadow-md transition-all group ${
                    isPast ? 'opacity-70 border-gray-200' : 'border-gray-200'
                  }`}
                >
                  <DateBadge dateStr={event.date} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-800 transition-colors">
                        {event.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {isPast && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Past</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-1.5">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(event.date)} &middot; {formatTime(event.time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {event.attendees.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-green-600 group-hover:underline ml-auto">View details →</span>
                    </div>
                  </div>
                  {event.pictures.length > 0 && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={event.pictures[0]}
                        alt={event.title}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </main>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isAdmin={isAdmin}
          onClose={() => setSelectedEvent(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {showForm && (
        <EventFormModal
          event={editingEvent}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingEvent(undefined) }}
        />
      )}
    </div>
  )
}
