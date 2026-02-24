import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, getUser } }) => {
  const user = await getUser()

  // Si l'utilisateur est membre d'un club : ne récupérer que ses events (incl. brouillon)
  if (user?.id) {
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (club?.id) {
      const { data: forms } = await supabase
        .from('event_forms')
        .select('id, title, status, event_date, event_end_date, clubs(name)')
        .eq('club_id', club.id)
        .order('event_date', { ascending: true })

      return { forms: forms ?? [], isClub: true }
    }
  }

  // Sinon : tous les events sauf les brouillons
  const { data: forms } = await supabase
    .from('event_forms')
    .select('id, title, status, event_date, event_end_date, clubs(name)')
    .neq('status', 'brouillon')
    .order('event_date', { ascending: true })
  return { forms: forms ?? [], isClub: false }
}