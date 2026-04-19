'use client'

import { useEffect, useState, useRef } from 'react'
import { Issue, IssueUpdate, Lane, supabase, nameFromEmail } from '@/lib/supabase'

const priorityStyles = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

type Props = {
  issue: Issue
  lane: Lane | undefined
  isAdmin: boolean
  onClose: () => void
}

function UpdateItem({
  update,
  isAdmin,
  onDelete,
  onEdit,
}: {
  update: IssueUpdate
  isAdmin: boolean
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(update.content)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!draft.trim() || draft === update.content) { setEditing(false); return }
    setSaving(true)
    await onEdit(update.id, draft.trim())
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 group relative">
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button
              onClick={() => { setEditing(false); setDraft(update.content) }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-3 py-1 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.content}</p>
          <div className="flex items-center justify-between mt-2">
            <div>
              {update.author_name && (
                <span className="text-xs font-medium text-gray-600">{update.author_name} · </span>
              )}
              <span className="text-xs text-gray-400">
                {new Date(update.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' '}
                {new Date(update.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {isAdmin && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-gray-400 hover:text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(update.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function IssueDetailPanel({ issue, lane, isAdmin, onClose }: Props) {
  const [updates, setUpdates] = useState<IssueUpdate[]>([])
  const [newUpdate, setNewUpdate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase
      .from('issue_updates')
      .select('*')
      .eq('issue_id', issue.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setUpdates(data ?? []))
  }, [issue.id])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleAddUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newUpdate.trim()) return
    setSubmitting(true)

    const { data: { session } } = await supabase.auth.getSession()
    const author_name = session?.user.email ? nameFromEmail(session.user.email) : null

    const { data } = await supabase
      .from('issue_updates')
      .insert({ issue_id: issue.id, content: newUpdate.trim(), author_name })
      .select()
      .single()

    if (data) setUpdates((prev) => [data, ...prev])
    setNewUpdate('')
    setSubmitting(false)
  }

  const handleDeleteUpdate = async (id: string) => {
    await supabase.from('issue_updates').delete().eq('id', id)
    setUpdates((prev) => prev.filter((u) => u.id !== id))
  }

  const handleEditUpdate = async (id: string, content: string) => {
    const { data } = await supabase
      .from('issue_updates')
      .update({ content })
      .eq('id', id)
      .select()
      .single()
    if (data) setUpdates((prev) => prev.map((u) => (u.id === id ? data : u)))
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              {lane && (
                <span className="text-xs text-white px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: lane.color }}>
                  {lane.title}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyles[issue.priority]}`}>
                {issue.priority}
              </span>
            </div>
            <h2 className="text-base font-bold text-gray-800 leading-snug">{issue.title}</h2>
            {issue.description && (
              <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{issue.description}</p>
            )}
            {issue.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {issue.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Opened {new Date(issue.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Updates list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Updates</h3>
          {updates.length === 0 && (
            <p className="text-sm text-gray-400 italic">No updates yet.</p>
          )}
          {updates.map((update) => (
            <UpdateItem
              key={update.id}
              update={update}
              isAdmin={isAdmin}
              onDelete={handleDeleteUpdate}
              onEdit={handleEditUpdate}
            />
          ))}
        </div>

        {/* Admin: add update */}
        {isAdmin && (
          <form onSubmit={handleAddUpdate} className="px-6 py-4 border-t bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">Post an Update</label>
            <textarea
              ref={textareaRef}
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
              placeholder="Add a status update or note..."
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={submitting || !newUpdate.trim()}
                className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Posting…' : 'Post Update'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
