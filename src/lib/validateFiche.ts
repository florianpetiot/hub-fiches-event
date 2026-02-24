/**
 * Valide les champs d'une fiche event avant soumission.
 * @returns Un tableau de messages d'erreur (vide si valide).
 */
export function validateFiche(fiche: Record<string, any>, clesDisponibles: Record<string, any> = {}): string[] {
  const errors: string[] = []

  // Champs obligatoires généraux
  if (!fiche.title?.trim()) errors.push("Le titre est obligatoire")
  if (!fiche.event_date) errors.push("La date de début est obligatoire")
  if (!fiche.event_end_date) errors.push("La date de fin est obligatoire")
  if (!fiche.event_start_time) errors.push("L'heure de début est obligatoire")
  if (!fiche.event_end_time) errors.push("L'heure de fin est obligatoire")

  if (
    fiche.event_date && fiche.event_start_time &&
    fiche.event_end_date && fiche.event_end_time &&
    new Date(`${fiche.event_date}T${fiche.event_start_time}`) >=
    new Date(`${fiche.event_end_date}T${fiche.event_end_time}`)
  ) {
    errors.push("La date et l'heure de fin doivent être après la date et l'heure de début")
  }

  if (!fiche.location?.trim()) errors.push("Le lieu est obligatoire")
  if (!fiche.category) errors.push("La catégorie est obligatoire")
  if (!fiche.estimated_attendees || fiche.estimated_attendees <= 0) errors.push("Le nombre de personnes est obligatoire")
  if (fiche.budget === null || fiche.budget === undefined) errors.push("Le budget est obligatoire")

  // Matériel
  if (fiche.needs_equipment) {
    const eq = fiche.equipment ?? {}
    const total = (eq.tables ?? 0) + (eq.chaises ?? 0) + (eq.panneaux ?? 0) + (eq.rallonges ?? 0) + (eq.multiprises ?? 0)
    if (total === 0 && !eq.autre?.trim()) errors.push("Matériel : aucun élément spécifié")
  }

  // Communication
  if (fiche.needs_communication) {
    const com = fiche.communication ?? {}
    if (!com.mur_ecrans && !com.intranet && !com.reseaux_sociaux && !com.newsletter) {
      errors.push("Communication : aucun canal sélectionné")
    }
    if (!com.description?.trim()) errors.push("Communication : description du contenu obligatoire")
  }

  // Bulle SSI
  if (fiche.needs_bulle_ssi) {
    const directions = Object.keys(clesDisponibles ?? {})

    const directionsCouvertes = directions.filter(direction =>
      (clesDisponibles[direction] ?? []).some((k: any) => fiche.security?.cles[k.id]?.selected)
    )
    if(directionsCouvertes.length < directions.length) {
      const manquantes = directions.filter(d => !directionsCouvertes.includes(d))
      errors.push(`Accès : accès insuffisant, directions manquantes : ${manquantes.join(', ')}`)
    }
    if (!fiche.security?.salle_ssi?.length) {
      errors.push('Au moins une personne dans la salle SSI est requise')
    }
    // chaque personne de salle SSI doit avoir nom, prénom et email valides
    fiche.security?.salle_ssi?.forEach((personne: any, index: number) => {
      if (!personne.nom?.trim()) errors.push(`Salle SSI - Peronne ${index + 1} : nom obligatoire`)
      if (!personne.prenom?.trim()) errors.push(`Salle SSI - Personne ${index + 1} : prénom obligatoire`)
      if (!personne.email?.trim()) errors.push(`Salle SSI - Personne ${index + 1} : email invalide`)
    })
  }

  // Alimentation
  if (fiche.has_food) {
    const food = fiche.food ?? {}
    if (food.has_caterer) {
      if (!food.caterer_name?.trim()) errors.push("Prestataire : nom obligatoire")
      if (food.caterer_siret?.length !== 14) errors.push("Prestataire : SIRET invalide")
    } else {
      if (!food.organisation?.trim()) errors.push("Alimentation : organisation obligatoire")
    }
    if (!food.menu?.trim()) errors.push("Alimentation : menu obligatoire")
  }

  // Responsables
  for (const [key, label] of [
    ['responsible_prevention', 'Prévention'],
    ['responsible_security', 'Sécurité'],
    ['responsible_organisation', 'Organisation'],
  ] as const) {
    const r = fiche[key]
    if (!r?.nom?.trim()) errors.push(`Responsable ${label} : nom obligatoire`)
    if (!r?.prenom?.trim()) errors.push(`Responsable ${label} : prénom obligatoire`)
    if (!r?.email?.trim() || !r.email.includes('@')) errors.push(`Responsable ${label} : email invalide`)
    if (!r?.departement?.trim()) errors.push(`Responsable ${label} : département obligatoire`)
  }

  // Alcool
  if (fiche.alcohol?.enabled) {
    if (!fiche.alcohol.structure_licence?.trim()) errors.push("Alcool : structure détentrice de la licence obligatoire")
    if (!fiche.alcohol.ddb_mairie?.enabled && !fiche.alcohol.ddb_nantes_universite?.enabled) {
      errors.push("Alcool : au moins une demande de débit de boisson requise")
    }
    if (fiche.alcohol.ddb_mairie?.enabled && !fiche.alcohol.ddb_mairie.date_demande) {
      errors.push("Alcool : date de demande DDB mairie obligatoire")
    }
    if (fiche.alcohol.ddb_nantes_universite?.enabled && !fiche.alcohol.ddb_nantes_universite.date_demande) {
      errors.push("Alcool : date de demande DDB Nantes Université obligatoire")
    }
    if (fiche.alcohol.ddb_mairie.enabled && !fiche.alcohol.ddb_mairie.autorisation_path) {
      errors.push("Alcool : l'autorisation mairie (PDF) est obligatoire" )
    }
    if (fiche.alcohol.ddb_nantes_universite.enabled && !fiche.alcohol.ddb_nantes_universite.autorisation_path) {
      errors.push("Alcool : l'autorisation Nantes Université (PDF) est obligatoire" )
    }

  }

  // agent de sécurité
  if (fiche.needs_agent_secu) {
    if (!fiche.agent_secu.entreprise_securite.nom?.trim()) 
      errors.push("Le nom de l'entreprise de sécurité est obligatoire")
    if (fiche.agent_secu.entreprise_securite.siret?.length !== 14) 
      errors.push("Le SIRET de l'entreprise de sécurité est invalide")
    if (!fiche.agent_secu.entreprise_securite.contrat_path)
        errors.push("Le devis de l'entreprise de sécurité (PDF) est obligatoire")
    if (fiche.agent_secu.secouristes.has_organisme) {
      if (!fiche.agent_secu.secouristes.organisme_nom?.trim()) 
        errors.push("Le nom de l'organisme de secouristes est obligatoire")
      if (fiche.agent_secu.secouristes.organisme_siret?.length !== 14) 
        errors.push("Le SIRET de l'organisme de secouristes est invalide")
      if (!fiche.agent_secu.secouristes.organisme_devis_path)
        errors.push("Le devis de l'organisme de secouristes (PDF) est obligatoire")
    } else {
      if (!fiche.agent_secu.secouristes.dispositions?.trim()) 
        errors.push("Les dispositions de secours sont obligatoires si pas d'organisme")
    }
  }

  return errors
}
