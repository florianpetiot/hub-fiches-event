import type { PageServerLoad, Actions } from './$types'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ parent }) => {
  await parent()
  return {}
}

export const actions: Actions = {
  refuser: async ({ locals: {supabase, getUser}, params }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    // Récuperer le status de la fiche
    const { data: fiche, error } = await supabase
      .from('event_forms')
      .select('status')
      .eq('id', params.id)
      .single()
    if (error) {
      console.error('Supabase select error (refuser):', error)
      return fail(500, { error: 'Erreur serveur lors de la récupération de la fiche' })
    }

    if (!fiche) return fail(404, { error: 'Fiche introuvable' })
    if (fiche.status !== 'soumise') {
      return fail(400, { error: 'Cette fiche ne peut plus être refusée' })
    }

    // Mettre à jour le status de la fiche
    const { error: updateError } = await supabase
      .from('event_forms')
      .update({ status: 'refusee' })
      .eq('id', params.id)
    if (updateError) {
      console.error('Supabase update error (refuser):', updateError)
      return fail(500, { error: 'Erreur serveur lors de la mise à jour de la fiche' })
    }

    throw redirect(303, '/dashboard')
  },

  valider: async ({ locals: {supabase, getUser}, params }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    // Récuperer le status de la fiche
    const { data: fiche, error } = await supabase
      .from('event_forms')
      .select('status')
      .eq('id', params.id)
      .single()
    if (error) {
      console.error('Supabase select error (valider):', error)
      return fail(500, { error: 'Erreur serveur lors de la récupération de la fiche' })
    }

    if (!fiche) return fail(404, { error: 'Fiche introuvable' })
    if (fiche.status !== 'soumise') {
      return fail(400, { error: 'Cette fiche ne peut plus être validée' })
    }

    // Mettre à jour le status de la fiche
    const { error: updateError } = await supabase
      .from('event_forms')
      .update({ status: 'validee' })
      .eq('id', params.id)
    if (updateError) {
      console.error('Supabase update error (valider):', updateError)
      return fail(500, { error: 'Erreur serveur lors de la mise à jour de la fiche' })
    }

    throw redirect(303, '/dashboard')
  }
}