import { redirect, error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { supabase, getUser }, params }) => {
  const user = await getUser()
  if (!user) redirect(303, '/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, clubs(*)')
    .eq('id', user.id)
    .single()

  const { data: fiche } = await supabase
    .from('event_forms')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!fiche) error(404, 'Fiche introuvable')

  return { fiche, profile }
}