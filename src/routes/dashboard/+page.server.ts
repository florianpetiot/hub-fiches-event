import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session } = await safeGetSession()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, clubs(*)')
    .eq('id', session!.user.id)
    .single()

  let query = supabase
    .from('event_forms')
    .select('id, title, status, event_date, created_at')
    .order('created_at', { ascending: false })

  if (profile?.role === 'club') {
    query = query.eq('club_id', profile.clubs.id)
  } else {
    query = query.neq('status', 'brouillon')
  }

  const { data: forms } = await query

  return { profile, forms }
}