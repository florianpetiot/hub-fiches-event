import { redirect, error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ parent, locals: { supabase }, params }) => {

  const parentPromise = parent()  
  const fichePromise = supabase
    .from('event_forms')
    .select('id, status, title, event_date, version, profiles!event_forms_profile_id_fkey(name)')
    .eq('id', params.id)
    .single()

  const [parentData, { data: fiche }] = await Promise.all([
    parentPromise,
    fichePromise
  ])

  if (!parentData.profile) throw redirect(303, '/login')
  if (!fiche) error(404, 'Fiche introuvable')

  return { fiche, profile: parentData.profile }
}
