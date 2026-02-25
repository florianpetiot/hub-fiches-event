import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, getUser } }) => {
  const user = await getUser()

  // Si l'utilisateur est membre d'un club : ne récupérer que ses events (incl. brouillon)
  if (user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'club') {
      const { data: forms, error } = await supabase
        .from('event_forms')
        .select('id, title, status, event_date, event_end_date, profiles!event_forms_profile_id_fkey(name)')
        .eq('profile_id', user.id)
        .order('event_date', { ascending: true })

        console.log(forms)

        return { forms: forms ?? [], isClub: true }
    }
  }

  // Sinon : tous les events sauf les brouillons
  const { data: forms, error } = await supabase
    .from('event_forms')
    .select('id, title, status, event_date, event_end_date, profiles!event_forms_profile_id_fkey(name)')
    .neq('status', 'brouillon')
    .order('event_date', { ascending: true })

  return { forms: forms ?? [], isClub: false }
}