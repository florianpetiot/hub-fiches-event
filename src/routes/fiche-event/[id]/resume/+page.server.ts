import type { PageServerLoad, Actions } from './$types'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
  const { fiche, profile } = await parent()

  if (fiche.status === 'brouillon') {
    throw redirect(303, `/fiche-event/${fiche.id}/edition`)
  }

  const { data: signaturesRaw } = await supabase
    .from('signatures')
    .select('*, workflow_etapes(ordre, roles(name))')
    .eq('form_id', fiche.id)
    .order('workflow_etapes(ordre)')

  // Aplatir les ordres : 1, 2, 3... peu importe les trous
  const signatures = (signaturesRaw ?? [])
    .sort((a: any, b: any) => (a.workflow_etapes?.ordre ?? 0) - (b.workflow_etapes?.ordre ?? 0))
    .map((sig: any, index: number) => ({
      ...sig,
      ordre_relatif: index + 1  // ordre propre à cette fiche, sans trous
    }))

  return { signatures }
}

export const actions: Actions = {
  refuser: async ({ locals: {supabase, getUser}, params }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single()
    if (profile?.roles?.name !== 'direction') {
      return fail(403, { error: 'Seule la direction peut refuser une fiche' })
    }
    
      // Récuperer le status de la fiche
    const { data: fiche, error } = await supabase
      .from('event_forms')
      .select('status, version')
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

    const { supabaseAdmin } = await import('$lib/supabase-admin')
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

  // Action signer
  signer: async ({ locals: { supabase, getUser }, params }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    const { data: fiche } = await supabase
      .from('event_forms')
      .select('status')
      .eq('id', params.id)
      .single()
    if (!fiche || fiche.status !== 'soumise') {
      return fail(400, { error: 'Cette fiche ne peut pas être signée dans son état actuel' })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single()

    // Trouver la signature correspondant au rôle de l'utilisateur sur cette fiche
    const { data: signature } = await supabase
      .from('signatures')
      .select('*, workflow_etapes(ordre)')
      .eq('form_id', params.id)
      .eq('status', 'en_attente')
      .in('workflow_etape_id',
        (await supabase.from('workflow_etapes').select('id').eq('role_id', profile!.role_id)).data?.map((e: any) => e.id) ?? []
      )
      .single()

    if (!signature) return fail(403, { error: 'Ce n\'est pas votre tour de signer' })

    // Récupérer toutes les signatures de la fiche triées
    const { data: toutesSignatures } = await supabase
      .from('signatures')
      .select('id, status, workflow_etapes(ordre)')
      .eq('form_id', params.id)
      .order('workflow_etapes(ordre)')

    const sorted = (toutesSignatures ?? [])
      .sort((a: any, b: any) => (a.workflow_etapes?.ordre ?? 0) - (b.workflow_etapes?.ordre ?? 0))

    const indexMaSignature = sorted.findIndex((s: any) => s.id === signature.id)

    // Vérifier que tout ce qui est avant est signé
    const toutSigne = sorted
      .slice(0, indexMaSignature)
      .every((s: any) => s.status === 'signe')

    if (!toutSigne) return fail(403, { error: 'Des étapes précédentes ne sont pas encore signées' })
    
    // Signer
    const { error: signError } = await supabase 
      .from('signatures')
      .update({ status: 'signe', signed_by: user.id, signed_at: new Date().toISOString() })
      .eq('id', signature.id)
    if (signError) {
      console.error('Supabase update error (signer):', signError)
      return fail(500, { error: 'Erreur serveur lors de la signature de la fiche' })
    }

    // Notifier dans la messagerie
    const { data: fichePourMessage } = await supabase
      .from('event_forms')
      .select('version')
      .eq('id', params.id)
      .single()

    const { supabaseAdmin } = await import('$lib/supabase-admin')
    await supabaseAdmin.from('messages').insert({
      form_id: params.id,
      sender_id: user.id,
      content: "SYSTEM_MESSAGE:SIGNATURE_ETAPE",
      form_version: fichePourMessage?.version ?? 1,
      is_read_by_club: false,
      is_read_by_admin: true,
      is_system: true
    })

    // Vérifier si c'était la dernière signature (direction)
    const { data: restantes } = await supabase
      .from('signatures')
      .select('status')
      .eq('form_id', params.id)
      .eq('status', 'en_attente')

    if (!restantes || restantes.length === 0) {
      // Toutes les signatures sont faites → valider la fiche
      const { error: updateError } = await supabase
        .from('event_forms')
        .update({ status: 'validee', signed_by: user.id, signed_at: new Date().toISOString() })
        .eq('id', params.id)

      if (updateError) {
        console.error('Supabase update error (valider):', updateError)
        return fail(500, { error: 'Erreur serveur lors de la validation finale de la fiche' })
      }

      // envoyer un message systeme séparateur pour la validation finale
      await supabaseAdmin.from('messages').insert({
        form_id: params.id,
        sender_id: user.id,
        content: 'SYSTEM_MESSAGE:VALIDATION_FICHE',
        form_version: fichePourMessage?.version ?? 1,
        is_read_by_club: false,
        is_read_by_admin: true,
        is_system: true
      })
      
      throw redirect(303, '/dashboard')
    }

    return { signer: { success: true } }
  },

  demander_revision: async ({ locals: {supabase, getUser}, params, request }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    // verifier si "direction" ou "c'est son tour"
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single()

    // verifier si "direction" ou "c'est son tour"
    const { data: signature } = await supabase
      .from('signatures')
      .select('*, workflow_etapes(ordre)')
      .eq('form_id', params.id)
      .eq('status', 'en_attente')
      .in('workflow_etape_id',
        (await supabase.from('workflow_etapes').select('id').eq('role_id', profile!.role_id)).data?.map((e: any) => e.id) ?? []
      )
      .single()

    if (profile?.roles?.name !== 'direction' && !signature) {
      return fail(403, { error: 'Seule la direction ou la personne dont c\'est le tour de signer peut demander une révision' })
    }

    const formData = await request.formData()
    const message = formData.get('message')?.toString().trim()

    if (!message) {
      return fail(400, { error: 'Le message de demande de révision est requis' })
    }

    const { data: fiche, error } = await supabase
      .from('event_forms')
      .select('version, status')
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
    
    // Mettre à jour le status de la fiche
    const { error: updateError } = await supabase
      .from('event_forms')
      .update({ status: 'en_revision', updated_at: new Date().toISOString() })
      .eq('id', params.id)
    if (updateError) {
      console.error('Supabase update error (demander_revision):', updateError)
      return fail(500, { error: 'Erreur serveur lors de la mise à jour de la fiche' })
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

    const { supabaseAdmin } = await import('$lib/supabase-admin')
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


    throw redirect(303, './messagerie')
  }
}