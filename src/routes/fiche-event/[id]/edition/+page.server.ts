import type { PageServerLoad, Actions } from './$types'
import { fail, redirect } from '@sveltejs/kit'


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
    const errors: string[] = []

    if (!fiche.title?.trim()) errors.push("Le titre est obligatoire")
    if (!fiche.event_date) errors.push("La date de début est obligatoire")
    if (!fiche.event_end_date) errors.push("La date de fin est obligatoire")
    if (!fiche.event_start_time) errors.push("L'heure de début est obligatoire")
    if (!fiche.event_end_time) errors.push("L'heure de fin est obligatoire")
    if (new Date(`${fiche.event_date}T${fiche.event_start_time}`) >= new Date(`${fiche.event_end_date}T${fiche.event_end_time}`)) {
      errors.push("La date et l'heure de fin doivent être après la date et l'heure de début")
    }
    if (!fiche.location?.trim()) errors.push("Le lieu est obligatoire")
    if (!fiche.category) errors.push("La catégorie est obligatoire")
    if (!fiche.estimated_attendees || fiche.estimated_attendees <= 0) errors.push("Le nombre de personnes est obligatoire")
    if (fiche.budget === null || fiche.budget === undefined) errors.push("Le budget est obligatoire")

    if (fiche.needs_equipment) {
      const eq = fiche.equipment
      const total = (eq.tables ?? 0) + (eq.chaises ?? 0) + (eq.panneaux ?? 0) + (eq.rallonges ?? 0) + (eq.multiprises ?? 0)
      if (total === 0 && !eq.autre?.trim()) errors.push("Matériel : aucun élément spécifié")
    }

    if (fiche.needs_communication) {
      const com = fiche.communication
      if (!com.mur_ecrans && !com.intranet && !com.reseaux_sociaux && !com.newsletter) {
        errors.push("Communication : aucun canal sélectionné")
      }
      if (!com.description?.trim()) errors.push("Communication : description du contenu obligatoire")
    }

    if (fiche.has_food) {
      if (fiche.food.has_caterer) {
        if (!fiche.food.caterer_name?.trim()) errors.push("Prestataire : nom obligatoire")
        if (fiche.food.caterer_siret?.length !== 14) errors.push("Prestataire : SIRET invalide")
      } else {
        if (!fiche.food.organisation?.trim()) errors.push("Alimentation : organisation obligatoire")
      }
      if (!fiche.food.menu?.trim()) errors.push("Alimentation : menu obligatoire")
    }

    for (const [key, label] of [
      ['responsible_prevention', 'Prévention'],
      ['responsible_security', 'Sécurité'],
      ['responsible_organisation', 'Organisation'],
    ]) {
      const r = fiche[key]
      if (!r?.nom?.trim()) errors.push(`Responsable ${label} : nom obligatoire`)
      if (!r?.prenom?.trim()) errors.push(`Responsable ${label} : prénom obligatoire`)
      if (!r?.email?.trim() || !r.email.includes('@')) errors.push(`Responsable ${label} : email invalide`)
      if (!r?.departement?.trim()) errors.push(`Responsable ${label} : département obligatoire`)
    }

    if (fiche.alcohol?.enabled) {
      if (!fiche.alcohol.structure_licence?.trim()) errors.push("Alcool : structure détentrice de la licence obligatoire")
      if (!fiche.alcohol.ddb_mairie.enabled && !fiche.alcohol.ddb_nantes_universite.enabled) {
        errors.push("Alcool : au moins une demande de débit de boisson requise")
      }
      if (fiche.alcohol.ddb_mairie.enabled && !fiche.alcohol.ddb_mairie.date_demande) {
        errors.push("Alcool : date de demande DDB mairie obligatoire")
      }
      if (fiche.alcohol.ddb_nantes_universite.enabled && !fiche.alcohol.ddb_nantes_universite.date_demande) {
        errors.push("Alcool : date de demande DDB Nantes Université obligatoire")
      }
    }

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
  }
}