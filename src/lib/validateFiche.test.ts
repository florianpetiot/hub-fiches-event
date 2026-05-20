import { describe, it, expect } from 'vitest'
import { validateFiche } from './validateFiche'
import {
  createMinimalValidFiche,
  createTestSettings,
  createFicheWithEquipment,
  createFicheWithCommunication,
  createFicheWithSSI,
  createFicheWithFood,
  createFicheWithCaterer,
  createFicheWithAlcohol,
  createFicheWithAgentSecu,
  createValidResponsible,
} from './test-fixtures/fiche.fixtures'

// ═══════════════════════════════════════════════════════════════════════════════
// CAS PASSANT — fiche complètement valide
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — fiche valide', () => {
  it('retourne un tableau vide pour une fiche minimale valide', () => {
    const errors = validateFiche(createMinimalValidFiche())
    expect(errors).toEqual([])
  })

  it('retourne un tableau vide pour une fiche avec toutes les sections activées', () => {
    const settings = createTestSettings()
    const fiche = createMinimalValidFiche({
      needs_equipment: true,
      equipment: { tables: 2, chaises: 10 },
      needs_communication: true,
      communication: { instagram: true, description: 'Pub pour la soirée' },
      needs_bulle_ssi: true,
      security: createFicheWithSSI(settings).security,
      has_food: true,
      food: createFicheWithFood().food,
      alcohol: createFicheWithAlcohol().alcohol,
      needs_agent_secu: true,
      agent_secu: createFicheWithAgentSecu().agent_secu,
    })
    const errors = validateFiche(fiche, settings)
    expect(errors).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CHAMPS OBLIGATOIRES GÉNÉRAUX
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — champs obligatoires', () => {
  it('détecte un titre manquant', () => {
    const fiche = createMinimalValidFiche({ title: '' })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Le titre est obligatoire')
  })

  it('détecte un titre composé uniquement d\'espaces', () => {
    const fiche = createMinimalValidFiche({ title: '   ' })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Le titre est obligatoire')
  })

  it('détecte une date de début manquante', () => {
    const fiche = createMinimalValidFiche({ event_date: '' })
    const errors = validateFiche(fiche)
    expect(errors).toContain('La date de début est obligatoire')
  })

  it('détecte une date de fin manquante', () => {
    const fiche = createMinimalValidFiche({ event_end_date: '' })
    const errors = validateFiche(fiche)
    expect(errors).toContain('La date de fin est obligatoire')
  })

  it('détecte une heure de début manquante', () => {
    const fiche = createMinimalValidFiche({ event_start_time: '' })
    const errors = validateFiche(fiche)
    expect(errors).toContain("L'heure de début est obligatoire")
  })

  it('détecte une heure de fin manquante', () => {
    const fiche = createMinimalValidFiche({ event_end_time: '' })
    const errors = validateFiche(fiche)
    expect(errors).toContain("L'heure de fin est obligatoire")
  })

  it('détecte un lieu manquant', () => {
    const fiche = createMinimalValidFiche({ location: '' })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Le lieu est obligatoire')
  })

  it('détecte une catégorie manquante', () => {
    const fiche = createMinimalValidFiche({ category: '' })
    const errors = validateFiche(fiche)
    expect(errors).toContain('La catégorie est obligatoire')
  })

  it('détecte un nombre de personnes manquant', () => {
    const fiche = createMinimalValidFiche({ estimated_attendees: 0 })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Le nombre de personnes est obligatoire')
  })

  it('détecte un nombre de personnes négatif', () => {
    const fiche = createMinimalValidFiche({ estimated_attendees: -5 })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Le nombre de personnes est obligatoire')
  })

  it('détecte un budget null', () => {
    const fiche = createMinimalValidFiche({ budget: null })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Le budget est obligatoire')
  })

  it('accepte un budget à 0', () => {
    const fiche = createMinimalValidFiche({ budget: 0 })
    const errors = validateFiche(fiche)
    expect(errors).not.toContain('Le budget est obligatoire')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION TEMPORELLE
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — validation temporelle', () => {
  it('détecte une date de début dans le passé', () => {
    const fiche = createMinimalValidFiche({
      event_date: '2020-01-01',
      event_start_time: '10:00',
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("La date et l'heure de début sont dépassées")
  })

  it('détecte une date/heure de fin avant la date/heure de début', () => {
    const fiche = createMinimalValidFiche({
      event_end_date: createMinimalValidFiche().event_date,
      event_start_time: '18:00',
      event_end_time: '17:00',
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("La date et l'heure de fin doivent être après la date et l'heure de début")
  })

  it('détecte une date/heure de fin égale à la date/heure de début', () => {
    const fiche = createMinimalValidFiche({
      event_end_date: createMinimalValidFiche().event_date,
      event_start_time: '18:00',
      event_end_time: '18:00',
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("La date et l'heure de fin doivent être après la date et l'heure de début")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION MATÉRIEL
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — matériel', () => {
  it('détecte un matériel activé mais vide', () => {
    const fiche = createMinimalValidFiche({
      needs_equipment: true,
      equipment: {},
    })
    const settings = createTestSettings()
    const errors = validateFiche(fiche, settings)
    expect(errors).toContain('Matériel : aucun élément spécifié')
  })

  it('détecte un matériel activé avec toutes les quantités à 0', () => {
    const fiche = createMinimalValidFiche({
      needs_equipment: true,
      equipment: { tables: 0, chaises: 0 },
    })
    const settings = createTestSettings()
    const errors = validateFiche(fiche, settings)
    expect(errors).toContain('Matériel : aucun élément spécifié')
  })

  it('accepte un matériel correctement rempli', () => {
    const fiche = createFicheWithEquipment()
    const settings = createTestSettings()
    const errors = validateFiche(fiche, settings)
    expect(errors).not.toContain('Matériel : aucun élément spécifié')
  })

  it('ne valide pas le matériel si la section est désactivée', () => {
    const fiche = createMinimalValidFiche({ needs_equipment: false, equipment: {} })
    const errors = validateFiche(fiche)
    expect(errors).not.toContain('Matériel : aucun élément spécifié')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION COMMUNICATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — communication', () => {
  it('détecte aucun canal sélectionné', () => {
    const fiche = createMinimalValidFiche({
      needs_communication: true,
      communication: { description: 'Un texte' },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Communication : aucun canal sélectionné')
  })

  it('détecte une description manquante', () => {
    const fiche = createMinimalValidFiche({
      needs_communication: true,
      communication: { instagram: true },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Communication : description du contenu obligatoire')
  })

  it('détecte les deux erreurs en même temps', () => {
    const fiche = createMinimalValidFiche({
      needs_communication: true,
      communication: {},
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Communication : aucun canal sélectionné')
    expect(errors).toContain('Communication : description du contenu obligatoire')
  })

  it('accepte une communication correctement remplie', () => {
    const fiche = createFicheWithCommunication()
    const errors = validateFiche(fiche)
    expect(errors).not.toContain('Communication : aucun canal sélectionné')
    expect(errors).not.toContain('Communication : description du contenu obligatoire')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION BULLE SSI
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — bulle SSI', () => {
  const settings = createTestSettings()

  it('détecte des directions manquantes', () => {
    const fiche = createMinimalValidFiche({
      needs_bulle_ssi: true,
      security: {
        cles: {
          // On ne couvre que "Nord", "Sud" est manquant
          'Nord': [{ key: 'Clé N1', selected: true }],
        },
        salle_ssi: [
          { nom: 'Test', prenom: 'User', email: 'test@test.com', telephone: '0600000000' },
        ],
      },
    })
    const errors = validateFiche(fiche, settings)
    expect(errors.some(e => e.includes('directions manquantes'))).toBe(true)
    expect(errors.some(e => e.includes('Sud'))).toBe(true)
  })

  it('détecte des clés non sélectionnées', () => {
    const fiche = createMinimalValidFiche({
      needs_bulle_ssi: true,
      security: {
        cles: {
          'Nord': [{ key: 'Clé N1', selected: false }],
          'Sud': [{ key: 'Clé S1', selected: true }],
        },
        salle_ssi: [
          { nom: 'Test', prenom: 'User', email: 'test@test.com', telephone: '0600000000' },
        ],
      },
    })
    const errors = validateFiche(fiche, settings)
    expect(errors.some(e => e.includes('directions manquantes') && e.includes('Nord'))).toBe(true)
  })

  it('détecte une salle SSI vide', () => {
    const fiche = createMinimalValidFiche({
      needs_bulle_ssi: true,
      security: {
        cles: {
          'Nord': [{ key: 'Clé N1', selected: true }],
          'Sud': [{ key: 'Clé S1', selected: true }],
        },
        salle_ssi: [],
      },
    })
    const errors = validateFiche(fiche, settings)
    expect(errors).toContain('Au moins une personne dans la salle SSI est requise')
  })

  it('détecte des champs manquants sur une personne SSI', () => {
    const fiche = createMinimalValidFiche({
      needs_bulle_ssi: true,
      security: {
        cles: {
          'Nord': [{ key: 'Clé N1', selected: true }],
          'Sud': [{ key: 'Clé S1', selected: true }],
        },
        salle_ssi: [
          { nom: '', prenom: '', email: 'invalide', telephone: '' },
        ],
      },
    })
    const errors = validateFiche(fiche, settings)
    expect(errors).toContain('Salle SSI - Personne 1 : nom obligatoire')
    expect(errors).toContain('Salle SSI - Personne 1 : prénom obligatoire')
    expect(errors).toContain('Salle SSI - Personne 1 : email invalide')
    expect(errors).toContain('Salle SSI - Personne 1 : téléphone obligatoire')
  })

  it('accepte une bulle SSI correctement remplie', () => {
    const fiche = createFicheWithSSI(settings)
    const errors = validateFiche(fiche, settings)
    // Aucune erreur liée à SSI
    const ssiErrors = errors.filter(e =>
      e.includes('direction') || e.includes('SSI') || e.includes('Accès')
    )
    expect(ssiErrors).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ALIMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — alimentation', () => {
  it('détecte une organisation manquante', () => {
    const fiche = createMinimalValidFiche({
      has_food: true,
      food: { organisation: '', menu: 'Pizzas' },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Alimentation : organisation obligatoire')
  })

  it('détecte un menu manquant', () => {
    const fiche = createMinimalValidFiche({
      has_food: true,
      food: { organisation: 'Interne', menu: '' },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Alimentation : menu obligatoire')
  })

  it('détecte un nom de prestataire manquant', () => {
    const fiche = createMinimalValidFiche({
      has_food: true,
      food: {
        has_caterer: true,
        caterer_name: '',
        caterer_siret: '12345678901234',
        organisation: 'Buffet',
        menu: 'Assortiment',
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Prestataire : nom obligatoire')
  })

  it('détecte un SIRET prestataire invalide (trop court)', () => {
    const fiche = createMinimalValidFiche({
      has_food: true,
      food: {
        has_caterer: true,
        caterer_name: 'Traiteur',
        caterer_siret: '123',
        organisation: 'Buffet',
        menu: 'Assortiment',
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Prestataire : SIRET invalide')
  })

  it('accepte une alimentation sans prestataire', () => {
    const fiche = createFicheWithFood()
    const errors = validateFiche(fiche)
    const foodErrors = errors.filter(e => e.includes('Alimentation') || e.includes('Prestataire'))
    expect(foodErrors).toEqual([])
  })

  it('accepte une alimentation avec prestataire complet', () => {
    const fiche = createFicheWithCaterer()
    const errors = validateFiche(fiche)
    const foodErrors = errors.filter(e => e.includes('Alimentation') || e.includes('Prestataire'))
    expect(foodErrors).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSABLES
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — responsables', () => {
  const responsableKeys = [
    ['responsible_prevention', 'Prévention'],
    ['responsible_security', 'Sécurité'],
    ['responsible_organisation', 'Organisation'],
  ] as const

  for (const [key, label] of responsableKeys) {
    describe(`Responsable ${label}`, () => {
      it('détecte un nom manquant', () => {
        const fiche = createMinimalValidFiche({
          [key]: createValidResponsible({ nom: '' }),
        })
        const errors = validateFiche(fiche)
        expect(errors).toContain(`Responsable ${label} : nom obligatoire`)
      })

      it('détecte un prénom manquant', () => {
        const fiche = createMinimalValidFiche({
          [key]: createValidResponsible({ prenom: '' }),
        })
        const errors = validateFiche(fiche)
        expect(errors).toContain(`Responsable ${label} : prénom obligatoire`)
      })

      it('détecte un email invalide', () => {
        const fiche = createMinimalValidFiche({
          [key]: createValidResponsible({ email: 'invalide' }),
        })
        const errors = validateFiche(fiche)
        expect(errors).toContain(`Responsable ${label} : email invalide`)
      })

      it('détecte un email vide', () => {
        const fiche = createMinimalValidFiche({
          [key]: createValidResponsible({ email: '' }),
        })
        const errors = validateFiche(fiche)
        expect(errors).toContain(`Responsable ${label} : email invalide`)
      })

      it('détecte un téléphone manquant', () => {
        const fiche = createMinimalValidFiche({
          [key]: createValidResponsible({ telephone: '' }),
        })
        const errors = validateFiche(fiche)
        expect(errors).toContain(`Responsable ${label} : téléphone obligatoire`)
      })

      it('détecte un département manquant', () => {
        const fiche = createMinimalValidFiche({
          [key]: createValidResponsible({ departement: '' }),
        })
        const errors = validateFiche(fiche)
        expect(errors).toContain(`Responsable ${label} : département obligatoire`)
      })
    })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ALCOOL
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — alcool', () => {
  it('ne valide pas si alcool non activé', () => {
    const fiche = createMinimalValidFiche({
      alcohol: { enabled: false },
    })
    const errors = validateFiche(fiche)
    const alcErrors = errors.filter(e => e.includes('Alcool'))
    expect(alcErrors).toEqual([])
  })

  it('détecte la structure licence manquante', () => {
    const fiche = createMinimalValidFiche({
      alcohol: {
        enabled: true,
        structure_licence: '',
        ddb_mairie: { date_demande: '2025-01-01', autorisation_path: '/doc.pdf' },
        ddb_nantes_universite: { date_demande: '2025-01-01', autorisation_path: '/doc.pdf' },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Alcool : structure détentrice de la licence obligatoire')
  })

  it('détecte la date DDB mairie manquante', () => {
    const fiche = createMinimalValidFiche({
      alcohol: {
        enabled: true,
        structure_licence: 'BDE',
        ddb_mairie: {},
        ddb_nantes_universite: { date_demande: '2025-01-01', autorisation_path: '/doc.pdf' },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Alcool : date de demande DDB mairie obligatoire')
  })

  it('détecte la date DDB Nantes Université manquante', () => {
    const fiche = createMinimalValidFiche({
      alcohol: {
        enabled: true,
        structure_licence: 'BDE',
        ddb_mairie: { date_demande: '2025-01-01', autorisation_path: '/doc.pdf' },
        ddb_nantes_universite: {},
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain('Alcool : date de demande DDB Nantes Université obligatoire')
  })

  it('détecte l\'autorisation mairie PDF manquante', () => {
    const fiche = createMinimalValidFiche({
      alcohol: {
        enabled: true,
        structure_licence: 'BDE',
        ddb_mairie: { date_demande: '2025-01-01' },
        ddb_nantes_universite: { date_demande: '2025-01-01', autorisation_path: '/doc.pdf' },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("Alcool : l'autorisation mairie (PDF) est obligatoire")
  })

  it('détecte l\'autorisation Nantes Université PDF manquante', () => {
    const fiche = createMinimalValidFiche({
      alcohol: {
        enabled: true,
        structure_licence: 'BDE',
        ddb_mairie: { date_demande: '2025-01-01', autorisation_path: '/doc.pdf' },
        ddb_nantes_universite: { date_demande: '2025-01-01' },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("Alcool : l'autorisation Nantes Université (PDF) est obligatoire")
  })

  it('accepte un alcool complet', () => {
    const fiche = createFicheWithAlcohol()
    const errors = validateFiche(fiche)
    const alcErrors = errors.filter(e => e.includes('Alcool'))
    expect(alcErrors).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION AGENT DE SÉCURITÉ
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — agent de sécurité', () => {
  it('ne valide pas si la section est désactivée', () => {
    const fiche = createMinimalValidFiche({ needs_agent_secu: false })
    const errors = validateFiche(fiche)
    const secuErrors = errors.filter(e =>
      e.includes('entreprise de sécurité') || e.includes('secouristes')
    )
    expect(secuErrors).toEqual([])
  })

  it('détecte le nom de l\'entreprise manquant', () => {
    const fiche = createMinimalValidFiche({
      needs_agent_secu: true,
      agent_secu: {
        entreprise_securite: { nom: '', siret: '98765432109876', devis_path: '/devis.pdf' },
        secouristes: { has_organisme: false, dispositions: 'Bénévoles internes' },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("Le nom de l'entreprise de sécurité est obligatoire")
  })

  it('détecte un SIRET entreprise invalide', () => {
    const fiche = createMinimalValidFiche({
      needs_agent_secu: true,
      agent_secu: {
        entreprise_securite: { nom: 'SecuPro', siret: '123', devis_path: '/devis.pdf' },
        secouristes: { has_organisme: false, dispositions: 'Bénévoles internes' },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("Le SIRET de l'entreprise de sécurité est invalide")
  })

  it('détecte un devis entreprise manquant', () => {
    const fiche = createMinimalValidFiche({
      needs_agent_secu: true,
      agent_secu: {
        entreprise_securite: { nom: 'SecuPro', siret: '98765432109876' },
        secouristes: { has_organisme: false, dispositions: 'Bénévoles internes' },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("Le devis de l'entreprise de sécurité (PDF) est obligatoire")
  })

  it('détecte les dispositions manquantes (sans organisme)', () => {
    const fiche = createMinimalValidFiche({
      needs_agent_secu: true,
      agent_secu: {
        entreprise_securite: { nom: 'SecuPro', siret: '98765432109876', devis_path: '/devis.pdf' },
        secouristes: { has_organisme: false, dispositions: '' },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("Les dispositions de secours sont obligatoires si pas d'organisme")
  })

  it('détecte le nom de l\'organisme secouriste manquant', () => {
    const fiche = createMinimalValidFiche({
      needs_agent_secu: true,
      agent_secu: {
        entreprise_securite: { nom: 'SecuPro', siret: '98765432109876', devis_path: '/devis.pdf' },
        secouristes: {
          has_organisme: true,
          organisme_nom: '',
          organisme_siret: '11111111111111',
          organisme_devis_path: '/devis.pdf',
        },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("Le nom de l'organisme de secouristes est obligatoire")
  })

  it('détecte un SIRET organisme invalide', () => {
    const fiche = createMinimalValidFiche({
      needs_agent_secu: true,
      agent_secu: {
        entreprise_securite: { nom: 'SecuPro', siret: '98765432109876', devis_path: '/devis.pdf' },
        secouristes: {
          has_organisme: true,
          organisme_nom: 'CroixRouge',
          organisme_siret: '999',
          organisme_devis_path: '/devis.pdf',
        },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("Le SIRET de l'organisme de secouristes est invalide")
  })

  it('détecte un devis organisme manquant', () => {
    const fiche = createMinimalValidFiche({
      needs_agent_secu: true,
      agent_secu: {
        entreprise_securite: { nom: 'SecuPro', siret: '98765432109876', devis_path: '/devis.pdf' },
        secouristes: {
          has_organisme: true,
          organisme_nom: 'CroixRouge',
          organisme_siret: '11111111111111',
        },
      },
    })
    const errors = validateFiche(fiche)
    expect(errors).toContain("Le devis de l'organisme de secouristes (PDF) est obligatoire")
  })

  it('accepte un agent de sécurité complet', () => {
    const fiche = createFicheWithAgentSecu()
    const errors = validateFiche(fiche)
    const secuErrors = errors.filter(e =>
      e.includes('entreprise de sécurité') || e.includes('secouristes') || e.includes('SIRET')
    )
    expect(secuErrors).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CUMUL D'ERREURS
// ═══════════════════════════════════════════════════════════════════════════════

describe('validateFiche — cumul d\'erreurs', () => {
  it('accumule les erreurs de plusieurs sections', () => {
    const fiche = createMinimalValidFiche({
      title: '',
      location: '',
      budget: null,
    })
    const errors = validateFiche(fiche)
    expect(errors.length).toBeGreaterThanOrEqual(3)
    expect(errors).toContain('Le titre est obligatoire')
    expect(errors).toContain('Le lieu est obligatoire')
    expect(errors).toContain('Le budget est obligatoire')
  })
})
