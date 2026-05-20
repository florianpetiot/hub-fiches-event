import { redirect, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import type { MessageWithProfile } from '$lib/types/app.types'

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
  const { fiche } = await parent()

  if (fiche.status === 'brouillon') {
    throw redirect(303, `/fiche-event/${fiche.id}/edition`)
  }

  const messagesPromise = supabase
    .from('messages')
    .select('*, profiles!messages_sender_id_fkey(name, roles(name, label))')
    .eq('form_id', fiche.id)
    .order('created_at', { ascending: true })
    .then(({ data: messages }: { data: MessageWithProfile[] | null }) => messages ?? [])

  return { messages: messagesPromise }
}

export const actions: Actions = {
  marquer_lus: async ({ locals: { supabase, getUser }, params }) => {
    const user = await getUser()
    if (!user) return fail(401)

    // Récupérer tous les messages non encore lus par cet utilisateur
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('form_id', params.id)
      .neq('sender_id', user.id)

    if (!messages?.length) return { success: true }

    // Upsert pour éviter les doublons si appelé plusieurs fois
    await supabase
      .from('message_reads')
      .upsert(
        messages.map((m: { id: string }) => ({
          message_id: m.id,
          profile_id: user.id
        })),
        { onConflict: 'message_id,profile_id', ignoreDuplicates: true }
      )

    return { success: true }
  },

  envoyer: async ({ locals: { supabase, getUser }, params, request }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    const formData = await request.formData()
    const content = formData.get('content')?.toString().trim()
    if (!content) return fail(400, { error: 'Le message ne peut pas être vide' })

    const { data: fiche, error: ficheError } = await supabase
      .from('event_forms')
      .select('version, status')
      .eq('id', params.id)
      .single()

    if (ficheError || !fiche) {
      return fail(404, { error: 'Fiche introuvable' })
    }

    const { data: newMsg, error: insertError } = await supabase
      .from('messages')
      .insert({
        form_id: params.id,
        sender_id: user.id,
        content,
        form_version: fiche.version
      })
      .select('id')
      .single()

    if (insertError || !newMsg) {
      return fail(500, { error: 'Erreur lors de l’envoi' })
    }

    return { success: true }
  }
}