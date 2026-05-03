'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { OrgEvent, EventType } from '@/lib/supabase'

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string }> = {
  meeting:  { label: 'Meeting',  color: 'bg-blue-100 text-blue-700' },
  workshop: { label: 'Workshop', color: 'bg-purple-100 text-purple-700' },
  seminar:  { label: 'Seminar',  color: 'bg-yellow-100 text-yellow-700' },
  social:   { label: 'Social',             color: 'bg-pink-100 text-pink-700' },
  union:    { label: 'Unionised Activity', color: 'bg-orange-100 text-orange-700' },
  other:    { label: 'Other',             color: 'bg-gray-100 text-gray-600' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

type Props = {
  event: OrgEvent
  isAdmin: boolean
  onClose: () => void
  onEdit: (event: OrgEvent) => void
  onDelete: (id: string) => void
}

export default function EventDetailModal({ event, isAdmin, onClose, onEdit, onDelete }: Props) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const cfg = EVENT_TYPE_CONFIG[event.type]
  const today = new Date().toISOString().split('T')[0]
  const isPast = event.date < today

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') lightboxSrc ? setLightboxSrc(null) : onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, lightboxSrc])

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete(event.id)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      >
        {/* Panel */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-green-800 text-white px-6 py-4 flex items-start justify-between gap-3 shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                  {cfg.label}
                </span>
                {isPast && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/80">Past</span>
                )}
              </div>
              <h2 className="text-lg font-bold leading-snug">{event.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors shrink-0 mt-0.5"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Date / Time / Location */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Date & Time</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(event.date)}</p>
                  <p className="text-sm text-gray-600">{formatTime(event.time)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Location</p>
                  <p className="text-sm font-semibold text-gray-800">{event.location || '—'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Attendees */}
            {event.attendees.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                  Attendees · {event.attendees.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.attendees.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full"
                    >
                      <span className="w-5 h-5 rounded-full bg-green-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {name.trim().charAt(0).toUpperCase()}
                      </span>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pictures */}
            {event.pictures.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                  Pictures · {event.pictures.length}
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory">
                  {event.pictures.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxSrc(url)}
                      className="relative flex-none w-64 h-44 rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity snap-start focus:outline-none focus:ring-2 focus:ring-green-600 shrink-0"
                    >
                      <Image
                        src={url}
                        alt={`Event photo ${i + 1}`}
                        fill
                        sizes="256px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {event.attendees.length === 0 && !event.description && event.pictures.length === 0 && (
              <p className="text-sm text-gray-400 italic">No additional details have been added yet.</p>
            )}
          </div>

          {/* Admin footer */}
          {isAdmin && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3 shrink-0 bg-gray-50">
              <button
                onClick={handleDelete}
                onBlur={() => setConfirmDelete(false)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  confirmDelete
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-red-500 hover:bg-red-50'
                }`}
              >
                {confirmDelete ? 'Confirm Delete' : 'Delete'}
              </button>
              <button
                onClick={() => onEdit(event)}
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Event
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightboxSrc}
              alt="Event photo"
              width={1200}
              height={800}
              className="max-h-[85vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  )
}
