<script lang="ts">
  import { untrack, tick } from 'svelte'
  import { fade } from 'svelte/transition'
  import { supabase } from '$lib/supabase'
  import { eventDetails } from '$lib/eventStore'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'
  import Switch from '$lib/components/Switch.svelte'
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
	import MessageModal from '$lib/components/MessageModal.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';

  let { data } = $props()

  // État local du formulaire, initialisé avec les données de la fiche
  let form = $state(untrack(() => ({ 
    ...data.fiche,
    equipment: data.fiche.equipment ?? {
        tables: 0, chaises: 0, panneaux: 0, rallonges: 0, multiprises: 0, autre: ''
    },
    communication: data.fiche.communication ?? {
        mur_ecrans: false, intranet: false, reseaux_sociaux: false, newsletter: false, description: ''
    },
    food: data.fiche.food ?? {
        has_carterer: false, carterer_name: '', carterer_siret: '', organisation: '', menu: ''
    },
    responsible_prevention: data.fiche.responsible_prevention ?? {
        nom: '', prenom: '', email: '', departement: ''
    },
    responsible_security: data.fiche.responsible_security ?? {
        nom: '', prenom: '', email: '', departement: ''
    },
    responsible_organisation: data.fiche.responsible_organisation ?? {
        nom: '', prenom: '', email: '', departement: ''
    },
    alcohol: data.fiche.alcohol ?? {
        enabled: false,
        ddb_mairie: { enabled: false, date_demande: '', autorisation_path: '' },
        ddb_nantes_universite: { enabled: false, date_demande: '', autorisation_path: '' },
        structure_licence: '',
        prevention: {
        eau_disposition: { oui: false, description: '' },
        poste_secours: { oui: false, description: '' },
        espace_repos: { oui: false, description: '' },
        stand_prevention: { oui: false, description: '' },
        capitaine_soiree: { oui: false, description: '' },
        affichage_transports: { oui: false, description: '' },
        navettes: { oui: false, description: '' },
        taxi_vtc: { oui: false, description: '' },
        }
    },
    security: data.fiche.security ?? {
        "cles": {
        "sud": { "key": "E1+110", "selected": false },
        "ouest_E9": { "key": "E9", "selected": false },
        "ouest_S0": { "key": "S0", "selected": false },
        "nord_E7": { "key": "E7", "selected": false },
        "nord_S8": { "key": "S8", "selected": false },
        "est_E6": { "key": "E6", "selected": false },
        "est_E5": { "key": "E5", "selected": false },
        "est_E4": { "key": "E4", "selected": false },
        "est_E3": { "key": "E3", "selected": false },
        "est_E2_111": { "key": "E2+111", "selected": false },
        "portique_parking": { "key": "Portique parking", "selected": false }
        },
        "salle_ssi": []
    },
    agent_secu: data.fiche.agent_secu ?? {
        entreprise_securite: { nom: '', siret: '', devis_path: '' },
        secouristes: { has_organisme: false, organisme_nom: '', organisme_siret: '', organisme_devis_path: '', dispositions: '' }
    },
})))

  // Indicateur de sauvegarde
  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle')
  let deadlineExpired = $state(false)
  let needsEarlyDeadline = $state(false) // true si la deadline doit être 2 mois avant au lieu de 2 semaines
  let saveTimeout: ReturnType<typeof setTimeout>


  async function autoSave() {
    clearTimeout(saveTimeout)
    saveStatus = 'saving'
    saveTimeout = setTimeout(async () => {
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

      if (!error) await invalidateAll()
      saveStatus = error ? 'error' : 'saved'
      setTimeout(() => saveStatus = 'idle', 2000)
    }, 2000)
  }

  // Update the store whenever the title or event date changes
  $effect(() => {
    eventDetails.set({
      title: form.title,
      eventDate: form.event_date
    });
  })

  $effect(() => {
    // needs_bulle_ssi : fin après 20h ou weekend
    if (form.event_end_time && form.event_date) {
      const endHour = parseInt(form.event_end_time.split(':')[0])
      const dayOfWeek = new Date(form.event_date).getDay()
      form.needs_bulle_ssi = endHour >= 20 || dayOfWeek === 0 || dayOfWeek === 6
    }
    // needs_agent_secu : >99 personnes ou alcool
    form.needs_agent_secu = (form.estimated_attendees ?? 0) > 99 || form.alcohol.enabled

    // deadline supérieure : si alcool, bulle SSI, agent secu, public extérieur ou plus de 49 personnes
    needsEarlyDeadline = form.alcohol.enabled || form.needs_bulle_ssi || form.has_food || form.estimated_attendees > 49 || form.has_external_people
    if (form.event_date) {
      const eventDate = new Date(form.event_date)
      const deadline = new Date(eventDate)
      deadline.setMonth(deadline.getMonth() - (needsEarlyDeadline ? 2 : 0))
      if (!needsEarlyDeadline) deadline.setDate(deadline.getDate() - 14)
      form.deadline = deadline.toISOString().split('T')[0]
    }
    // Mettre à jour l'état indiquant si la deadline est dépassée
    deadlineExpired = form.deadline ? (new Date() > new Date(form.deadline)) : false
  })

  const equipmentItems = [
    { key: 'tables', label: 'Tables' },
    { key: 'chaises', label: 'Chaises' },
    { key: 'panneaux', label: 'Panneaux d\'affichage' },
    { key: 'rallonges', label: 'Rallonges électriques' },
    { key: 'multiprises', label: 'Multiprises' }
  ]

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

    function submitFiche() {
        showSubmitModal = false
        actionErrors = []
        submitFormEl?.requestSubmit()
    }

    async function updateFiche(message: string) {
        updateMessage = message
        showUpdateModal = false
        actionErrors = []
        await tick()
        updateFormEl?.requestSubmit()
    }
