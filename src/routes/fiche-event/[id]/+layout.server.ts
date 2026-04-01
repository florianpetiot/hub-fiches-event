import { redirect, error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ parent, locals: { supabase }, params }) => {

  const { profile } = await parent()
  if (!profile) throw redirect(303, '/login')

  const { data: fiche } = await supabase
    .from('event_forms')
    .select('*, profiles!event_forms_profile_id_fkey(name)')
    .eq('id', params.id)
    .single()

  if (!fiche) error(404, 'Fiche introuvable')

  const { data: settingRows } = await supabase
    .from('settings')
    .select('key, value')

  const settings = Object.fromEntries(
    (settingRows ?? []).map((s: any) => [s.key, s.value])
  )

  return { fiche, profile, settings }
}