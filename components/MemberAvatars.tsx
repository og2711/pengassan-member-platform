'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Profile, supabase } from '@/lib/supabase'

type Props = {
  currentUserId: string | null
}

export default function MemberAvatars({ currentUserId }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .order('created_at')
      .then(({ data }) => setProfiles(data ?? []))
  }, [])

  const handleAvatarClick = (profileId: string) => {
    if (profileId !== currentUserId) return
    fileInputRef.current?.click()
    setEditingId(profileId)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingId) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${editingId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarWithBust = `${publicUrl}?t=${Date.now()}`

      await supabase.from('profiles').update({ avatar_url: avatarWithBust }).eq('id', editingId)
      setProfiles((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, avatar_url: avatarWithBust } : p))
      )
    }

    setUploading(false)
    setEditingId(null)
    e.target.value = ''
  }

  if (profiles.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      {profiles.map((profile) => {
        const isOwn = profile.id === currentUserId
        const initials = (profile.full_name ?? '?')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)

        return (
          <div key={profile.id} className="relative group">
            <button
              onClick={() => handleAvatarClick(profile.id)}
              title={isOwn ? `${profile.full_name} — click to change photo` : (profile.full_name ?? '')}
              className={`w-9 h-9 rounded-full overflow-hidden border-2 flex items-center justify-center text-xs font-bold transition-all
                ${isOwn ? 'border-white cursor-pointer hover:border-green-300 hover:scale-110' : 'border-white/50 cursor-default'}
                ${uploading && editingId === profile.id ? 'opacity-50' : ''}
                ${profile.avatar_url ? 'bg-white' : 'bg-green-600'} text-white`}
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name ?? ''}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </button>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {profile.full_name ?? 'Member'}
              {isOwn && <span className="text-gray-400 ml-1">(you)</span>}
            </div>
          </div>
        )
      })}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploading && (
        <span className="text-xs text-green-300 ml-2">Uploading…</span>
      )}
    </div>
  )
}
