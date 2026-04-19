'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Issue } from '@/lib/supabase'

const priorityStyles = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

type Props = {
  issue: Issue
  isAdmin: boolean
  onEdit?: (issue: Issue) => void
  onDelete?: (id: string) => void
  onOpen?: (issue: Issue) => void
}

export default function IssueCard({ issue, isAdmin, onEdit, onDelete, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
    disabled: !isAdmin,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => !isDragging && onOpen?.(issue)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 group cursor-pointer hover:border-green-400 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          {...(isAdmin ? { ...attributes, ...listeners } : {})}
          className={isAdmin ? 'cursor-grab active:cursor-grabbing flex-1' : 'flex-1'}
        >
          <p className="font-semibold text-gray-800 text-sm leading-snug">{issue.title}</p>
          {issue.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-3 whitespace-pre-wrap">{issue.description}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit?.(issue)}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="Edit"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete?.(issue.id)}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mt-3 items-center">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyles[issue.priority]}`}>
          {issue.priority}
        </span>
        {issue.tags?.map((tag) => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        {new Date(issue.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}
