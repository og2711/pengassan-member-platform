'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { hasAnySession, isAdminSession } from '@/lib/admin-auth'
import NavTabs from '@/components/NavTabs'

type Official = {
  id: string
  name: string
  position: string
}

type OfficialGroup = {
  title: string
  color: string
  members: Official[]
}

type OfficialProfile = {
  avatar_url?: string
  bio?: string
}

const OFFICIALS: OfficialGroup[] = [
  {
    title: 'Executive Council',
    color: 'border-green-600',
    members: [
      { id: 'ec1', name: 'Unyime Akpan',        position: 'Chairman' },
      { id: 'ec2', name: 'Ogaga-Oghene Okoroh', position: 'Vice Chairman' },
      { id: 'ec3', name: 'Peggy Obuns',          position: 'Secretary' },
      { id: 'ec4', name: 'Chukwuebuka Ima',      position: 'Assistant Secretary' },
      { id: 'ec5', name: 'Joseph Okocha',        position: 'Treasurer' },
      { id: 'ec6', name: 'Francis Nweke',        position: 'Auditor' },
      { id: 'ec7', name: 'Solomon Nweji',          position: 'Public Relations Officer' },
      { id: 'ec8', name: 'Michael Ezeh',         position: 'Industrial Relations Officer' },
      { id: 'ec9', name: 'Charles Onumadu',          position: 'Financial Secretary' },
      { id: 'ec10', name: 'Ginikachi Egbo',          position: 'Pengassan Women Commision' },
    ],
  },
  {
    title: 'Trustees',
    color: 'border-yellow-500',
    members: [
      { id: 'tr1', name: 'Tony Izogbia',   position: 'Ex-Chapter Chairman' },
      { id: 'tr2', name: 'Felix Ogbogbo',  position: 'Ex-Branch Vice Chairman, Ex-Chapter Vice Chairman' },
    ],
  },
]

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Bio Modal ──────────────────────────────────────────────────────────────

type BioModalProps = {
  official: Official
  profile: OfficialProfile
  isAdmin: boolean
  onClose: () => void
  onUploadAvatar: (id: string, file: File) => Promise<string | null>
  onSaveBio: (id: string, bio: string) => Promise<string | null>
}

