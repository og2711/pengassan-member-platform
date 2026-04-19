import { supabase } from '@/lib/supabase'
import KanbanBoardClient from '@/components/KanbanBoardClient'

export const revalidate = 0

export default async function HomePage() {
  const [{ data: lanes }, { data: issues }] = await Promise.all([
    supabase.from('lanes').select('*').order('order'),
    supabase.from('issues').select('*').order('order'),
  ])

  return <KanbanBoardClient initialLanes={lanes ?? []} initialIssues={issues ?? []} />
}
