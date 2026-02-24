import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, getUser } }) => {
  const user = await getUser()

  const { data: forms } = await supabase
    .from('event_forms')
    .select('id, title, status, event_date, event_end_date, clubs(name)')
    .neq('status', 'brouillon')
    .order('event_date', { ascending: true })

  return { forms: forms ?? [] }
}