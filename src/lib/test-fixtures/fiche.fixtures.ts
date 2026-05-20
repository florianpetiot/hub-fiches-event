import type {
  EventFormTyped,
  ResponsiblePerson,
  AppSettings,
  SecurityKeyEntry,
} from '$lib/types/app.types'

// ─── Helpers de dates ────────────────────────────────────────────────────────

/** Retourne une date dans le futur (par défaut +30 jours) au format YYYY-MM-DD */
export function futureDateStr(daysFromNow = 30): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

// ─── Responsable valide ──────────────────────────────────────────────────────

export function createValidResponsible(overrides: Partial<ResponsiblePerson> = {}): ResponsiblePerson {
  return {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@example.com',
    departement: 'INFO',
    telephone: '0601020304',
    ...overrides,
  }
}

// ─── Fiche minimale valide ───────────────────────────────────────────────────

/**
 * Crée une fiche remplissant tous les champs obligatoires de base.
 * Les sections optionnelles (matériel, communication, SSI, etc.) sont désactivées.
 * Toutes les dates sont dans le futur pour ne pas déclencher la validation temporelle.
 */
export function createMinimalValidFiche(overrides: Partial<EventFormTyped> = {}): EventFormTyped {
  const startDate = futureDateStr(30)
  const endDate = futureDateStr(30)

  return {
    // Champs auto-générés par la BDD
    id: 'test-id-001',
    profile_id: 'test-profile-001',
    created_at: new Date().toISOString(),
    updated_at: null,
    submitted_at: null,
    signed_at: null,
    signed_by: null,
    deadline: null,
    version: 1,
    status: 'brouillon',
    site_plan_path: null,
    description: null,

    // Champs obligatoires
    title: 'Soirée de rentrée',
    event_date: startDate,
    event_end_date: endDate,
    event_start_time: '18:00',
    event_end_time: '23:00',
    location: 'Amphi A',
    category: 'soiree',
    estimated_attendees: 50,
    budget: 200,

    // Sections optionnelles — toutes désactivées
    has_external_people: false,
    needs_equipment: false,
    needs_communication: false,
    has_food: false,
    needs_bulle_ssi: false,
    needs_agent_secu: false,

    // Colonnes JSON — null par défaut
    equipment: null,
    communication: null,
    food: null,
    alcohol: null,
    security: null,
    agent_secu: null,

    // Responsables
    responsible_prevention: createValidResponsible({ nom: 'Martin', prenom: 'Alice' }),
    responsible_security: createValidResponsible({ nom: 'Durand', prenom: 'Bob' }),
    responsible_organisation: createValidResponsible({ nom: 'Petit', prenom: 'Claire' }),

    ...overrides,
  }
}

// ─── Settings par défaut pour les tests ──────────────────────────────────────

export function createTestSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    materiel_disponible: ['tables', 'chaises', 'sono', 'barnum'],
    canaux_communication: ['instagram', 'email', 'affichage'],
    cles_disponibles: {
      'Nord': [
        { id: 'cle-n1', key: 'Clé N1' },
        { id: 'cle-n2', key: 'Clé N2' },
      ],
      'Sud': [
        { id: 'cle-s1', key: 'Clé S1' },
      ],
    },
    ...overrides,
  }
}

// ─── Helpers pour activer des sections ───────────────────────────────────────

/** Fiche avec section équipement activée et matériel rempli */
export function createFicheWithEquipment(
  equipment: Record<string, number> = { tables: 2, chaises: 10 }
): EventFormTyped {
  return createMinimalValidFiche({
    needs_equipment: true,
    equipment,
  })
}

/** Fiche avec section communication activée et canaux sélectionnés */
export function createFicheWithCommunication(
  communication = { instagram: true, description: 'Pub pour la soirée' }
): EventFormTyped {
  return createMinimalValidFiche({
    needs_communication: true,
    communication,
  })
}

/** Fiche avec bulle SSI activée et toutes les directions couvertes */
export function createFicheWithSSI(
  settings: AppSettings = createTestSettings()
): EventFormTyped {
  const directions = Object.keys(settings.cles_disponibles ?? {})
  const cles: Record<string, SecurityKeyEntry[]> = {}
  for (const direction of directions) {
    cles[direction] = [{ key: `clé-${direction}`, selected: true }]
  }

  return createMinimalValidFiche({
    needs_bulle_ssi: true,
    security: {
      cles,
      salle_ssi: [
        { nom: 'Gardien', prenom: 'Paul', email: 'paul@test.com', telephone: '0611111111' },
      ],
    },
  })
}

/** Fiche avec alimentation activée (sans prestataire) */
export function createFicheWithFood(): EventFormTyped {
  return createMinimalValidFiche({
    has_food: true,
    food: {
      has_caterer: false,
      organisation: 'Gestion interne',
      menu: 'Pizzas et boissons',
    },
  })
}

/** Fiche avec alimentation + prestataire */
export function createFicheWithCaterer(): EventFormTyped {
  return createMinimalValidFiche({
    has_food: true,
    food: {
      has_caterer: true,
      caterer_name: 'Traiteur Express',
      caterer_siret: '12345678901234',
      organisation: 'Buffet en salle B',
      menu: 'Assortiment traiteur',
    },
  })
}

/** Fiche avec alcool activé */
export function createFicheWithAlcohol(): EventFormTyped {
  return createMinimalValidFiche({
    alcohol: {
      enabled: true,
      structure_licence: 'BDE Polytech',
      ddb_mairie: { date_demande: '2025-01-01', autorisation_path: '/docs/auth-mairie.pdf' },
      ddb_nantes_universite: { date_demande: '2025-01-01', autorisation_path: '/docs/auth-nu.pdf' },
    },
  })
}

/** Fiche avec agent de sécurité (avec organisme secouristes) */
export function createFicheWithAgentSecu(): EventFormTyped {
  return createMinimalValidFiche({
    needs_agent_secu: true,
    agent_secu: {
      entreprise_securite: {
        nom: 'SecuPro',
        siret: '98765432109876',
        devis_path: '/docs/devis-secu.pdf',
      },
      secouristes: {
        has_organisme: true,
        organisme_nom: 'CroixRouge',
        organisme_siret: '11111111111111',
        organisme_devis_path: '/docs/devis-secouristes.pdf',
      },
    },
  })
}
