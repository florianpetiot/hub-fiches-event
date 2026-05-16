import { redirect, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ parent, locals: { supabase } }) => {
  const { profile } = await parent()
  if (!profile) throw redirect(303, '/login')

  let queryStr = 'id, title, status, event_date, created_at'
  if (profile?.roles?.name && profile.roles.name !== 'club') {
    queryStr += ', signatures(status, workflow_etapes(ordre, roles(name)))'
  }

  let query = supabase
    .from('event_forms')
    .select(queryStr)
    .order('created_at', { ascending: false })

  if (profile?.roles?.name === 'club') {
    query = query.eq('profile_id', profile.id)
  } else {
    query = query.neq('status', 'brouillon')
  }

  const unreadPromise = supabase
    .from('messages')
    .select('form_id, message_reads(profile_id)')
    .neq('sender_id', profile.id)
    .eq('message_reads.profile_id', profile.id)
    .then(({ data, error }: { data: any[] | null; error: any }) => {
      if (error) throw error
      if (!data || data.length === 0) return []
      return [...new Set(
        data
          .filter((m: any) => !m.message_reads || m.message_reads.length === 0)
          .map((m: any) => m.form_id)
      )]
    })

  const dashboardPromise = Promise.all([query, unreadPromise]).then(
    ([{ data: rawForms }, unreadFormIds]: [{ data: any[] | null }, string[]]) => {
      const unreadByForm = new Set(unreadFormIds ?? [])

      const forms = rawForms?.map((form: any) => {
        let monTour = false

        if (profile?.roles?.name && profile.roles.name !== 'club' && form.status === 'soumise' && form.signatures) {
          const signatures = form.signatures
            .sort((a: any, b: any) => (a.workflow_etapes?.ordre ?? 0) - (b.workflow_etapes?.ordre ?? 0))
            .map((sig: any, index: number) => ({
              ...sig,
              ordre_relatif: index + 1
            }))

          const maSignature = signatures.find((s: any) => s.workflow_etapes?.roles?.name === profile.roles.name)

          if (maSignature && maSignature.status !== 'signe') {
            monTour = signatures
              .filter((s: any) => s.ordre_relatif < maSignature.ordre_relatif)
              .every((s: any) => s.status === 'signe')
          }
        }

        const { signatures, ...rest } = form
        return { ...rest, monTour }
      }) ?? []

      return {
        forms,
        unreadByForm: [...unreadByForm]
      }
    }
  )

  return { profile, forms: dashboardPromise }
}


export const actions: Actions = {
  creerFiche: async ({ locals: { supabase, getUser } }) => {
    const user = await getUser()
    if (!user) throw redirect(303, '/login')

    // Créer la fiche vide
    const { data: fiche } = await supabase
      .from('event_forms')
      .insert({
        profile_id: user.id,
        status: 'brouillon',
        title: 'Événement sans titre',
        event_date: new Date().toISOString().split('T')[0],
        event_end_date: new Date().toISOString().split('T')[0],
        event_start_time: '17:00',
        event_end_time: '18:00',
        location: '',
        category: '',
      })
      .select('id')
      .single()
    throw redirect(303, `/fiche-event/${fiche!.id}/`)
  },

  dupliquerFiche: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) redirect(303, '/login')

    const formData = await request.formData()
    const formId = formData.get('form_id')?.toString()
    if (!formId) return fail(400, { error: 'ID manquant' })

    // Récupérer la fiche originale
    const { data: original } = await supabase
        .from('event_forms')
        .select('*')
        .eq('id', formId)
        .eq('profile_id', user.id)  // sécurité : seulement ses propres fiches
        .single()

    if (!original) return fail(404, { error: 'Fiche introuvable' })

    // Nettoyer alcohol — retirer les chemins PDF et les dates de demande
    const alcoholPropre = original.alcohol ? {
        ...original.alcohol,
        ddb_mairie: {
            date_demande: '',
            autorisation_path: ''
        },
        ddb_nantes_universite: {
            date_demande: '',
            autorisation_path: ''
        }
        // prevention et structure_licence sont gardés — pas de fichiers
    } : null

    // Nettoyer agent_secu — retirer les chemins PDF
    const agentSecuPropre = original.agent_secu ? {
        secouristes: {
            ...original.agent_secu.secouristes,
            organisme_devis_path: ''
        },
        entreprise_securite: {
            ...original.agent_secu.entreprise_securite,
            devis_path: ''
        }
    } : null

    // Dupliquer en brouillon — exclure les champs auto-générés et liés aux signatures
    const { data: nouvelle } = await supabase
        .from('event_forms')
        .insert({
            profile_id: user.id,
            status: 'brouillon',
            title: `Copie de ${original.title}`,
            event_date: new Date().toISOString().split('T')[0],
            event_end_date: new Date().toISOString().split('T')[0],
            event_start_time: original.event_start_time,
            event_end_time: original.event_end_time,
            location: original.location,
            category: original.category,
            description: original.description,
            budget: original.budget,
            estimated_attendees: original.estimated_attendees,
            has_external_people: original.has_external_people,
            needs_equipment: original.needs_equipment,
            needs_communication: original.needs_communication,
            has_food: original.has_food,
            needs_bulle_ssi: original.needs_bulle_ssi,
            needs_agent_secu: original.needs_agent_secu,
            equipment: original.equipment,
            communication: original.communication,
            food: original.food,
            responsible_prevention: original.responsible_prevention,
            responsible_security: original.responsible_security,
            responsible_organisation: original.responsible_organisation,
            alcohol: alcoholPropre,
            security: original.security,
            agent_secu: agentSecuPropre
        })
        .select('id')
        .single()

      if (!nouvelle) return fail(500, { error: 'Erreur lors de la duplication' })

      redirect(303, `/fiche-event/${nouvelle.id}/edition`)
  }
  
}