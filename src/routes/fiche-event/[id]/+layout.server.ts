import { redirect, error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ parent, locals: { supabase }, params }) => {

  const parentPromise = parent()  
  const fichePromise = supabase
    .from('event_forms')
    .select('*, profiles!event_forms_profile_id_fkey(name)')
    .eq('id', params.id)
    .single()
  const settingsPromise = supabase
    .from('settings')
    .select('key, value')

  const [parentData, { data: fiche }, { data: settingRows }] = await Promise.all([
    parentPromise,
    fichePromise,
    settingsPromise
  ])

  if (!parentData.profile) throw redirect(303, '/login')
  if (!fiche) error(404, 'Fiche introuvable')

  const settings = Object.fromEntries(
    (settingRows ?? []).map((s: any) => [s.key, s.value])
  )

  return { fiche, profile: parentData.profile, settings }
}
