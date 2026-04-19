'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Lane, Issue, supabase } from '@/lib/supabase'
import KanbanColumn from './KanbanColumn'
import IssueCard from './IssueCard'
import IssueModal from './IssueModal'
import IssueDetailPanel from './IssueDetailPanel'

type Props = {
  initialLanes: Lane[]
  initialIssues: Issue[]
  isAdmin: boolean
}

export default function KanbanBoard({ initialLanes, initialIssues, isAdmin }: Props) {
  const [lanes] = useState<Lane[]>(initialLanes)
  const [issues, setIssues] = useState<Issue[]>(initialIssues)
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)
  const [detailIssue, setDetailIssue] = useState<Issue | null>(null)
  const [modalState, setModalState] = useState<{ open: boolean; issue?: Issue; laneId?: string }>({ open: false })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const issuesForLane = (laneId: string) =>
    issues.filter((i) => i.lane_id === laneId).sort((a, b) => a.order - b.order)

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveIssue(issues.find((i) => i.id === active.id) ?? null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    const activeIssueItem = issues.find((i) => i.id === activeId)
    if (!activeIssueItem) return

    // Check if dragging over a lane (column drop zone) or another card
    const overLane = lanes.find((l) => l.id === overId)
    const overIssue = issues.find((i) => i.id === overId)
    const targetLaneId = overLane?.id ?? overIssue?.lane_id

    if (!targetLaneId || activeIssueItem.lane_id === targetLaneId) return

    setIssues((prev) =>
      prev.map((i) => (i.id === activeId ? { ...i, lane_id: targetLaneId } : i))
    )
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveIssue(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeIssueItem = issues.find((i) => i.id === activeId)
    if (!activeIssueItem) return

    const overLane = lanes.find((l) => l.id === overId)
    const overIssue = issues.find((i) => i.id === overId)
    const targetLaneId = overLane?.id ?? overIssue?.lane_id ?? activeIssueItem.lane_id

    const laneIssues = issues
      .filter((i) => i.lane_id === targetLaneId)
      .sort((a, b) => a.order - b.order)

    let newIssues = [...issues]

    if (activeId !== overId && overIssue) {
      const oldIndex = laneIssues.findIndex((i) => i.id === activeId)
      const newIndex = laneIssues.findIndex((i) => i.id === overId)
      const reordered = arrayMove(laneIssues, oldIndex, newIndex)

      newIssues = issues.map((i) => {
        const reorderedItem = reordered.find((r) => r.id === i.id)
        return reorderedItem ? { ...reorderedItem, order: reordered.indexOf(reorderedItem) } : i
      })
      setIssues(newIssues)
    }

    // Persist to Supabase
    await supabase
      .from('issues')
      .update({ lane_id: targetLaneId, order: newIssues.find((i) => i.id === activeId)?.order ?? 0 })
      .eq('id', activeId)
  }

  const handleSaveIssue = useCallback(async (data: Partial<Issue>) => {
    if (modalState.issue) {
      // Update
      const { data: updated } = await supabase
        .from('issues')
        .update(data)
        .eq('id', modalState.issue.id)
        .select()
        .single()
      if (updated) setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    } else {
      // Insert
      const order = issues.filter((i) => i.lane_id === data.lane_id).length
      const { data: created } = await supabase
        .from('issues')
        .insert({ ...data, order })
        .select()
        .single()
      if (created) setIssues((prev) => [...prev, created])
    }
    setModalState({ open: false })
  }, [modalState.issue, issues])

  const handleDeleteIssue = useCallback(async (id: string) => {
    if (!confirm('Delete this issue?')) return
    await supabase.from('issues').delete().eq('id', id)
    setIssues((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 overflow-x-auto pb-4">
          {lanes.map((lane) => (
            <KanbanColumn
              key={lane.id}
              lane={lane}
              issues={issuesForLane(lane.id)}
              isAdmin={isAdmin}
              onAddCard={(laneId) => setModalState({ open: true, laneId })}
              onEditCard={(issue) => setModalState({ open: true, issue })}
              onDeleteCard={handleDeleteIssue}
              onOpenCard={(issue) => setDetailIssue(issue)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeIssue && (
            <IssueCard issue={activeIssue} isAdmin={false} />
          )}
        </DragOverlay>
      </DndContext>

      {modalState.open && (
        <IssueModal
          lanes={lanes}
          issue={modalState.issue}
          defaultLaneId={modalState.laneId}
          onSave={handleSaveIssue}
          onClose={() => setModalState({ open: false })}
        />
      )}

      {detailIssue && (
        <IssueDetailPanel
          issue={detailIssue}
          lane={lanes.find((l) => l.id === detailIssue.lane_id)}
          isAdmin={isAdmin}
          onClose={() => setDetailIssue(null)}
        />
      )}
    </>
  )
}
