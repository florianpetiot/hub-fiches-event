import type { PageServerLoad, Actions } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase-admin'

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
      .update({ status: 'refusee', updated_at: new Date().toISOString() })
      .eq('id', params.id)
    if (updateError) {
      console.error('Supabase update error (refuser):', updateError)
      return fail(500, { error: 'Erreur serveur lors de la mise à jour de la fiche' })
    }

    // envoyer un message systeme séparateur
    await supabaseAdmin.from('messages').insert({
      form_id: params.id,
      sender_id: user.id,
      content: 'SYSTEM_MESSAGE:REFUS_FICHE',
      form_version: fiche.version,
      is_read_by_club: false,
      is_read_by_admin: true,
      is_system: true
    })

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
      .update({ status: 'validee', signed_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', params.id)
    if (updateError) {
      console.error('Supabase update error (valider):', updateError)
      return fail(500, { error: 'Erreur serveur lors de la mise à jour de la fiche' })
    }

    // envoyer un message systeme séparateur
    await supabaseAdmin.from('messages').insert({
      form_id: params.id,
      sender_id: user.id,
      content: 'SYSTEM_MESSAGE:VALIDATION_FICHE',
      form_version: fiche.version,
      is_read_by_club: false,
      is_read_by_admin: true,
      is_system: true
    })

    throw redirect(303, '/dashboard')
  },

  demander_revision: async ({ locals: {supabase, getUser}, params, request }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    const formData = await request.formData()
    const message = formData.get('message')?.toString().trim()

    if (!message) {
      return fail(400, { error: 'Le message de demande de révision est requis' })
    }

    const { data: fiche, error } = await supabase
      .from('event_forms')
      .select('version, status, clubs(*)')
      .eq('id', params.id)
      .single()
    if (error) {
      console.error('Supabase select error (demander_revision):', error)
      return fail(500, { error: 'Erreur serveur lors de la récupération de la fiche' })
    }

    if (!fiche) return fail(404, { error: 'Fiche introuvable' })
    if (fiche.status !== 'soumise') {
      return fail(400, { error: 'Cette fiche doit être soumise pour pouvoir demander une révision' })
    }

    // Envoyer le message de demande de révision
    await supabase.from('messages').insert({
      form_id: params.id,
      sender_id: user.id,
      content: message,
      form_version: fiche.version,
      is_read_by_club: false,
      is_read_by_admin: true,
      is_system: false
    })

    // Envoyer le message systeme séparateur
    await supabaseAdmin.from('messages').insert({
      form_id: params.id,
      sender_id: user.id,
      content: 'SYSTEM_MESSAGE:DEMANDE_REVISION',
      form_version: fiche.version,
      is_read_by_club: false,
      is_read_by_admin: true,
      is_system: true
    })

    // Mettre à jour le status de la fiche
    await supabase
      .from('event_forms')
      .update({ status: 'en_revision', updated_at: new Date().toISOString() })
      .eq('id', params.id)

    throw redirect(303, './messagerie')
  }
}