'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { OrgEvent, EventType, supabase } from '@/lib/supabase'

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'meeting',  label: 'Meeting' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar',  label: 'Seminar' },
  { value: 'social',   label: 'Social' },
  { value: 'union',    label: 'Unionised Activity' },
  { value: 'other',    label: 'Other' },
]

type FormData = Omit<OrgEvent, 'id' | 'created_at'>

type Props = {
  event?: OrgEvent
  onSave: (data: FormData, id?: string) => Promise<void>
  onClose: () => void
}

export default function EventFormModal({ event, onSave, onClose }: Props) {
  const isEdit = !!event
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attendeeInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle]           = useState(event?.title ?? '')
  const [type, setType]             = useState<EventType>(event?.type ?? 'meeting')
  const [date, setDate]             = useState(event?.date ?? '')
  const [time, setTime]             = useState(event?.time ?? '09:00')
  const [location, setLocation]     = useState(event?.location ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [attendees, setAttendees]   = useState<string[]>(event?.attendees ?? [])
  const [pictures, setPictures]     = useState<string[]>(event?.pictures ?? [])
  const [attendeeInput, setAttendeeInput] = useState('')
  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const addAttendee = () => {
    const name = attendeeInput.trim()
    if (!name || attendees.includes(name)) return
    setAttendees((prev) => [...prev, name])
    setAttendeeInput('')
    attendeeInputRef.current?.focus()
  }

  const removeAttendee = (name: string) => setAttendees((prev) => prev.filter((a) => a !== name))

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setUploadError('')

    const eventId = event?.id ?? crypto.randomUUID()
    const uploaded: string[] = []
    let lastError = ''

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: storageError } = await supabase.storage
        .from('events')
        .upload(path, file, { upsert: false })

      if (storageError) {
        lastError = storageError.message
      } else {
        const { data: { publicUrl } } = supabase.storage.from('events').getPublicUrl(path)
        uploaded.push(publicUrl)
      }
    }

    if (lastError) {
      setUploadError(`Upload failed: "${lastError}". If you see a policy error, add an INSERT policy for authenticated users on the events bucket in Supabase Storage → Policies.`)
    }

    setPictures((prev) => [...prev, ...uploaded])
    setUploading(false)
    e.target.value = ''
  }

  const removePicture = async (url: string) => {
    setPictures((prev) => prev.filter((p) => p !== url))
    // best-effort delete from storage
    const match = url.match(/\/events\/(.+)$/)
    if (match) {
      const path = decodeURIComponent(match[1].split('?')[0])
      await supabase.storage.from('events').remove([path])
    }
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    if (!date)          { setError('Date is required.'); return }
    if (!location.trim()) { setError('Location is required.'); return }

    setSaving(true)
    setError('')
    try {
      await onSave(
        { title: title.trim(), type, date, time, location: location.trim(), description: description.trim() || null, attendees, pictures },
        event?.id,
      )
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-green-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual General Meeting"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. NMDPRA Enugu Office — Conference Hall"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this event about?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Attendees {attendees.length > 0 && <span className="text-gray-400 font-normal">({attendees.length})</span>}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                ref={attendeeInputRef}
                type="text"
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttendee() } }}
                placeholder="Full name, then press Enter"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                type="button"
                onClick={addAttendee}
                className="px-3 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 transition-colors"
              >
                Add
              </button>
            </div>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attendees.map((name) => (
                  <span key={name} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                    {name}
                    <button
                      type="button"
                      onClick={() => removeAttendee(name)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pictures */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Pictures {pictures.length > 0 && <span className="text-gray-400 font-normal">({pictures.length})</span>}
            </label>

            {pictures.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {pictures.map((url, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 group">
                    <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePicture(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload photos
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePictureUpload}
            />
            {uploadError && (
              <p className="text-xs text-red-600 mt-2 leading-relaxed">{uploadError}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="px-5 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isEdit ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  )
}
