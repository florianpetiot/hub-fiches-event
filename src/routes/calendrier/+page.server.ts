import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({parent, locals: { supabase } }) => {
  const { profile } = await parent()
  
  // Si l'utilisateur est membre d'un club : ne récupérer que ses events (incl. brouillon)
  if (profile?.roles.name === 'club') {
    const [{ data: myForms }, { data: otherForms }] = await Promise.all([
      supabase
        .from('event_forms')
        .select('id, title, status, event_date, event_end_date, profiles!event_forms_profile_id_fkey(name)')
        .eq('profile_id', profile.id)
        .order('event_date', { ascending: true }),
      // ajouter les forms des autres clubs sauf les brouillons
      supabase
        .from('event_forms_public')
        .select('id, title, status, event_date, event_end_date, profiles!event_forms_profile_id_fkey(name)')
        .neq('profile_id', profile.id)
        .order('event_date', { ascending: true })
    ])

    return {
      myForms: myForms ?? [],
      otherForms: otherForms ?? [],
      isClub: true
    }
  }


  // Sinon : tous les events sauf les brouillons
  const { data: forms, error } = await supabase
    .from('event_forms')
    .select('id, title, status, event_date, event_end_date, profiles!event_forms_profile_id_fkey(name)')
    .neq('status', 'brouillon')
    .order('event_date', { ascending: true })

  return { myForms: forms ?? [], isClub: false }
}