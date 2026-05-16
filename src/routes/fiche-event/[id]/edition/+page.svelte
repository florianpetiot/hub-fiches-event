<script lang="ts">
  import { untrack, tick } from 'svelte'
  import { fade } from 'svelte/transition'
  import type { PageData } from './$types'
  import { eventDetails } from '$lib/eventStore'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'
  import Switch from '$lib/components/Switch.svelte'
  import { enhance } from '$app/forms'
  import MessageModal from '$lib/components/MessageModal.svelte';
  import FileUpload from '$lib/components/FileUpload.svelte';
  import PdfViewer from '$lib/components/PdfViewer.svelte';
  import { formatDateSmart } from '$lib/date.js';

  let { data }: { data: PageData } = $props()
  const supabase = $derived(data.supabase)

    const defaultReglesCas2 = {
        conditions: {
            hors_horaires: true,
            offre_alimentaire: true,
            debit_boissons: true,
            public_exterieur: true,
            effectif_superieur: true
        },
        seuil_effectif: 50,
        heure_fermeture: '20:00',
        delai_cas1_semaines: 2,
        delai_cas2_semaines: 8
    }

    const defaultReglesAgentSecu = {
        conditions: {
            effectif_superieur: true,
            presence_alcool: true,
            public_exterieur: true,
            hors_horaires: false
        },
        seuil_effectif: 100
    }

    type EditionResolvedData = {
        fiche: any
        settings: Record<string, any>
    }

    function isPromise<T>(value: unknown): value is Promise<T> {
        return !!value && typeof (value as { then?: unknown }).then === 'function'
    }

    const initialEditionData: unknown = untrack(() => data.editionData)
    const initialEditionPending = isPromise<EditionResolvedData>(initialEditionData)
    let editionLoading = $state(initialEditionPending)
    let editionError = $state('')
    let editionData = $state<EditionResolvedData>(
        !initialEditionPending && initialEditionData
            ? (initialEditionData as EditionResolvedData)
            : { fiche: {}, settings: {} }
    )

    function createFormState(resolved: EditionResolvedData) {
        const fiche = resolved?.fiche ?? {}
        const settings = resolved?.settings ?? {}

        return {
            ...fiche,
            equipment: (() => {
                const available = settings?.materiel_disponible ?? [];
                const existing = fiche.equipment || {};
                const result: Record<string, number> = {};
                for (const m of available) {
                    result[m] = existing[m] ?? 0;
                }
                return result;
            })(),
            communication: (() => {
                const available = settings?.canaux_communication ?? [];
                const existing = fiche.communication || {};
                const result: Record<string, boolean> = {};
                for (const c of available) {
                    result[c] = existing[c] ?? false;
                }
                return { ...result, description: existing.description ?? '' };
            })(),
            food: fiche.food ?? {
                has_caterer: false, caterer_name: '', caterer_siret: '', organisation: '', menu: ''
            },
            responsible_prevention: fiche.responsible_prevention ?? {
                nom: '', prenom: '', email: '', departement: '', telephone: ''
            },
            responsible_security: fiche.responsible_security ?? {
                nom: '', prenom: '', email: '', departement: '', telephone: ''
            },
            responsible_organisation: fiche.responsible_organisation ?? {
                nom: '', prenom: '', email: '', departement: '', telephone: ''
            },
            alcohol: (() => {
                const existingAlcohol = fiche.alcohol ?? {}
                const preventionAvailable = settings?.dispositifs_prevention ?? []
                const preventionExisting = existingAlcohol.prevention ?? []
                const prevention = preventionAvailable.map((p: any, idx: number) => {
                    const ex = preventionExisting[idx] ?? {}
                    return {
                        titre: p.titre,
                        description: p.description,
                        selected: ex.selected ?? false
                    }
                })
                return {
                    enabled: existingAlcohol.enabled ?? false,
                    ddb_mairie: existingAlcohol.ddb_mairie ?? { date_demande: '', autorisation_path: '' },
                    ddb_nantes_universite: existingAlcohol.ddb_nantes_universite ?? { date_demande: '', autorisation_path: '' },
                    structure_licence: existingAlcohol.structure_licence ?? '',
                    prevention
                }
            })(),
            security: (() => {
                const clesDisponibles = settings?.cles_disponibles ?? {};
                const existingCles = fiche.security?.cles ?? {};
                const cles: Record<string, { key: string; selected: boolean }[]> = {};
                for (const direction in clesDisponibles) {
                    const existingArr: { key: string; selected: boolean }[] = (() => {
                        const raw = existingCles[direction];
                        if (!raw) return [];
                        if (Array.isArray(raw)) return raw as { key: string; selected: boolean }[];
                        return Object.values(raw as Record<string, { key: string; selected: boolean }>);
                    })();
                    cles[direction] = clesDisponibles[direction].map((cle: { id: string; key: string }) => {
                        const existingCle = existingArr.find((e) => e.key === cle.key);
                        return { key: cle.key, selected: existingCle?.selected ?? false };
                    });
                }
                return {
                    cles,
                    salle_ssi: fiche.security?.salle_ssi ?? []
                };
            })(),
            agent_secu: fiche.agent_secu ?? {
                entreprise_securite: { nom: '', siret: '', devis_path: '' },
                secouristes: { has_organisme: false, organisme_nom: '', organisme_siret: '', organisme_devis_path: '', dispositions: '' }
            },
        }
    }

  // État local du formulaire, initialisé avec les données de la fiche
  let form = $state(createFormState({ fiche: {}, settings: {} }))

  $effect(() => {
      const source: unknown = data.editionData

      if (isPromise<EditionResolvedData>(source)) {
          editionLoading = true
          editionError = ''

          source
              .then((resolved) => {
                  editionData = resolved ?? { fiche: {}, settings: {} }
                  form = createFormState(editionData)
              })
              .catch((err) => {
                  console.error('Erreur lors du chargement de la fiche édition:', err)
                  editionError = 'Impossible de charger la fiche édition.'
                  editionData = { fiche: {}, settings: {} }
                  form = createFormState(editionData)
              })
              .finally(() => {
                  editionLoading = false
              })

          return
      }

      editionData = (source as EditionResolvedData) ?? { fiche: {}, settings: {} }
      editionError = ''
      editionLoading = false
      form = createFormState(editionData)
  })

  // Indicateur de sauvegarde
  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle')
  let deadlineExpired = $state(false)
  let needsEarlyDeadline = $state(false) // true si la deadline doit être 2 mois avant au lieu de 2 semaines
  let saveTimeout: ReturnType<typeof setTimeout>


  async function doSave() {
    const { error } = await supabase
      .from('event_forms')
      .update({
        title: form.title,
        event_date: form.event_date,
        event_end_date: form.event_end_date,
        event_start_time: form.event_start_time,
        event_end_time: form.event_end_time,
        location: form.location,
        category: form.category,
        description: form.description,
        site_plan_path: form.site_plan_path,
        budget: form.budget,
        estimated_attendees: form.estimated_attendees,
        has_external_people: form.has_external_people,
        needs_equipment: form.needs_equipment,
        equipment: form.equipment,
        needs_communication: form.needs_communication,
        communication: form.communication,
        has_food: form.has_food,
        food: form.food,
        security_notes: form.security_notes,
        responsible_prevention: form.responsible_prevention,
        responsible_security: form.responsible_security,
        responsible_organisation: form.responsible_organisation,
        pcs1_students: form.pcs1_students,
        needs_bulle_ssi: form.needs_bulle_ssi,
        security: form.security,
        needs_agent_secu: form.needs_agent_secu,
        agent_secu: form.agent_secu,
        alcohol: form.alcohol,
        deadline: form.deadline,
        updated_at: new Date().toISOString()
      })
      .eq('id', form.id)

    saveStatus = error ? 'error' : 'saved'
    setTimeout(() => saveStatus = 'idle', 5000)
  }

  async function autoSave() {
    clearTimeout(saveTimeout)
    saveStatus = 'saving'
    saveTimeout = setTimeout(() => doSave(), 5000)
  }

  // Update the store whenever the title or event date changes
  $effect(() => {
    eventDetails.set({
      title: form.title,
      eventDate: form.event_date
    });
  })

  $effect(() => {
        const regles = editionData.settings?.regles_cas2 ?? defaultReglesCas2
        const reglesSecu = editionData.settings?.regles_agent_secu ?? defaultReglesAgentSecu

    const heureLimite = parseInt(regles.heure_fermeture.split(':')[0])

    // needs_bulle_ssi :
    if (form.event_date) {
        const startDateStr = form.event_date
        const endDateStr = form.event_end_date ?? form.event_date

        // Helper pour construire un Date local depuis YYYY-MM-DD et HH:mm
        const makeDateTime = (dateStr: string, timeStr?: string, isEnd = false) => {
            const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10))
            let hh = 0
            let mm = 0
            if (timeStr) {
                [hh, mm] = timeStr.split(':').map((v) => parseInt(v, 10))
            } else if (isEnd) {
                hh = 23
                mm = 59
            }
            return new Date(y, m - 1, d, hh, mm, 0)
        }

        // Vérifie si l'intervalle [startDateStr, endDateStr] contient un samedi(6) ou dimanche(0)
        let spansWeekend = false
        const sDate = new Date(startDateStr)
        const eDate = new Date(endDateStr)
        for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
            const day = d.getDay()
            if (day === 0 || day === 6) { spansWeekend = true; break }
        }

        // Détermine si, sur une des journées couvertes, l'événement est actif à ou après l'heure de fermeture
        let crossesClosingHour = false
        const startDateOnly = new Date(startDateStr)
        const endDateOnly = new Date(endDateStr)
        for (let d = new Date(startDateOnly); d <= endDateOnly; d.setDate(d.getDate() + 1)) {
            const y = d.getFullYear()
            const m = d.getMonth() + 1
            const day = d.getDate()
            const isoDay = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`

            const isFirstDay = d.toDateString() === new Date(startDateStr).toDateString()
            const isLastDay = d.toDateString() === new Date(endDateStr).toDateString()

            const dayStart = makeDateTime(isoDay, isFirstDay ? form.event_start_time : undefined, false)
            const dayEnd = makeDateTime(isoDay, isLastDay ? form.event_end_time : undefined, true)

            const limitDT = new Date(d.getFullYear(), d.getMonth(), d.getDate(), heureLimite, 0, 0)

            // Si le créneau actif du jour recouvre le créneau à/à partir de l'heure limite
            if (dayEnd >= limitDT && dayStart <= dayEnd) {
                // Il y a une portion d'événement à/au-delà de l'heure limite
                if (dayEnd.getHours() >= heureLimite || (limitDT >= dayStart && limitDT <= dayEnd) || dayStart.getHours() >= heureLimite) {
                    crossesClosingHour = true
                    break
                }
            }
        }

        form.needs_bulle_ssi = spansWeekend || crossesClosingHour
    }

    // needs_agent_secu :
    form.needs_agent_secu = 
        (reglesSecu.conditions.effectif_superieur && (form.estimated_attendees ?? 0) >= reglesSecu.seuil_effectif) ||
        (reglesSecu.conditions.presence_alcool && form.alcohol?.enabled) ||
        (reglesSecu.conditions.public_exterieur && form.has_external_people) ||
        (reglesSecu.conditions.hors_horaires && form.needs_bulle_ssi)

    // deadline supérieure : si alcool, bulle SSI, agent secu, public extérieur ou plus de 49 personnes
    needsEarlyDeadline = 
        (regles.conditions.hors_horaires && form.needs_bulle_ssi) ||
        (regles.conditions.offre_alimentaire && form.has_food) ||
        (regles.conditions.debit_boissons && form.alcohol?.enabled) ||
        (regles.conditions.public_exterieur && form.has_external_people) ||
        (regles.conditions.effectif_superieur && (form.estimated_attendees ?? 0) >= regles.seuil_effectif)
    
    
    if (form.event_date) {
      const eventDate = new Date(form.event_date)
      const deadline = new Date(eventDate)
      if (needsEarlyDeadline) {
        deadline.setDate(deadline.getDate() - regles.delai_cas2_semaines * 7)
      } else {
        deadline.setDate(deadline.getDate() - regles.delai_cas1_semaines * 7)
      }
      form.deadline = deadline.toISOString().split('T')[0]
    }
    // Mettre à jour l'état indiquant si la deadline est dépassée
    deadlineExpired = form.deadline ? (new Date() > new Date(form.deadline)) : false
  })


    let showDeleteModal = $state(false)
    let showSubmitModal = $state(false)
    let showUpdateModal = $state(false)
    let updateMessage = $state('')
    let actionErrors = $state<string[]>([])

    let deleteFormEl = $state<HTMLFormElement>()
    let submitFormEl = $state<HTMLFormElement>()
    let updateFormEl = $state<HTMLFormElement>()

    function deleteFiche() {
        showDeleteModal = false
        deleteFormEl?.requestSubmit()
    }

    async function submitFiche() {
        showSubmitModal = false
        actionErrors = []
        clearTimeout(saveTimeout)
        await doSave()
        submitFormEl?.requestSubmit()
    }

    async function updateFiche(message: string) {
        updateMessage = message
        showUpdateModal = false
        actionErrors = []
        clearTimeout(saveTimeout)
        await doSave()
        await tick()
        updateFormEl?.requestSubmit()
    }
</script>

<div class="sticky top-0 z-20 bg-dark-terciary py-4 px-4 flex items-center justify-between">
  <h1 class="text-2xl font-bold text-text-main">Formulaire d'édition</h1>
  <span class="text-sm">
        {#if saveStatus === 'saving'}
          <span in:fade class="text-text-muted">Sauvegarde...</span>
        {:else if saveStatus === 'saved'}
          <span out:fade class="text-dark-green-accent">✓ Sauvegardé</span>
        {:else if saveStatus === 'error'}
          <span out:fade class="text-dark-red-accent">Erreur de sauvegarde</span>
        {/if}
    </span>
</div>

{#if editionError}
    <div class="max-w-3xl mx-auto mt-4 rounded border border-dark-red-accent bg-dark-secondary px-4 py-3 text-sm text-dark-red-accent">
        {editionError}
    </div>
{/if}

{#if editionLoading}
    <div class="flex flex-col min-h-screen space-y-6 max-w-3xl mx-auto pt-4 skeleton-fade-in">
        {#each [1, 2, 3, 4] as i}
            <section class="border border-dark-primary p-6 space-y-3 animate-pulse">
                <div class="h-5 w-56 bg-dark-secondary rounded"></div>
                <div class="h-10 w-full bg-dark-secondary rounded"></div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="h-10 w-full bg-dark-secondary rounded"></div>
                    <div class="h-10 w-full bg-dark-secondary rounded"></div>
                </div>
                {#if i % 2 === 0}
                    <div class="h-16 w-full bg-dark-secondary rounded"></div>
                {/if}
            </section>
        {/each}
    </div>
{:else}
<div class="flex flex-col min-h-screen space-y-6 max-w-3xl mx-auto">

    <!-- INFORMATIONS GENERALES -->
    <section class="border border-dark-primary bg-dark-secondary shadow p-6 space-y-4">
        <h2 class="text-lg font-semibold text-text-main">Informations générales</h2>

        <div>
          <label for="title" class="block text-sm text-text-muted mb-1">Titre de l'événement</label>
          <input id="title" type="text" bind:value={form.title} oninput={autoSave}
            class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500" />
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="start-date" class="block text-sm text-text-muted mb-1">Date de début</label>
                <input id="start-date" type="date" bind:value={form.event_date} min={new Date().toISOString().split('T')[0]} oninput={ () => { autoSave(); if (form.event_end_date && form.event_end_date < form.event_date) form.event_end_date = form.event_date } }
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary hover:cursor-text" />
            </div>
            <div>
                <label for="end-date" class="block text-sm text-text-muted mb-1">Date de fin</label>
                <input id="end-date" type="date" bind:value={form.event_end_date} oninput={autoSave}
                min={form.event_date}
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary hover:cursor-text" />
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="event_start_time" class="block text-sm text-text-muted mb-1">Heure de début</label>
              <input id="event_start_time" type="time" bind:value={form.event_start_time} oninput={autoSave}
              class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary hover:cursor-text" />
            </div>
            <div>
              <label for="event_end_time" class="block text-sm text-text-muted mb-1">Heure de fin</label>
              <input id="event_end_time" type="time" bind:value={form.event_end_time} oninput={autoSave}
              class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary hover:cursor-text" />
            </div>
        </div>

        <div>
            <label for="location" class="block text-sm text-text-muted mb-1">Lieu</label>
            <input id="location" type="text" bind:value={form.location} oninput={autoSave}
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
        </div>

        <div>
          <label for="category" class="block text-sm text-text-muted mb-1">Catégorie</label>
          <select id="category" bind:value={form.category} onchange={autoSave}
            class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary hover:cursor-pointer">
                <option value="">Sélectionner...</option>
                {#each editionData.settings?.categories_evenement ?? [] as cat}
                    <option value={cat}>{cat}</option>
                {/each}
            </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="budget" class="block text-sm text-text-muted mb-1">Budget (€)</label>
              <input id="budget" type="number" bind:value={form.budget} oninput={autoSave}
              class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
              <label for="estimated_attendees" class="block text-sm text-text-muted mb-1">Nombre de personnes estimé</label>
              <input id="estimated_attendees" type="number" bind:value={form.estimated_attendees} oninput={autoSave}
              class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
            </div>
        </div>

        <div>
          <label for="description" class="block text-sm text-text-muted mb-1">Description</label>
          <textarea id="description" bind:value={form.description} oninput={autoSave} rows="3"
            class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary"></textarea>
        </div>

        {#if editionData.settings?.documents_aide?.plan_implantation_vierge_path}
        <label for="" class="block text-sm text-text-muted mb-1">Plan d'implantation</label>
        <PdfViewer
            path={editionData.settings.documents_aide.plan_implantation_vierge_path}
            label="Consulter le plan d'accès du bâtiment Ireste"
            docTitle="Plan d'implantation vierge"
            bucket="public-ressources"
        />

        <FileUpload
            formId={form.id}
            documentType="plan_implantation"
            label="Téléchargez le plan d'implantation vierge ci-dessus puis rendez le une fois personnalisé (optionnel)"
            currentPath={form.site_plan_path}
            onuploaded={(path) => { 
                form.site_plan_path = path; 
                autoSave() 
            }}
        />
            
        {/if}

    </section>
    
    <!-- RESPONSABLES -->
    <section class="border border-dark-primary bg-dark-secondary shadow p-6 space-y-6">
        <h2 class="text-lg font-semibold text-text-main">Responsables</h2>

        {#each [
        { key: 'responsible_prevention', label: 'Responsable Prévention' },
        { key: 'responsible_security', label: 'Responsable Sécurité' },
        { key: 'responsible_organisation', label: 'Responsable Organisation' },
        ] as resp}
        <div>
            <h3 class="text-text-main font-medium mb-3">{resp.label}</h3>
            <div class="grid grid-cols-2 gap-3">
            <div>
                <label for={resp.key + "_nom"} class="block text-sm text-text-muted mb-1">Nom</label>
                <input id={resp.key + "_nom"} name={resp.key + "_nom"} type="text" bind:value={form[resp.key].nom} autocomplete="family-name" oninput={autoSave}
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
                <label for={resp.key + "_prenom"} class="block text-sm text-text-muted mb-1">Prénom</label>
                <input id={resp.key + "_prenom"} name={resp.key + "_prenom"} type="text" bind:value={form[resp.key].prenom} autocomplete="given-name" oninput={autoSave}
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
                <label for={resp.key + "_email"} class="block text-sm text-text-muted mb-1">Email</label>
                <input id={resp.key + "_email"} name={resp.key + "_email"} type="email" bind:value={form[resp.key].email} autocomplete="email" oninput={autoSave}
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
                <label for={resp.key + "_telephone"} class="block text-sm text-text-muted mb-1">Téléphone</label>
                <input id={resp.key + "_telephone"} name={resp.key + "_telephone"} type="tel" bind:value={form[resp.key].telephone} autocomplete="tel" oninput={autoSave}
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
                <label for={resp.key + "_departement"} class="block text-sm text-text-muted mb-1">Département de formation</label>
                <input id={resp.key + "_departement"} name={resp.key + "_departement"} type="text" bind:value={form[resp.key].departement} autocomplete="organization" oninput={autoSave}
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
            </div>
            </div>
        </div>
        {/each}
    </section>

    <!-- PUBLIC EXTÉRIEURES -->
    <section class="border border-dark-primary bg-dark-secondary shadow p-6">
        <label class="flex items-center gap-3 text-text-main cursor-pointer font-semibold">
        <input type="checkbox" bind:checked={form.has_external_people} onchange={autoSave} class="w-4 h-4 hover:cursor-pointer" />
        Public extérieures à l'école ?
        </label>
    </section>

    <!-- BESOIN MATERIEL -->
    <section class="border border-dark-primary bg-dark-secondary shadow p-6">
        <div class="flex items-center justify-between">
            <span class="text-text-main font-semibold">Besoin de matériel ?</span>
            <Switch bind:checked={form.needs_equipment} onChange={autoSave} />
        </div>

        {#if form.needs_equipment}
        <div class="mt-4 space-y-3">
            {#if editionData.settings?.documents_aide?.fiche_materiel_path}
                <PdfViewer 
                    path={editionData.settings.documents_aide.fiche_materiel_path} 
                    label="Consulter la fiche d'aide relative au prêt de matériel"
                    docTitle="Fiche d'aide Matériel"
                    bucket="public-ressources"
                />
            {/if}
            {#each editionData.settings?.materiel_disponible ?? [] as item}
            <div class="flex items-center justify-between">
                <span class="text-text-main">{item}</span>
                <div class="flex items-center gap-2">
                <button type="button"
                    onclick={() => { form.equipment[item] = Math.max(0, form.equipment[item] - 1); autoSave() }}
                    class="w-8 h-8 rounded border border-dark-primary bg-dark-secondary text-text-main hover:bg-dark-terciary active:bg-dark-terciary flex items-center justify-center pb-1 hover:cursor-pointer">−</button>
                <span class="w-8 text-center text-text-main font-mono">{form.equipment[item]}</span>
                <button type="button"
                    onclick={() => { form.equipment[item] = form.equipment[item] + 1; autoSave() }}
                    class="w-8 h-8 rounded border border-dark-primary bg-dark-secondary text-text-main hover:bg-dark-terciary active:bg-dark-terciary flex items-center justify-center pb-1 hover:cursor-pointer">+</button>
                </div>
            </div>
            {/each}

            <div>
                <p class="text-sm text-text-muted">Si vous avez besoin d'un autre type de matériel, renseignez-vous auprès de la marie qui pourra peut être vous le fournir ou enrientez vous vers un prestataire adapté.</p>
            </div>
        </div>
        {/if}
    </section>

    <!-- COMMUNICATION (dépliable) -->
    <section class="border border-dark-primary bg-dark-secondary shadow p-6">
        <div class="flex items-center justify-between">
            <span class="text-text-main font-semibold">Besoin de communication ?</span>
            <Switch bind:checked={form.needs_communication} onChange={autoSave} />
        </div>
        {#if form.needs_communication}
        <div class="mt-4 space-y-3">
            {#if editionData.settings?.documents_aide?.fiche_communication_path}
                <PdfViewer 
                    path={editionData.settings.documents_aide.fiche_communication_path} 
                    label="Consulter la fiche d'aide relative à la communication"
                    docTitle="Fiche d'aide Communication"
                    bucket="public-ressources"
                />
            {/if}
            {#each editionData.settings?.canaux_communication ?? [] as canal}
            <label class="flex items-center gap-3 text-text-main cursor-pointer">
                <input type="checkbox"
                bind:checked={form.communication[canal]}
                onchange={autoSave}
                class="w-4 h-4 rounded hover:cursor-pointer" />
                {canal}
            </label>
            {/each}

            <div class="mt-2">
            <label for="advertisment_description" class="block text-sm text-text-muted mb-1">
                Description du contenu à diffuser
                <span class="text-xs">(texte, lien Drive pour visuels ou vidéos...)</span>
            </label>
            <textarea id="advertisment_description" bind:value={form.communication.description} oninput={autoSave} rows="3"
                placeholder="Ex : Affiche disponible sur le Drive du club à ce lien..."
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary"></textarea>
            </div>
        </div>
        {/if}
    </section>

    <!-- OFFRE ALIMENTAIRE (dépliable) -->
    <section class="border border-dark-primary bg-dark-secondary shadow p-6">
        <div class="flex items-center justify-between">
            <span class="text-text-main font-semibold">Offre alimentaire ?</span>
            <Switch bind:checked={form.has_food} onChange={autoSave} />
        </div>

        {#if form.has_food}
        <div class="mt-4 space-y-4">
            {#if editionData.settings?.documents_aide?.fiche_hygiene_path}
                <PdfViewer 
                    path={editionData.settings.documents_aide.fiche_hygiene_path} 
                    label="Consulter la fiche d'aide relative à la distribution de nourriture"
                    docTitle="Fiche d'aide Alimentation"
                    bucket="public-ressources"
                />
            {/if}
            <label class="flex items-center gap-3 text-text-main cursor-pointer">
            <input type="checkbox" bind:checked={form.food.has_caterer} onchange={autoSave} class="w-4 h-4 rounded hover:cursor-pointer" />
            Prestataire externe ?
            </label>

            {#if form.food.has_caterer}
            <div class="grid grid-cols-2 gap-4">
                <div>
                <label for="caterer_name" class="block text-sm text-text-muted mb-1">Nom du prestataire</label>
                <input id="caterer_name" type="text" bind:value={form.food.caterer_name} oninput={autoSave}
                    class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
                </div>
                <div>
                <label for="caterer_siret" class="block text-sm text-text-muted mb-1">SIRET</label>
                <input id="caterer_siret" type="text" bind:value={form.food.caterer_siret} oninput={autoSave}
                    maxlength="14" placeholder="14 chiffres"
                    class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
                </div>
            </div>
            {/if}
            <div>
                <label for="organisation" class="block text-sm text-text-muted mb-1">Organisation (cuisine, stockage, transport...)</label>
                <textarea id="organisation" bind:value={form.food.organisation} oninput={autoSave} rows="3"
                placeholder="Expliquez comment vous allez préparer et/ou gérer la nourriture..."
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary"></textarea>
            </div>
            <div>
            <label for="menu" class="block text-sm text-text-muted mb-1">Menu prévu</label>
            <textarea id="menu" bind:value={form.food.menu} oninput={autoSave} rows="2"
                placeholder="Ex : pizzas, chips, boissons sans alcool..."
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary"></textarea>
            </div>

        </div>
        {/if}
    </section>

    <!-- ALCOOL (dépliable) -->
    <section class="border border-dark-primary bg-dark-secondary shadow p-6">
        <div class="flex items-center justify-between">
            <span class="text-text-main font-semibold">Distribution d'alcool ?</span>
            <Switch bind:checked={form.alcohol.enabled} onChange={autoSave}/>
        </div>

        {#if form.alcohol.enabled}
        <div class="mt-4 space-y-6">
        {#if editionData.settings?.documents_aide?.fiche_alcool_path}
            <PdfViewer 
                path={editionData.settings.documents_aide.fiche_alcool_path} 
                label="Consulter la fiche d'aide relative à la distribution d'alcool"
                docTitle="Fiche d'aide Alcool"
                bucket="public-ressources"
            />
        {/if}
        <!-- Structure détentrice -->
        <div>
            <label for="ddb_owner_name" class="block text-sm text-text-muted mb-1">Structure détentrice de la licence</label>
            <input id="ddb_owner_name" type="text" bind:value={form.alcohol.structure_licence} oninput={autoSave}
            placeholder="Nom de la structure..."
            class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary" />
        </div>

        <!-- DDB Mairie -->
        <div class="space-y-3">
            <p class="text-sm text-text-muted font-medium">Demande de débit de boisson en mairie</p>

            <div class="ml-7 space-y-3">
                <div>
                <label for="ddb_mairie_date_demande" class="block text-sm text-text-muted mb-1">Date de la demande</label>
                <input id="ddb_mairie_date_demande" type="date" bind:value={form.alcohol.ddb_mairie.date_demande} onchange={autoSave}
                    class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary hover:cursor-text" />
                </div>
                <FileUpload
                    formId={form.id}
                    documentType="ddb_mairie"
                    label="Autorisation débit de boisson — Mairie"
                    currentPath={form.alcohol.ddb_mairie.autorisation_path || null}
                    onuploaded={(path) => {
                        form.alcohol.ddb_mairie.autorisation_path = path
                        autoSave()
                    }}
                />
            </div>
        </div>

        <!-- occupation du domaine public Nantes Université -->
        <div class="space-y-3">
            <p class="text-sm text-text-muted font-medium">Demande d'autorisation d'occupation du domaine public — Nantes Université</p>

            <div class="ml-7 space-y-3">
                <div>
                <label for="ddb_nantes_universite_date_demande" class="block text-sm text-text-muted mb-1">Date de la demande</label>
                <input id="ddb_nantes_universite_date_demande" type="date" bind:value={form.alcohol.ddb_nantes_universite.date_demande} onchange={autoSave}
                    class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary hover:cursor-text" />
                </div>
                <FileUpload
                    formId={form.id}
                    documentType="ddb_nantes_universite"
                    label="Autorisation d'occupation du domaine public — Nantes Université"
                    currentPath={form.alcohol.ddb_nantes_universite.autorisation_path || null}
                    onuploaded={(path) => {
                        form.alcohol.ddb_nantes_universite.autorisation_path = path
                        autoSave()
                    }}
                />
            </div>
        </div>

        <!-- Questions prévention -->
        <div class="space-y-4">
            <h3 class="text-text-main font-medium">Dispositifs de prévention</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                {#each editionData.settings?.dispositifs_prevention ?? [] as disp, i}
                <label class="flex items-center gap-3 text-text-main cursor-pointer">
                    <input type="checkbox"
                        bind:checked={form.alcohol.prevention[i].selected}
                        onchange={autoSave}
                        class="w-4 h-4 rounded hover:cursor-pointer" />
                    <div class="flex flex-col justify-start">
                        <span class="">{disp.titre}</span>
                        {#if disp.description}
                        <p class="text-xs text-text-muted">{disp.description}</p>
                        {/if}
                    </div>
                </label>
                {/each}
            </div>
        </div>

        </div>
        {/if}
    </section>

    
    {#if form.needs_bulle_ssi}
    {@const typedCles = form.security.cles as Record<string, { key: string; selected: boolean }[]>}
    {@const directions = Object.keys(typedCles)}
    {@const directionsCouvertes = directions.filter(direction => typedCles[direction].some(cle => cle.selected))}
    {@const missingDirections = directions.filter(d => !directionsCouvertes.includes(d)).map(d => d.charAt(0).toUpperCase() + d.slice(1))}
    <!-- SÉCURITÉ & ACCÈS -->
    <section class="border border-yellow-600 bg-dark-secondary shadow p-6 space-y-6">
        <h2 class="text-lg font-semibold text-dark-orange-accent mb-2">SSI et Accès requis</h2>
        <!-- Clés -->
        <div class="space-y-3">
            {#if editionData.settings?.documents_aide?.plan_acces_path}
                <PdfViewer 
                    path={editionData.settings.documents_aide.plan_acces_path} 
                    label="Consulter la fiche d'aide relative aux accès du bâtiment"
                    docTitle="Plan d'accès et de sécurité"
                    bucket="public-ressources"
                />
            {/if}
            <p class="text-sm text-text-muted">
                Sélectionnez les clés dont vous aurez besoin hors des horaires d'ouverture de l'école. Vous devez couvrir les 4 points cardinaux + le portique.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#each Object.entries(typedCles) as [direction, keys]}
                    <div>
                    <p class="text-xs text-text-muted uppercase mb-1">{direction}</p>
                    <div class="flex flex-wrap gap-2">
                        {#each keys as cle}
                        <button type="button"
                            onclick={() => { cle.selected = !cle.selected; autoSave() }}
                            class="px-3 py-1.5 rounded-lg text-sm font-mono transition-colors border hover:cursor-pointer {cle.selected
                            ? 'bg-accent-selection border-accent-selection text-white'
                            : 'bg-dark-secondary border-dark-primary text-text-muted hover:text-text-main active:text-text-main'}">
                            {cle.key}
                        </button>
                        {/each}
                    </div>
                    </div>
                {/each}
            </div>

            <!-- Validation des directions disponibles -->        
            {#if missingDirections.length > 0}
                <div class="bg-dark-orange-bg border border-dark-orange-accent rounded p-3 text-sm text-dark-orange-accent">
                ⚠️ Points manquants :
                {missingDirections.join(', ')}
                </div>
            {/if}
            </div>

            <!-- Salle SSI -->
            <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h3 class="text-text-main font-medium">Présents dans la salle SSI</h3>
                <button type="button"
                onclick={() => { form.security.salle_ssi = [...form.security.salle_ssi, { nom: '', prenom: '', email: '' }]; autoSave() }}
                class="text-sm text-blue-link hover:text-blue-link/80 active:text-blue-link/80 hover:cursor-pointer">
                + Ajouter une personne
                </button>
            </div>

            {#if form.security.salle_ssi.length === 0}
                <p class="text-sm text-text-muted italic">Aucune personne ajoutée</p>
            {/if}

            {#each form.security.salle_ssi as personne, i}
            <div class="grid grid-cols-2 gap-3 items-start">
                <div>
                    <label for={i + "_name"} class="block text-xs text-text-muted mb-1">Nom</label>
                    <input id={i + "_name"} name={"salle_ssi_" + i + "_nom"} type="text" bind:value={personne.nom} autocomplete="family-name" oninput={autoSave}
                    class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary text-sm" />
                </div>
                <div>
                    <label for={i + "_prenom"} class="block text-xs text-text-muted mb-1">Prénom</label>
                    <input id={i + "_prenom"} name={"salle_ssi_" + i + "_prenom"} type="text" bind:value={personne.prenom} autocomplete="given-name" oninput={autoSave}
                    class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary text-sm" />
                </div>
                <div>
                    <label for={i + "_email"} class="block text-xs text-text-muted mb-1">Email</label>
                    <input id={i + "_email"} name={"salle_ssi_" + i + "_email"} type="email" bind:value={personne.email} autocomplete="email" oninput={autoSave}
                        class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary text-sm" />
                </div>
                <div class="flex gap-2 items-end">
                    <div class="flex-1">
                        <label for={i + "_telephone"} class="block text-xs text-text-muted mb-1">Téléphone</label>
                        <input id={i + "_telephone"} name={"salle_ssi_" + i + "_telephone"} type="tel" bind:value={personne.telephone} autocomplete="tel" oninput={autoSave}
                        class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary text-sm" />
                    </div>
                    <button type="button"
                    onclick={() => { form.security.salle_ssi = form.security.salle_ssi.filter((_: unknown, j: any) => j !== i); autoSave() }}
                    class="mb-0.5 text-dark-red-accent hover:text-dark-red-accent active:text-dark-red-accent px-2 py-2">✕</button>
                </div>
            </div>
            {/each}
        </div>

    </section>
    {/if}

    <!-- AGENT DE SÉCURITÉ (conditionnel automatique) -->
    {#if form.needs_agent_secu}
    <section class="border border-yellow-600 bg-dark-secondary shadow p-6 space-y-6">
        <h2 class="text-lg font-semibold text-dark-orange-accent mb-2">Sécurité et secouristes requis</h2>
        <!-- <p class="text-sm text-dark-orange-accent italic">Plus de 49 personnes attendues et/ou débit de boisson</p> -->

        <!-- Entreprise de sécurité -->
        <div class="space-y-3">

        {#if editionData.settings?.documents_aide?.fiche_securite_path}
            <PdfViewer 
                path={editionData.settings.documents_aide.fiche_securite_path} 
                label="Consulter la fiche d'aide relative à la sécurité et aux secouristes"
                docTitle="Fiche d'aide Sécurité - Secouristes"
                bucket="public-ressources"
            />
        {/if}
        <h3 class="text-text-main font-medium">Entreprise de sécurité</h3>
        <div class="grid grid-cols-2 gap-3">
            <div>
            <label for="security_name" class="block text-xs text-text-muted mb-1">Nom de l'entreprise</label>
            <input id="security_name" type="text" bind:value={form.agent_secu.entreprise_securite.nom} oninput={autoSave}
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary text-sm" />
            </div>
            <div>
            <label for="security_siret" class="block text-xs text-text-muted mb-1">SIRET</label>
            <input id="security_siret" type="text" bind:value={form.agent_secu.entreprise_securite.siret} oninput={autoSave}
                maxlength="14" placeholder="14 chiffres"
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary text-sm" />
            </div>
        </div>
        <FileUpload
            formId={form.id}
            documentType="agent_secu_entreprise_contrat"
            label="Devis signé avec l'entreprise de sécurité"
            currentPath={form.agent_secu.entreprise_securite.devis_path || null}
            onuploaded={(path) => {
                form.agent_secu.entreprise_securite.devis_path = path
                autoSave()
            }}
        />
    </div>

        <div class="border-t border-yellow-600/30 pt-6 space-y-3">
        <h3 class="text-text-main font-medium">Secouristes</h3>

        <label class="flex items-center gap-3 text-text-main cursor-pointer">
            <input type="checkbox" bind:checked={form.agent_secu.secouristes.has_organisme} onchange={autoSave} class="w-4 h-4 rounded hover:cursor-pointer" />
            Organisme de secouristes externe ?
        </label>

        {#if form.agent_secu.secouristes.has_organisme}
            <div class="grid grid-cols-2 gap-3">
            <div>
                <label for="secouristes_nom" class="block text-xs text-text-muted mb-1">Nom de l'organisme</label>
                <input id="secouristes_nom" type="text" bind:value={form.agent_secu.secouristes.organisme_nom} oninput={autoSave}
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary text-sm" />
            </div>
            <div>
                <label for="secouristes_siret" class="block text-xs text-text-muted mb-1">SIRET</label>
                <input id="secouristes_siret" type="text" bind:value={form.agent_secu.secouristes.organisme_siret} oninput={autoSave}
                maxlength="14" placeholder="14 chiffres"
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary text-sm" />
            </div>
            </div>
            <FileUpload
                formId={form.id}
                documentType="agent_secu_secouristes_devis"
                label="Devis signé avec l'organisme de secouristes"
                currentPath={form.agent_secu.secouristes.organisme_devis_path || null}
                onuploaded={(path) => {
                    form.agent_secu.secouristes.organisme_devis_path = path
                    autoSave()
                }}
            />
        {:else}
            <div>
            <label for="secouristes_dispositions" class="block text-xs text-text-muted mb-1">Dispositions prises par le club</label>
            <textarea id="secouristes_dispositions" bind:value={form.agent_secu.secouristes.dispositions} oninput={autoSave} rows="3"
                placeholder="Décrivez les dispositions prises pour assurer la sécurité des participants..."
                class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary text-sm">
            </textarea>
            </div>
        {/if}
        </div>

    </section>
    {/if}

    <!-- Erreurs de validation serveur -->
    {#if actionErrors.length > 0}
    <div class="sticky bottom-30 z-25 mb-0 mt-auto mx-auto bg-dark-secondary border border-dark-red-accent rounded-lg p-4 max-w-md w-full shadow-xl">
        <h3 class="text-dark-red-accent font-bold mb-2">La fiche ne peut pas être soumise :</h3>
        <ul class="text-sm text-text-muted space-y-1 list-disc list-inside">
            {#each actionErrors.slice(0, 4) as err}
                <li>{err}</li>
            {/each}
            {#if actionErrors.length > 4}
                <li class="font-bold">ainsi que {actionErrors.length - 4} autres erreurs</li>
            {/if}
        </ul>
        <button type="button" onclick={() => actionErrors = []}
            class="mt-3 text-xs text-text-muted hover:text-text-main active:text-text-main underline">Fermer</button>
    </div>
    {/if}

    <!-- Modals -->
    {#if showDeleteModal}
    <ConfirmModal
        title="Supprimer la fiche ?"
        description="Cette action est irréversible. Pour confirmer, écrivez <strong class='text-text-main font-mono'>supprimer</strong> ci-dessous."
        confirmWord="supprimer"
        confirmLabel="Supprimer définitivement"
        accentColor="red"
        onconfirm={deleteFiche}
        oncancel={() => showDeleteModal = false}
    />
    {/if}

    {#if showSubmitModal}
    <ConfirmModal
        title="Soumettre la fiche ?"
        description="La fiche ne sera plus modifiable jusqu'à retour de l'administration. Pour confirmer, écrivez <strong class='text-text-main font-mono'>soumettre</strong> ci-dessous."
        confirmWord="soumettre"
        confirmLabel="Soumettre pour validation"
        accentColor="green"
        onconfirm={submitFiche}
        oncancel={() => showSubmitModal = false}
    />
    {/if}

    {#if showUpdateModal}
    <MessageModal
        title="Mettre à jour la fiche ?"
        description="Rédigez un message à l'administration pour expliquer les changements effectués. La fiche ne sera plus modifiable jusqu'à retour de l'administration."
        placeholder="Ton message à l'administration..."
        confirmLabel="Mettre à jour la fiche"
        accentColor="green"
        onconfirm={updateFiche}
        oncancel={() => showUpdateModal = false}
    />
    {/if}

    <footer class="sticky bottom-0 left-0 w-full z-20 mb-0 mt-auto">
      <div class="bg-dark-secondary p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t-2 border-x-2 rounded-t border-dark-primary gap-3 max-w-3xl mx-auto">
        <div>
            {#if editionData.fiche.status === 'brouillon'}
            <div class="flex flex-wrap items-baseline gap-x-1">
                <p class="text-sm text-text-muted whitespace-nowrap">A soumettre avant le</p>
                <p class={deadlineExpired ? 'text-dark-red-accent font-bold text-sm' : 'text-text-main font-bold text-sm'}>
                    {formatDateSmart(form.deadline, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>
            <p class="text-xs text-text-muted mt-1">
                {needsEarlyDeadline ? `${editionData.settings?.regles_cas2?.delai_cas2_semaines ?? defaultReglesCas2.delai_cas2_semaines}` : `${editionData.settings?.regles_cas2?.delai_cas1_semaines ?? defaultReglesCas2.delai_cas1_semaines}`} semaines avant l'événement
            </p>
            {/if}
        </div>

        <div class="flex gap-3">
            <button type="button" onclick={() => showDeleteModal = true}
                class="flex-1 sm:flex-none border-3 border-dark-red-accent px-3 py-1.5 text-dark-red-accent font-bold hover:bg-dark-red-accent active:bg-dark-red-accent hover:text-white active:text-white rounded transition-colors hover:cursor-pointer">
                Supprimer
            </button>
            {#if editionData.fiche.status === 'brouillon'}
            <button type="button" onclick={() => { actionErrors = []; showSubmitModal = true }}
                class="flex-1 sm:flex-none border-3 border-dark-green-accent px-3 py-1.5 text-dark-green-accent font-bold hover:bg-dark-green-accent active:bg-dark-green-accent hover:text-white active:text-white rounded transition-colors hover:cursor-pointer">
                Soumettre
            </button>
            {:else if editionData.fiche.status === 'en_revision'}
            <button type="button" onclick={() => showUpdateModal = true}
                class="flex-1 sm:flex-none border-3 border-dark-green-accent px-3 py-1.5 text-dark-green-accent font-bold hover:bg-dark-green-accent active:bg-dark-green-accent hover:text-white active:text-white rounded transition-colors hover:cursor-pointer">
                Mettre à jour
            </button>
            {/if}
        </div>

        <!-- Formulaires cachés soumis côté serveur -->
        <form bind:this={deleteFormEl} method="POST" action="?/supprimer" use:enhance class="hidden"></form>
        <form bind:this={submitFormEl} method="POST" action="?/soumettre" class="hidden"
            use:enhance={() => {
                return async ({ result, update }) => {
                    if (result.type === 'failure' && result.data?.errors) {
                        actionErrors = result.data.errors as string[]
                    } else {
                        await update()
                    }
                }
            }}>
            <input type="hidden" name="settings" value={JSON.stringify(editionData.settings ?? {})} />
        </form>
        <form bind:this={updateFormEl} method="POST" action="?/mettre_a_jour" class="hidden"
            use:enhance={() => {
                return async ({ result, update }) => {
                    if (result.type === 'failure' && result.data?.errors) {
                        actionErrors = result.data.errors as string[]
                    } else {
                        await update()
                    }
                }
            }}>
            <input type="hidden" name="update_message" value={updateMessage} />
            <input type="hidden" name="settings" value={JSON.stringify(editionData.settings ?? {})} />
        </form>
      </div>
    </footer>
</div>
{/if}

<style>
    .skeleton-fade-in {
        opacity: 0;
        animation: skeletonFadeIn 200ms ease-out 200ms forwards;
    }

    @keyframes skeletonFadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .skeleton-fade-in {
            opacity: 1;
            animation: none;
        }
    }
</style>