</script>

<div class="sticky top-0 z-20 bg-dark-terciary py-4 px-4 flex items-center justify-between">
  <h1 class="text-2xl font-bold text-white">Formulaire d'édition</h1>
  <span class="text-sm">
        {#if saveStatus === 'saving'}
          <span in:fade class="text-gray-400">Sauvegarde...</span>
        {:else if saveStatus === 'saved'}
          <span out:fade class="text-dark-green-accent">✓ Sauvegardé</span>
        {:else if saveStatus === 'error'}
          <span out:fade class="text-dark-red-accent">Erreur de sauvegarde</span>
        {/if}
    </span>
</div>

<div class="flex flex-col min-h-screen space-y-6 max-w-3xl mx-auto">

    <!-- INFORMATIONS GENERALES -->
    <section class="border border-dark-primary p-6 space-y-4">
        <h2 class="text-lg font-semibold text-white">Informations générales</h2>

        <div>
          <label for="title" class="block text-sm text-gray-400 mb-1">Titre de l'événement</label>
          <input id="title" type="text" bind:value={form.title} oninput={autoSave}
            class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500" />
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="start-date" class="block text-sm text-gray-400 mb-1">Date de début</label>
                <input id="start-date" type="date" bind:value={form.event_date} oninput={autoSave}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
                <label for="end-date" class="block text-sm text-gray-400 mb-1">Date de fin</label>
                <input id="end-date" type="date" bind:value={form.event_end_date} oninput={autoSave}
                min={form.event_date}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="event_start_time" class="block text-sm text-gray-400 mb-1">Heure de début</label>
              <input id="event_start_time" type="time" bind:value={form.event_start_time} oninput={autoSave}
              class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
              <label for="event_end_time" class="block text-sm text-gray-400 mb-1">Heure de fin</label>
              <input id="event_end_time" type="time" bind:value={form.event_end_time} oninput={autoSave}
              class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
            </div>
        </div>

        <div>
            <label for="location" class="block text-sm text-gray-400 mb-1">Lieu</label>
            <input id="location" type="text" bind:value={form.location} oninput={autoSave}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
        </div>

        <div>
          <label for="category" class="block text-sm text-gray-400 mb-1">Catégorie</label>
          <select id="category" bind:value={form.category} onchange={autoSave}
            class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary">
                <option value="">Sélectionner...</option>
                <option value="soiree">Soirée</option>
                <option value="tournoi">Tournoi sportif</option>
                <option value="conference">Conférence</option>
                <option value="atelier">Atelier</option>
                <option value="autre">Autre</option>
            </select>
        </div>

        <div>
          <label for="description" class="block text-sm text-gray-400 mb-1">Description</label>
          <textarea id="description" bind:value={form.description} oninput={autoSave} rows="3"
            class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="budget" class="block text-sm text-gray-400 mb-1">Budget (€)</label>
              <input id="budget" type="number" bind:value={form.budget} oninput={autoSave}
              class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
              <label for="estimated_attendees" class="block text-sm text-gray-400 mb-1">Nombre de personnes estimé</label>
              <input id="estimated_attendees" type="number" bind:value={form.estimated_attendees} oninput={autoSave}
              class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
            </div>
        </div>
    </section>
    
    <!-- RESPONSABLES -->
    <section class="border border-dark-primary p-6 space-y-6">
        <h2 class="text-lg font-semibold text-white">Responsables</h2>

        {#each [
        { key: 'responsible_prevention', label: 'Responsable Prévention' },
        { key: 'responsible_security', label: 'Responsable Sécurité' },
        { key: 'responsible_organisation', label: 'Responsable Organisation' },
        ] as resp}
        <div>
            <h3 class="text-white font-medium mb-3">{resp.label}</h3>
            <div class="grid grid-cols-2 gap-3">
            <div>
                <label for={resp.key + "_nom"} class="block text-sm text-gray-400 mb-1">Nom</label>
                <input id={resp.key + "_nom"} type="text" bind:value={form[resp.key].nom} oninput={autoSave}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
                <label for={resp.key + "_prenom"} class="block text-sm text-gray-400 mb-1">Prénom</label>
                <input id={resp.key + "_prenom"} type="text" bind:value={form[resp.key].prenom} oninput={autoSave}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
                <label for={resp.key + "_email"} class="block text-sm text-gray-400 mb-1">Email</label>
                <input id={resp.key + "_email"} type="email" bind:value={form[resp.key].email} oninput={autoSave}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
            </div>
            <div>
                <label for={resp.key + "_departement"} class="block text-sm text-gray-400 mb-1">Département de formation</label>
                <input id={resp.key + "_departement"} type="text" bind:value={form[resp.key].departement} oninput={autoSave}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
            </div>
            </div>
        </div>
        {/each}
    </section>

    <!-- BESOIN MATERIEL -->
    <section class="border border-dark-primary p-6">
                <div class="flex items-center justify-between">
                    <span class="text-white font-semibold">Besoin de matériel ?</span>
                    <Switch bind:checked={form.needs_equipment} onChange={autoSave} />
                </div>

        {#if form.needs_equipment}
        <div class="mt-4 space-y-3">
            {#each equipmentItems as item}
            <div class="flex items-center justify-between">
                <span class="text-white">{item.label}</span>
                <div class="flex items-center gap-2">
                <button type="button"
                    onclick={() => { form.equipment[item.key] = Math.max(0, form.equipment[item.key] - 1); autoSave() }}
                    class="w-8 h-8 rounded bg-dark-secondary text-white hover:bg-dark-terciary flex items-center justify-center">−</button>
                <span class="w-8 text-center text-white font-mono">{form.equipment[item.key]}</span>
                <button type="button"
                    onclick={() => { form.equipment[item.key] = form.equipment[item.key] + 1; autoSave() }}
                    class="w-8 h-8 rounded bg-dark-secondary text-white hover:bg-dark-terciary flex items-center justify-center">+</button>
                </div>
            </div>
            {/each}

            <div>
            <label for="other_equipment" class="block text-sm text-gray-400 mb-1">Autre matériel</label>
            <textarea id="other_equipment" bind:value={form.equipment.autre} oninput={autoSave} rows="2"
                placeholder="Précise le matériel supplémentaire dont tu as besoin..."
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary"></textarea>
            </div>
        </div>
        {/if}
    </section>

    <!-- COMMUNICATION (dépliable) -->
    <section class="border border-dark-primary p-6">
                <div class="flex items-center justify-between">
                    <span class="text-white font-semibold">Besoin de communication ?</span>
                    <Switch bind:checked={form.needs_communication} onChange={autoSave} />
                </div>

        {#if form.needs_communication}
        <div class="mt-4 space-y-3">
            {#each [
            { key: 'mur_ecrans', label: "Mur d'écrans bâtiment Ireste" },
            { key: 'intranet', label: 'Intranet – Sites Polytech' },
            { key: 'reseaux_sociaux', label: 'Réseaux sociaux (Meta – LinkedIn – Instagram)' },
            { key: 'newsletter', label: 'Newsletter Polytech (1/mois, avant le 10 du mois)' },
            ] as canal}
            <label class="flex items-center gap-3 text-white cursor-pointer">
                <input type="checkbox"
                bind:checked={form.communication[canal.key]}
                onchange={autoSave}
                class="w-4 h-4 rounded" />
                {canal.label}
            </label>
            {/each}

            <div class="mt-2">
            <label for="advertisment_description" class="block text-sm text-gray-400 mb-1">
                Description du contenu à diffuser
                <span class="text-xs">(texte, lien Drive pour visuels ou vidéos...)</span>
            </label>
            <textarea id="advertisment_description" bind:value={form.communication.description} oninput={autoSave} rows="3"
                placeholder="Ex : Affiche disponible sur le Drive du club à ce lien..."
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary"></textarea>
            </div>
        </div>
        {/if}
    </section>

    <!-- OFFRE ALIMENTAIRE (dépliable) -->
    <section class="border border-dark-primary p-6">
        <div class="flex items-center justify-between">
            <span class="text-white font-semibold">Offre alimentaire ?</span>
            <Switch bind:checked={form.has_food} onChange={autoSave} />
        </div>

        {#if form.has_food}
        <div class="mt-4 space-y-4">

            <label class="flex items-center gap-3 text-white cursor-pointer">
            <input type="checkbox" bind:checked={form.food.has_caterer} onchange={autoSave} class="w-4 h-4 rounded" />
            Prestataire externe ?
            </label>

            {#if form.food.has_caterer}
            <div class="grid grid-cols-2 gap-4">
                <div>
                <label for="caterer_name" class="block text-sm text-gray-400 mb-1">Nom du prestataire</label>
                <input id="caterer_name" type="text" bind:value={form.food.caterer_name} oninput={autoSave}
                    class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
                </div>
                <div>
                <label for="caterer_siret" class="block text-sm text-gray-400 mb-1">SIRET</label>
                <input id="caterer_siret" type="text" bind:value={form.food.caterer_siret} oninput={autoSave}
                    maxlength="14" placeholder="14 chiffres"
                    class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
                </div>
            </div>
            {:else}
            <div>
                <label for="organisation" class="block text-sm text-gray-400 mb-1">Organisation (cuisine, stockage, transport...)</label>
                <textarea id="organisation" bind:value={form.food.organisation} oninput={autoSave} rows="3"
                placeholder="Explique comment vous allez préparer et gérer la nourriture..."
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary"></textarea>
            </div>

            <a href="#" target="_blank"
                class="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                📄 Télécharger la fiche d'aide (chaîne du froid, DLC, allergènes...)
            </a>
            {/if}

            <div>
            <label for="menu" class="block text-sm text-gray-400 mb-1">Menu prévu</label>
            <textarea id="menu" bind:value={form.food.menu} oninput={autoSave} rows="2"
                placeholder="Ex : pizzas, chips, boissons sans alcool..."
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary"></textarea>
            </div>

        </div>
        {/if}
    </section>



    <!-- PUBLIC EXTÉRIEURES -->
    <section class="border border-dark-primary p-6">
        <label class="flex items-center gap-3 text-white cursor-pointer font-semibold">
        <input type="checkbox" bind:checked={form.has_external_people} onchange={autoSave} class="w-4 h-4" />
        Public extérieures à l'école ?
        </label>
    </section>

    <!-- ALCOOL (dépliable) -->
    <section class="border border-dark-primary p-6">
        <div class="flex items-center justify-between">
            <span class="text-white font-semibold">Distribution d'alcool ?</span>
            <Switch bind:checked={form.alcohol.enabled} onChange={autoSave}/>
        </div>

        {#if form.alcohol.enabled}
        <div class="mt-4 space-y-6">

        <!-- Structure détentrice -->
        <div>
            <label for="ddb_owner_name" class="block text-sm text-gray-400 mb-1">Structure détentrice de la licence</label>
            <input id="ddb_owner_name" type="text" bind:value={form.alcohol.structure_licence} oninput={autoSave}
            placeholder="Nom de la structure..."
            class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
        </div>

        <!-- DDB Mairie -->
        <div class="space-y-3">
            <label class="flex items-center gap-3 text-white cursor-pointer font-medium">
            <input type="checkbox" bind:checked={form.alcohol.ddb_mairie.enabled} onchange={autoSave} class="w-4 h-4 rounded" />
            Demande de débit de boisson en mairie
            </label>

            {#if form.alcohol.ddb_mairie.enabled}
            <div class="ml-7 space-y-3">
                <div>
                <label for="ddb_mairie_date_demande" class="block text-sm text-gray-400 mb-1">Date de la demande</label>
                <input id="ddb_mairie_date_demande" type="date" bind:value={form.alcohol.ddb_mairie.date_demande} onchange={autoSave}
                    class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
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
            {/if}
        </div>

        <!-- DDB Nantes Université -->
        <div class="space-y-3">
            <label class="flex items-center gap-3 text-white cursor-pointer font-medium">
            <input type="checkbox" bind:checked={form.alcohol.ddb_nantes_universite.enabled} onchange={autoSave} class="w-4 h-4 rounded" />
            Demande d'autorisation d'occupation du domaine public Nantes Université
            </label>

            {#if form.alcohol.ddb_nantes_universite.enabled}
            <div class="ml-7 space-y-3">
                <div>
                <label for="ddb_nantes_universite_date_demande" class="block text-sm text-gray-400 mb-1">Date de la demande</label>
                <input id="ddb_nantes_universite_date_demande" type="date" bind:value={form.alcohol.ddb_nantes_universite.date_demande} onchange={autoSave}
                    class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary" />
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
            {/if}
        </div>

        <!-- Questions prévention -->
        <div class="space-y-4">
            <h3 class="text-white font-medium">Dispositifs de prévention</h3>

            {#each [
            { key: 'eau_disposition', label: 'Eau à disposition' },
            { key: 'poste_secours', label: 'Poste de secours' },
            { key: 'espace_repos', label: 'Espace repos' },
            { key: 'stand_prevention', label: 'Stand de prévention' },
            { key: 'capitaine_soiree', label: 'Dispositif Capitaine de soirée (SAM)' },
            { key: 'affichage_transports', label: 'Affichage des horaires de transport en commun nocturnes' },
            { key: 'navettes', label: 'Navettes' },
            { key: 'taxi_vtc', label: 'Taxi ou voitures avec chauffeur' },
            ] as item}
            <div class="space-y-2">
                <label class="flex items-center gap-3 text-white cursor-pointer">
                <input type="checkbox"
                    bind:checked={form.alcohol.prevention[item.key].oui}
                    onchange={autoSave}
                    class="w-4 h-4 rounded" />
                {item.label}
                </label>

                {#if form.alcohol.prevention[item.key].oui}
                <div class="ml-7">
                    <input id={item.key + "_description"} type="text"
                    bind:value={form.alcohol.prevention[item.key].description}
                    oninput={autoSave}
                    placeholder="Précise les modalités..."
                    class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary text-sm" />
                </div>
                {/if}
            </div>
            {/each}
        </div>

        </div>
        {/if}
    </section>

    
    {#if form.needs_bulle_ssi}
    {@const sudOk = form.security.cles.sud.selected}
    {@const ouestOk = form.security.cles.ouest_E9.selected || form.security.cles.ouest_S0.selected}
    {@const nordOk = form.security.cles.nord_E7.selected || form.security.cles.nord_S8.selected}
    {@const estOk = form.security.cles.est_E6.selected || form.security.cles.est_E5.selected || form.security.cles.est_E4.selected || form.security.cles.est_E3.selected || form.security.cles.est_E2_111.selected}
    {@const portOk = form.security.cles.portique_parking.selected}
    <!-- SÉCURITÉ & ACCÈS -->
    <section class="border border-yellow-600 p-6 space-y-6">
        <h2 class="text-lg font-semibold text-yellow-300 mb-1">SSI & Accès requis</h2>
        <p class="text-sm text-yellow-300 italic">Événement en dehors des horaires d'ouvertures de l'école</p>

        <!-- Clés -->
        <div class="space-y-3">
        <p class="text-sm text-gray-400">
            Sélectionne les clés dont tu as besoin. Tu dois couvrir au minimum les 4 points cardinaux + le portique.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each [
                { label: 'Nord', keys: [{ id: 'nord_E7', key: 'E7' }, { id: 'nord_S8', key: 'S8' }] },
                { label: 'Sud', keys: [{ id: 'sud', key: 'E1+110' }] },
                { label: 'Est', keys: [{ id: 'est_E6', key: 'E6' }, { id: 'est_E5', key: 'E5' }, { id: 'est_E4', key: 'E4' }, { id: 'est_E3', key: 'E3' }, { id: 'est_E2_111', key: 'E2+111' }] },
                { label: 'Ouest', keys: [{ id: 'ouest_E9', key: 'E9' }, { id: 'ouest_S0', key: 'S0' }] },
            ] as direction}
                <div>
                <p class="text-xs text-gray-500 uppercase mb-1">{direction.label}</p>
                <div class="flex flex-wrap gap-2">
                    {#each direction.keys as k}
                    <button type="button"
                        onclick={() => { form.security.cles[k.id].selected = !form.security.cles[k.id].selected; autoSave() }}
                        class="px-3 py-1.5 rounded-lg text-sm font-mono transition-colors border {form.security.cles[k.id].selected
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-dark-secondary border-dark-primary text-gray-400 hover:text-white'}">
                        {k.key}
                    </button>
                    {/each}
                </div>
                </div>
            {/each}
        </div>

        <!-- Portique parking séparé -->
        <div>
            <p class="text-xs text-gray-500 uppercase mb-1">Parking</p>
            <button type="button"
            onclick={() => { form.security.cles.portique_parking.selected = !form.security.cles.portique_parking.selected; autoSave() }}
            class="px-3 py-1.5 rounded-lg text-sm font-mono transition-colors border {form.security.cles.portique_parking.selected
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-dark-secondary border-dark-primary text-gray-400 hover:text-white'}">
            Portique parking
            </button>
        </div>

        <!-- Validation des 4 points cardinaux -->        
        {#if !sudOk || !ouestOk || !nordOk || !estOk || !portOk}
            <div class="bg-yellow-900/30 border border-yellow-600 rounded p-3 text-sm text-yellow-300">
            ⚠️ Points manquants :
            {[!sudOk && 'Sud', !ouestOk && 'Ouest', !nordOk && 'Nord', !estOk && 'Est', !portOk && 'Portique parking'].filter(Boolean).join(', ')}
            </div>
        {/if}
        </div>

        <!-- Salle SSI -->
        <div class="space-y-3">
        <div class="flex items-center justify-between">
            <h3 class="text-white font-medium">Présents dans la salle SSI</h3>
            <button type="button"
            onclick={() => { form.security.salle_ssi = [...form.security.salle_ssi, { nom: '', prenom: '', email: '' }]; autoSave() }}
            class="text-sm text-blue-400 hover:text-blue-300">
            + Ajouter une personne
            </button>
        </div>

        {#if form.security.salle_ssi.length === 0}
            <p class="text-sm text-gray-500 italic">Aucune personne ajoutée — clique sur "Ajouter" pour commencer.</p>
        {/if}

        {#each form.security.salle_ssi as personne, i}
            <div class="grid grid-cols-3 gap-3 items-start">
            <div>
                <label for={i + "_name"} class="block text-xs text-gray-400 mb-1">Nom</label>
                <input id={i + "_name"} type="text" bind:value={personne.nom} oninput={autoSave}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary text-sm" />
            </div>
            <div>
                <label for={i + "_prenom"} class="block text-xs text-gray-400 mb-1">Prénom</label>
                <input id={i + "_prenom"} type="text" bind:value={personne.prenom} oninput={autoSave}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary text-sm" />
            </div>
            <div class="flex gap-2 items-end">
                <div class="flex-1">
                <label for={i + "_email"} class="block text-xs text-gray-400 mb-1">Email</label>
                <input id={i + "_email"} type="email" bind:value={personne.email} oninput={autoSave}
                    class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary text-sm" />
                </div>
                <button type="button"
                onclick={() => { form.security.salle_ssi = form.security.salle_ssi.filter((_: unknown, j: any) => j !== i); autoSave() }}
                class="mb-0.5 text-red-400 hover:text-red-300 px-2 py-2">✕</button>
            </div>
            </div>
        {/each}
        </div>

    </section>
    {/if}

    <!-- AGENT DE SÉCURITÉ (conditionnel automatique) -->
    {#if form.needs_agent_secu}
    <section class="border border-yellow-600 p-6 space-y-6">
        <h2 class="text-lg font-semibold text-yellow-300 mb-1">Sécurité et secouristes requis</h2>
        <p class="text-sm text-yellow-300 italic">Plus de 49 personnes attendues et/ou débit de boisson</p>

        <!-- Entreprise de sécurité -->
        <div class="space-y-3">
        <h3 class="text-white font-medium">Entreprise de sécurité</h3>
        <div class="grid grid-cols-2 gap-3">
            <div>
            <label for="security_name" class="block text-xs text-gray-400 mb-1">Nom de l'entreprise</label>
            <input id="security_name" type="text" bind:value={form.agent_secu.entreprise_securite.nom} oninput={autoSave}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary text-sm" />
            </div>
            <div>
            <label for="security_siret" class="block text-xs text-gray-400 mb-1">SIRET</label>
            <input id="security_siret" type="text" bind:value={form.agent_secu.entreprise_securite.siret} oninput={autoSave}
                maxlength="14" placeholder="14 chiffres"
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary text-sm" />
            </div>
        </div>
        <FileUpload
            formId={form.id}
            documentType="agent_secu_entreprise_contrat"
            label="Devis signé avec l'entreprise de sécurité"
            currentPath={form.agent_secu.entreprise_securite.contrat_path || null}
            onuploaded={(path) => {
                form.agent_secu.entreprise_securite.contrat_path = path
                autoSave()
            }}
        />
    </div>

        <div class="border-t border-yellow-600/30 pt-6 space-y-3">
        <h3 class="text-white font-medium">Secouristes</h3>

        <label class="flex items-center gap-3 text-white cursor-pointer">
            <input type="checkbox" bind:checked={form.agent_secu.secouristes.has_organisme} onchange={autoSave} class="w-4 h-4 rounded" />
            Organisme de secouristes externe ?
        </label>

        {#if form.agent_secu.secouristes.has_organisme}
            <div class="grid grid-cols-2 gap-3">
            <div>
                <label for="secouristes_nom" class="block text-xs text-gray-400 mb-1">Nom de l'organisme</label>
                <input id="secouristes_nom" type="text" bind:value={form.agent_secu.secouristes.organisme_nom} oninput={autoSave}
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary text-sm" />
            </div>
            <div>
                <label for="secouristes_siret" class="block text-xs text-gray-400 mb-1">SIRET</label>
                <input id="secouristes_siret" type="text" bind:value={form.agent_secu.secouristes.organisme_siret} oninput={autoSave}
                maxlength="14" placeholder="14 chiffres"
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary text-sm" />
            </div>
            </div>
            <FileUpload
                formId={form.id}
                documentType="agent_secu_secouristes_devis"
                label="Devis signé avec l'organisme de secouristes"
                currentPath={form.agent_secu.secouristes.devis_path || null}
                onuploaded={(path) => {
                    form.agent_secu.secouristes.devis_path = path
                    autoSave()
                }}
            />
        {:else}
            <div>
            <label for="secouristes_dispositions" class="block text-xs text-gray-400 mb-1">Dispositions prises par le club</label>
            <textarea id="secouristes_dispositions" bind:value={form.agent_secu.secouristes.dispositions} oninput={autoSave} rows="3"
                placeholder="Décris les dispositions prises pour assurer la sécurité des participants..."
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary text-sm">
            </textarea>
            </div>
        {/if}
        </div>

    </section>
    {/if}

    <!-- Erreurs de validation serveur -->
    {#if actionErrors.length > 0}
    <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-dark-secondary border border-dark-red-accent rounded-lg p-4 max-w-md w-full shadow-lg md:ml-32">
        <h3 class="text-dark-red-accent font-bold mb-2">La fiche ne peut pas être soumise :</h3>
        <ul class="text-sm text-gray-300 space-y-1 list-disc list-inside">
            {#each actionErrors as err}<li>{err}</li>{/each}
        </ul>
        <button type="button" onclick={() => actionErrors = []}
            class="mt-3 text-xs text-gray-400 hover:text-white underline">Fermer</button>
    </div>
    {/if}

    <!-- Modals -->
    {#if showDeleteModal}
    <ConfirmModal
        title="Supprimer la fiche ?"
        description="Cette action est irréversible. Pour confirmer, écrivez <strong class='text-white font-mono'>supprimer</strong> ci-dessous."
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
        description="La fiche ne sera plus modifiable jusqu'à retour de l'administration. Pour confirmer, écrivez <strong class='text-white font-mono'>soumettre</strong> ci-dessous."
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
            {#if data.fiche.status === 'brouillon'}
            <div class="flex flex-wrap items-baseline gap-x-1">
                <p class="text-sm text-gray-400 whitespace-nowrap">A soumettre avant le</p>
                <p class={deadlineExpired ? 'text-dark-red-accent font-bold text-sm' : 'text-white font-bold text-sm'}>
                    {new Date(form.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>
            <p class="text-xs text-gray-400 mt-1">
                {needsEarlyDeadline ? '2 mois avant l\'événement' : '2 semaines avant l\'événement'}
            </p>
            {/if}
        </div>

        <div class="flex gap-3">
            <button type="button" onclick={() => showDeleteModal = true}
                class="flex-1 sm:flex-none border-3 border-dark-red-accent px-3 py-1.5 text-dark-red-accent font-bold hover:bg-dark-red-accent hover:text-white rounded transition-colors">
                Supprimer
            </button>
            {#if data.fiche.status === 'brouillon'}
            <button type="button" onclick={() => { actionErrors = []; showSubmitModal = true }}
                class="flex-1 sm:flex-none border-3 border-dark-green-accent px-3 py-1.5 text-dark-green-accent font-bold hover:bg-dark-green-accent hover:text-white rounded transition-colors">
                Soumettre
            </button>
            {:else if data.fiche.status === 'en_revision'}
            <button type="button" onclick={() => showUpdateModal = true}
                class="flex-1 sm:flex-none border-3 border-dark-green-accent px-3 py-1.5 text-dark-green-accent font-bold hover:bg-dark-green-accent hover:text-white rounded transition-colors">
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
        </form>
      </div>
    </footer>
</div>