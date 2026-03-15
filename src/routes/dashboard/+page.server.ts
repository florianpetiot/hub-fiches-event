import { redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, getUser } }) => {
  const user = await getUser()
  if (!user) throw redirect(303, '/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, roles(name, label)')
    .eq('id', user.id)
    .single()

  let queryStr = 'id, title, status, event_date, created_at'
  if (profile?.roles?.name && profile.roles.name !== 'club') {
    queryStr += ', signatures(status, workflow_etapes(ordre, roles(name)))'
  }

  let query = supabase
    .from('event_forms')
    .select(queryStr)
    .order('created_at', { ascending: false })

  if (profile?.roles?.name === 'club') {
    query = query.eq('profile_id', profile.id)
  } else {
    query = query.neq('status', 'brouillon')
  }

  const { data: rawForms } = await query

  const forms = rawForms?.map((form: any) => {
    let monTour = false;

    if (profile?.roles?.name && profile.roles.name !== 'club' && form.status === 'soumise' && form.signatures) {
      const signatures = form.signatures
        .sort((a: any, b: any) => (a.workflow_etapes?.ordre ?? 0) - (b.workflow_etapes?.ordre ?? 0))
        .map((sig: any, index: number) => ({
          ...sig,
          ordre_relatif: index + 1
        }));

      const maSignature = signatures.find((s: any) => s.workflow_etapes?.roles?.name === profile.roles.name);

      if (maSignature && maSignature.status !== 'signe') {
        monTour = signatures
          .filter((s: any) => s.ordre_relatif < maSignature.ordre_relatif)
          .every((s: any) => s.status === 'signe');
      }
    }

    const { signatures, ...rest } = form;
    return { ...rest, monTour };
  }) ?? [];

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