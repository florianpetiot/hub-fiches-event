import type { Tables, Enums } from './database.types'

// ─── Types des colonnes JSON de event_forms ─────────────────────────────────

export type ResponsiblePerson = {
  nom?: string
  prenom?: string
  email?: string
  departement?: string
  telephone?: string
}

export type EquipmentJson = Record<string, number>

export type CommunicationJson = Record<string, boolean | string> & {
  description?: string
}

export type FoodJson = {
  has_caterer?: boolean
  caterer_name?: string
  caterer_siret?: string
  organisation?: string
  menu?: string
}

export type SecurityKeyEntry = {
  key: string
  selected: boolean
}

export type SalleSSIPerson = {
  nom: string
  prenom: string
  email: string
  telephone: string
}

export type SecurityJson = {
  cles?: Record<string, SecurityKeyEntry[]>
  salle_ssi?: SalleSSIPerson[]
}

export type AlcoholDDB = {
  date_demande?: string
  autorisation_path?: string
}

export type AlcoholPreventionDevice = {
  titre: string
  description?: string
  selected: boolean
}

export type AlcoholJson = {
  enabled?: boolean
  structure_licence?: string
  ddb_mairie?: AlcoholDDB
  ddb_nantes_universite?: AlcoholDDB
  prevention?: AlcoholPreventionDevice[]
}

export type AgentSecuJson = {
  entreprise_securite?: {
    nom?: string
    siret?: string
    devis_path?: string
  }
  secouristes?: {
    has_organisme?: boolean
    organisme_nom?: string
    organisme_siret?: string
    organisme_devis_path?: string
    dispositions?: string
  }
}

// ─── event_forms avec colonnes JSON correctement typées ─────────────────────

/** event_forms avec les colonnes JSON remplacées par des types stricts */
export type EventFormTyped = Omit<
  Tables<'event_forms'>,
  | 'equipment' | 'communication' | 'food'
  | 'responsible_prevention' | 'responsible_security' | 'responsible_organisation'
  | 'alcohol' | 'security' | 'agent_secu'
> & {
  equipment: EquipmentJson | null
  communication: CommunicationJson | null
  food: FoodJson | null
  responsible_prevention: ResponsiblePerson | null
  responsible_security: ResponsiblePerson | null
  responsible_organisation: ResponsiblePerson | null
  alcohol: AlcoholJson | null
  security: SecurityJson | null
  agent_secu: AgentSecuJson | null
}

// ─── Types composés (jointures) ─────────────────────────────────────────────

// Signature avec les relations workflow + roles
export type SignatureWithWorkflow = Tables<'signatures'> & {
  workflow_etapes: (Tables<'workflow_etapes'> & {
    roles: Tables<'roles'> | null
  }) | null
  ordre_relatif?: number
}

// Message avec profil et rôle
export type MessageWithProfile = Tables<'messages'> & {
  profiles: (Tables<'profiles'> & {
    roles: Tables<'roles'>
  }) | null
}

// Workflow étape avec rôle
export type WorkflowEtapeWithRole = Tables<'workflow_etapes'> & {
  roles: Tables<'roles'> | null
}

// ─── Types pour les pages ───────────────────────────────────────────────────

// Carte événement sur le dashboard (shape exact retourné par le serveur)
export type DashboardForm = {
  id: string
  title: string | null
  status: Enums<'event_status'>
  event_date: string | null
  created_at: string | null
  monTour: boolean
}

// Carte événement simple
export type EventCardForm = Pick<Tables<'event_forms'>, 'id' | 'title' | 'event_date' | 'status'>

// Fiche complète avec profil
export type FicheWithProfile = EventFormTyped & {
  profiles: { name: string } | null
}

// ─── Types pour les composants Settings (page parametres) ───────────────────

// Profil avec rôle (utilisé dans les listes admins/clubs)
export type ProfileWithRole = Tables<'profiles'> & {
  roles: Pick<Tables<'roles'>, 'name' | 'label'> | null
}

// Profil club (sous-ensemble utilisé par ClubsSettings)
export type ClubProfile = Pick<Tables<'profiles'>, 'id' | 'name' | 'email' | 'created_at' | 'role_id'> & {
  roles: Pick<Tables<'roles'>, 'name'> | null
}

// Data commune passée aux composants settings (retour de load)
export type AppSettings = {
  regles_cas2?: {
    conditions: Record<string, boolean>
    seuil_effectif: number
    heure_fermeture: string
    delai_cas1_semaines: number
    delai_cas2_semaines: number
  }
  regles_agent_secu?: {
    conditions: Record<string, boolean>
    seuil_effectif: number
  }
  cles_disponibles?: Record<string, { id: string; key: string }[]>
  dispositifs_prevention?: { titre: string; description: string }[]
  canaux_communication?: string[]
  materiel_disponible?: string[]
  categories_evenement?: string[]
  documents_aide?: {
    fiche_hygiene_path: string
    fiche_materiel_path: string
    fiche_communication_path: string
    fiche_alcool_path: string
    fiche_securite_path: string
    plan_acces_path: string
    plan_implantation_vierge_path: string
    autres: string[]
  }
  [key: string]: unknown
}

export type SettingsData = {
  settings: AppSettings
  clubs: ClubProfile[]
  roles: Tables<'roles'>[]
  admins: ProfileWithRole[]
  workflow: WorkflowEtapeWithRole[]
}

// ActionData type pour les réponses d'actions du serveur parametres
export type SettingsActionData = {
  // Actions EventSettings
  settings?: { success?: boolean; error?: string }
  allSettings?: { success?: boolean; error?: string }
  // Actions ClubsSettings
  creerClub?: { success?: boolean; error?: string }
  supprimerClub?: { success?: boolean; error?: string }
  // Actions AdminsSettings
  creerAdmin?: { success?: boolean; error?: string }
  supprimerAdmin?: { success?: boolean; error?: string }
  changerRoleAdmin?: { success?: boolean; error?: string }
  creerRole?: { success?: boolean; error?: string }
  supprimerRole?: { success?: boolean; error?: string }
  workflow?: { success?: boolean; error?: string }
  // Actions profil
  changerNom?: { success?: boolean; error?: string }
  changerMotDePasse?: { success?: boolean; error?: string }
} | null
