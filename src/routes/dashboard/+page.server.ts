import { redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  if (!user) throw redirect(303, '/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, clubs(*)')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('event_forms')
    .select('id, title, status, event_date, created_at')
    .order('created_at', { ascending: false })

  if (profile?.role === 'club') {
    const clubId = Array.isArray(profile.clubs) ? profile.clubs[0]?.id : profile.clubs?.id
    query = query.eq('club_id', clubId)
  } else {
    query = query.neq('status', 'brouillon')
  }

  const { data: forms } = await query

  return { profile, forms }
}


export const actions: Actions = {
  creerFiche: async ({ locals: { supabase } }) => {
    const { data, error } = await supabase.auth.getUser()
    const user = data?.user
    if (!user) throw redirect(303, '/login')

    // Récupérer le club de l'utilisateur
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    console.log('Club trouvé :', club)

    // Créer la fiche vide
    const { data: fiche } = await supabase
      .from('event_forms')
      .insert({
        club_id: club!.id,
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
      
    console.log('Fiche créée :', fiche)
    throw redirect(303, `/fiche-event/${fiche!.id}/`)
  }
}