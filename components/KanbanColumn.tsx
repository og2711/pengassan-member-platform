'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Lane, Issue } from '@/lib/supabase'
import IssueCard from './IssueCard'

type Props = {
  lane: Lane
  issues: Issue[]
  isAdmin: boolean
  onAddCard?: (laneId: string) => void
  onEditCard?: (issue: Issue) => void
  onDeleteCard?: (id: string) => void
  onOpenCard?: (issue: Issue) => void
}

export default function KanbanColumn({ lane, issues, isAdmin, onAddCard, onEditCard, onDeleteCard, onOpenCard }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: lane.id })

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-lg text-white font-semibold text-sm"
        style={{ backgroundColor: lane.color, boxShadow: `0 4px 14px 0 ${lane.color}99` }}
      >
        <span>{lane.title}</span>
        <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">{issues.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-32 p-3 rounded-b-lg border-2 border-t-0 transition-colors ${
          isOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
        }`}
      >
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isAdmin={isAdmin}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onOpen={onOpenCard}
            />
          ))}
        </SortableContext>

        {isAdmin && (
          <button
            onClick={() => onAddCard?.(lane.id)}
            className="w-full mt-1 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg border border-dashed border-gray-300 transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add card
          </button>
        )}
      </div>
    </div>
  )
}
