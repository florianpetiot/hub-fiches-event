import { redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, getUser } }) => {
  const user = await getUser()
  if (!user) throw redirect(303, '/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('event_forms')
    .select('id, title, status, event_date, created_at')
    .order('created_at', { ascending: false })

  if (profile?.role === 'club') {
    query = query.eq('profile_id', profile.id)
  } else {
    query = query.neq('status', 'brouillon')
  }

  const { data: forms } = await query

  return { profile, forms }
}


export const actions: Actions = {
  creerFiche: async ({ locals: { supabase, getUser } }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    // Créer la fiche vide
    const { data: fiche } = await supabase
      .from('event_forms')
      .insert({
        profile_id: user.id,
        status: 'brouillon',
        title: 'Événement sans titre',
        event_date: new Date().toISOString().split('T')[0],
        event_end_date: new Date().toISOString().split('T')[0],
        event_start_time: '17:00',
        event_end_time: '18:00',
        location: '',
        category: '',
      })
      .select('id')
      .single()
    throw redirect(303, `/fiche-event/${fiche!.id}/`)
  }
}