function BioModal({ official, profile, isAdmin, onClose, onUploadAvatar, onSaveBio }: BioModalProps) {
  const overlayRef        = useRef<HTMLDivElement>(null)
  const fileInputRef      = useRef<HTMLInputElement>(null)
  const [editingBio, setEditingBio]   = useState(false)
  const [bioText, setBioText]         = useState(profile.bio ?? '')
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    const err = await onUploadAvatar(official.id, file)
    if (err) setUploadError(err)
    setUploading(false)
    e.target.value = ''
  }

  const handleSaveBio = async () => {
    setSaving(true)
    await onSaveBio(official.id, bioText)
    setSaving(false)
    setEditingBio(false)
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">

        {/* Close button */}
        <div className="flex justify-end px-4 pt-4">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center px-6 pb-2">
          <div className="relative group mb-4">
            <div className={`w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold shrink-0 ${profile.avatar_url ? 'bg-gray-100' : 'bg-green-700 text-white'}`}>
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={official.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                getInitials(official.name)
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-wait"
              >
                {uploading ? (
                  <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          {uploadError && (
            <p className="text-xs text-red-500 text-center mt-1 max-w-xs">{uploadError}</p>
          )}

          {/* Name + Position */}
          <h2 className="text-lg font-bold text-gray-900 text-center">{official.name}</h2>
          <p className="text-sm text-green-700 font-medium text-center mt-0.5">{official.position}</p>
        </div>

        {/* Bio */}
        <div className="px-6 py-4">
          {editingBio ? (
            <div className="space-y-2">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                rows={4}
                placeholder="Write a short bio…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setEditingBio(false); setBioText(profile.bio ?? '') }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBio}
                  disabled={saving}
                  className="text-sm px-4 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative">
              {profile.bio ? (
                <p className="text-sm text-gray-600 leading-relaxed text-center">{profile.bio}</p>
              ) : (
                <p className="text-sm text-gray-400 italic text-center">No bio added yet.</p>
              )}
              {isAdmin && (
                <button
                  onClick={() => setEditingBio(true)}
                  className="mt-3 w-full text-xs text-gray-400 hover:text-green-700 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {profile.bio ? 'Edit bio' : 'Add bio'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}

// ─── Official Card ───────────────────────────────────────────────────────────

type CardProps = {
  official: Official
  profile: OfficialProfile
  onClick: () => void
}

function OfficialCard({ official, profile, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center text-center gap-3 hover:border-green-400 hover:shadow-md hover:scale-105 transition-all group w-full"
    >
      <div className={`w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold shrink-0 ${profile.avatar_url ? 'bg-gray-100' : 'bg-green-700 text-white'}`}>
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={official.name}
            width={112}
            height={112}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          getInitials(official.name)
        )}
      </div>
      <div>
        <p className="font-semibold text-sm text-gray-800 group-hover:text-green-800 transition-colors">
          {official.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{official.position}</p>
      </div>
    </button>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OfficialsPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [profiles, setProfiles]   = useState<Record<string, OfficialProfile>>({})
  const [selected, setSelected]   = useState<Official | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !hasAnySession()) { router.push('/login'); return }
      setIsAdmin(isAdminSession())

      const { data } = await supabase.from('official_profiles').select('*')
      if (data) {
        const map: Record<string, OfficialProfile> = {}
        data.forEach((row: { id: string; avatar_url?: string; bio?: string }) => {
          map[row.id] = { avatar_url: row.avatar_url ?? undefined, bio: row.bio ?? undefined }
        })
        setProfiles(map)
      }

      setLoading(false)
    }
    init()
  }, [router])

  const handleUploadAvatar = async (id: string, file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `${id}.${ext}`
    const { error: storageError } = await supabase.storage.from('avatars').upload(`officials/${path}`, file, { upsert: true })
    if (storageError) return `Storage: ${storageError.message}`
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`officials/${path}`)
    const url = `${publicUrl}?t=${Date.now()}`
    const { error: dbError } = await supabase.from('official_profiles').upsert({ id, avatar_url: url })
    if (dbError) return `Database: ${dbError.message}`
    setProfiles((prev) => ({ ...prev, [id]: { ...prev[id], avatar_url: url } }))
    setSelected((prev) => prev ? { ...prev } : null)
    return null
  }

  const handleSaveBio = async (id: string, bio: string): Promise<string | null> => {
    const { error } = await supabase.from('official_profiles').upsert({ id, bio })
    if (error) return error.message
    setProfiles((prev) => ({ ...prev, [id]: { ...prev[id], bio } }))
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">Chapter Officials</h1>
            <p className="text-green-300 text-xs mt-0.5">PENGASSAN NMDPRA — Enugu Chapter</p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto">
          <NavTabs isAdmin={isAdmin} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Chapter banner */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <Image src="/Pengassan Logo.png" alt="PENGASSAN logo" width={64} height={64} style={{ width: 'auto', height: '64px' }} className="object-contain shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-gray-800">PENGASSAN NMDPRA — Enugu Chapter</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Petroleum and Natural Gas Senior Staff Association of Nigeria<br />
              National Midstream and Downstream Petroleum Regulatory Authority
            </p>
          </div>
        </div>

        {OFFICIALS.map((group) => (
          <section key={group.title}>
            <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${group.color}`}>
              <h2 className="text-base font-bold text-gray-700">{group.title}</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {group.members.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {group.members.map((official) => (
                <OfficialCard
                  key={official.id}
                  official={official}
                  profile={profiles[official.id] ?? {}}
                  onClick={() => setSelected(official)}
                />
              ))}
            </div>
          </section>
        ))}

        <p className="text-center text-xs text-gray-400 pb-4">
          Click on any official to view their profile.
          {isAdmin && ' As admin, you can upload photos and add bios.'}
        </p>
      </main>

      {selected && (
        <BioModal
          official={selected}
          profile={profiles[selected.id] ?? {}}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onUploadAvatar={handleUploadAvatar}
          onSaveBio={handleSaveBio}
        />
      )}
    </div>
  )
}
