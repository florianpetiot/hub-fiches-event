import { redirect, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
  const { fiche, profile } = await parent()

  if (fiche.status === 'brouillon') {
    redirect(303, `/fiche-event/${fiche.id}/edition`)
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles(name, role)')
    .eq('form_id', fiche.id)
    .order('created_at', { ascending: true })

  // Marquer les messages comme lus
  const isClub = profile?.role === 'club'
  await supabase
    .from('messages')
    .update(isClub ? { is_read_by_club: true } : { is_read_by_admin: true })
    .eq('form_id', fiche.id)

  return { messages: messages ?? [] }
}

export const actions: Actions = {
  envoyer: async ({ locals: { supabase, getUser }, params, request }) => {
    const user = await getUser()
    if (!user) redirect(303, '/login')

    const formData = await request.formData()
    const content = formData.get('content')?.toString().trim()

    if (!content) return fail(400, { error: 'Le message ne peut pas être vide' })

    // Récupérer la version actuelle de la fiche
    const { data: fiche } = await supabase
      .from('event_forms')
      .select('version, status')
      .eq('id', params.id)
      .single()

    if (!fiche) return fail(404, { error: 'Fiche introuvable' })
    if (fiche.status !== 'soumise' && fiche.status !== 'en_revision') {
      return fail(400, { error: 'La messagerie n\'est pas disponible pour cette fiche' })
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        form_id: params.id,
        sender_id: user.id,
        content,
        form_version: fiche.version,
        is_read_by_club: false,
        is_read_by_admin: false,
      })

    if (error) return fail(500, { error: 'Erreur lors de l\'envoi du message' })

    return { success: true }
  }
}