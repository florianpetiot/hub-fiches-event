import type { PageServerLoad, Actions } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { validateFiche } from '$lib/validateFiche'
import { form } from '$app/server'
import { supabaseAdmin } from '$lib/supabase-admin'


export const load: PageServerLoad = async ({ parent }) => {
  const { fiche, profile } = await parent()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'secretaire_generale'

  // Les admins n'ont pas accès à l'édition
  if (isAdmin) redirect(303, './resume')

  // La fiche doit être en brouillon ou en révision
  if (fiche.status !== 'brouillon' && fiche.status !== 'en_revision') {
    redirect(303, './resume')
  }

  return {}
}

export const actions: Actions = {
  soumettre: async ({ locals: { supabase, getUser }, params }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    // Récupérer la fiche complète
    const { data: fiche, error: selectError } = await supabase
      .from('event_forms')
      .select('*, clubs(*)')
      .eq('id', params.id)
      .single()

    if (selectError) {
      console.error('Supabase select error (soumettre):', selectError)
      return fail(500, { error: 'Erreur serveur lors de la récupération de la fiche' })
    }

    if (!fiche) return fail(404, { error: 'Fiche introuvable' })

    // Vérifier que la fiche appartient bien au club de l'utilisateur
    if (fiche.clubs.profile_id !== user.id) {
      return fail(403, { error: 'Non autorisé' })
    }

    // Vérifier que la fiche est bien en brouillon
    if (fiche.status !== 'brouillon' && fiche.status !== 'en_revision') {
      return fail(400, { error: 'Cette fiche ne peut plus être soumise' })
    }

    // Validation des champs
    const errors = validateFiche(fiche)
    if (errors.length > 0) {
      return fail(400, { errors })
    }

    // Tout est bon → soumettre
    const { error: updateError } = await supabase
      .from('event_forms')
      .update({ status: 'soumise', updated_at: new Date().toISOString(), version: (fiche.version ?? 0) + 1 })
      .eq('id', fiche.id)

    if (updateError) {
      console.error('Supabase update error (soumettre):', updateError)
      return fail(500, { error: 'Erreur serveur lors de la soumission' })
    }

    throw redirect(303, '/dashboard')
  },

  supprimer: async ({ locals: { supabase, getUser }, params }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    const { data: fiche, error: selectError } = await supabase
      .from('event_forms')
      .select('*, clubs(*)')
      .eq('id', params.id)
      .single()

    if (selectError) {
      console.error('Supabase select error (supprimer):', selectError)
      return fail(500, { error: 'Erreur serveur lors de la récupération de la fiche' })
    }

    if (!fiche) return fail(404, { error: 'Fiche introuvable' })
    if (fiche.clubs.profile_id !== user.id) return fail(403, { error: 'Non autorisé' })
    if (fiche.status !== 'brouillon' && fiche.status !== 'en_revision') return fail(400, { error: 'Cette fiche ne peut pas être supprimée' })

    const { error: deleteError } = await supabase.from('event_forms').delete().eq('id', fiche.id)
    if (deleteError) {
      console.error('Supabase delete error (supprimer):', deleteError)
      return fail(500, { error: 'Erreur serveur lors de la suppression' })
    }

    throw redirect(303, '/dashboard')
  },

  mettre_a_jour: async ({ locals: { supabase, getUser }, params, request }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    const { data: fiche, error: selectError } = await supabase
      .from('event_forms')
      .select('*, clubs(*)')
      .eq('id', params.id)
      .single()
    if (selectError) {
      console.error('Supabase select error (mettre_a_jour):', selectError)
      return fail(500, { error: 'Erreur serveur lors de la récupération de la fiche' })
    }

    if (!fiche) return fail(404, { error: 'Fiche introuvable' })
    if (fiche.clubs.profile_id !== user.id) return fail(403, { error: 'Non autorisé' })
    if (fiche.status !== 'en_revision') return fail(400, { error: 'Cette fiche ne peut pas être mise à jour' })

    // Validation des champs
    const error = await validateFiche(fiche)
    if (error.length > 0) {
      return fail(400, { errors: error })
    }

    // Récupérer le message de mise à jour
    const formData = await request.formData()
    const message = formData.get('update_message')?.toString().trim()
    if (!message) {
      return fail(400, { error: 'Le message de mise à jour est requis' })
    }

    // Mettre à jour la fiche
    const { error: updateError } = await supabase
      .from('event_forms')
      .update({
        status: 'soumise',
        updated_at: new Date().toISOString(),
        version: (fiche.version ?? 0) + 1,
      })
      .eq('id', fiche.id)
    if (updateError) {
      console.error('Supabase update error (mettre_a_jour):', updateError)
      return fail(500, { error: 'Erreur serveur lors de la mise à jour de la fiche' })
    }

    // Envoyer le message de mise à jour
    await supabase.from('messages').insert({
      form_id: params.id,
      sender_id: user.id,
      content: message,
      form_version: (fiche.version ?? 0) + 1,
      is_read_by_club: true,
      is_read_by_admin: false,
      is_system: false
    })

    // envoyer le message systeme séparateur
    await supabaseAdmin.from('messages').insert({
      form_id: params.id,
      sender_id: user.id,
      content: 'SYSTEM_MESSAGE:MISE_A_JOUR',
      form_version: (fiche.version ?? 0) + 1,
      is_read_by_club: true,
      is_read_by_admin: false,
      is_system: true
    })

    redirect(303, './messagerie')

  }
}