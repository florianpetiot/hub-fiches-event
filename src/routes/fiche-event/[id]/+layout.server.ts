import { redirect, error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { supabase, getUser }, params }) => {
  const user = await getUser()
  if (!user) redirect(303, '/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: fiche } = await supabase
    .from('event_forms')
    .select('*')
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