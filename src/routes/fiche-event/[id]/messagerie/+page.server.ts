import { redirect, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
  const { fiche } = await parent()

  if (fiche.status === 'brouillon') {
    throw redirect(303, `/fiche-event/${fiche.id}/edition`)
  }

  const messagesPromise = supabase
    .from('messages')
    .select('*, profiles(name, roles(name, label))')
    .eq('form_id', fiche.id)
    .order('created_at', { ascending: true })
    .then(({ data: messages }: { data: any[] | null }) => messages ?? [])

  return { messages: messagesPromise }
}

export const actions: Actions = {
  marquer_lus: async ({ locals: { supabase, getUser }, params }) => {
    const user = await getUser()
    if (!user) return fail(401, { error: 'Utilisateur non authentifié' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('roles(name)')
      .eq('id', user.id)
      .single()

    const isClub = profile?.roles?.name === 'club'

    const { error } = await supabase
      .from('messages')
      .update(isClub ? { is_read_by_club: true } : { is_read_by_admin: true })
      .eq('form_id', params.id)

    if (error) {
      return fail(500, { error: 'Impossible de marquer les messages comme lus' })
    }

    return { success: true }
  },

  envoyer: async ({ locals: { supabase, getUser }, params, request }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

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
    if (fiche.status !== 'soumise' && fiche.status !== 'en_revision' && fiche.status !== 'acceptee' && fiche.status !== 'refusee') {
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