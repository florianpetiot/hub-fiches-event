<script lang="ts">
  import { untrack } from 'svelte'
  import { fade } from 'svelte/transition'
  import { supabase } from '$lib/supabase'
  import { eventDetails } from '$lib/eventStore'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'
  import Switch from '$lib/components/Switch.svelte'
  import { enhance } from '$app/forms'

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
})))

  // Indicateur de sauvegarde
  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle')
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
          needs_agent_secu: form.needs_agent_secu,
          alcohol: form.alcohol,
          deadline: form.deadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', form.id)

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
    // needs_agent_secu : >49 personnes
    form.needs_agent_secu = (form.estimated_attendees ?? 0) > 49 || form.has_external_people || form.alcohol.enabled
    // deadline
    const needsEarlyDeadline = form.needs_agent_secu
    if (form.event_date) {
      const eventDate = new Date(form.event_date)
      const deadline = new Date(eventDate)
      deadline.setMonth(deadline.getMonth() - (needsEarlyDeadline ? 2 : 0))
      if (!needsEarlyDeadline) deadline.setDate(deadline.getDate() - 14)
      form.deadline = deadline.toISOString().split('T')[0]
    }
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
    let actionErrors = $state<string[]>([])

    let deleteFormEl = $state<HTMLFormElement>()
    let submitFormEl = $state<HTMLFormElement>()

    function deleteFiche() {
        showDeleteModal = false
        deleteFormEl?.requestSubmit()
    }

    function submitFiche() {
        showSubmitModal = false
        actionErrors = []
        submitFormEl?.requestSubmit()
    }
</script>

<div class="sticky top-0 z-30 bg-dark-terciary py-4 px-4 flex items-center justify-between">
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

<div class="flex flex-col min-h-screen space-y-6 max-w-3xl mx-auto pb-18">

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



    <!-- PERSONNES EXTÉRIEURES -->
    <section class="border border-dark-primary p-6">
        <label class="flex items-center gap-3 text-white cursor-pointer font-semibold">
        <input type="checkbox" bind:checked={form.has_external_people} onchange={autoSave} class="w-4 h-4" />
        Personnes extérieures à l'école ?
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
                <p class="text-sm text-gray-400 italic">Upload de l'autorisation mairie (bientôt disponible)</p>
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
                <p class="text-sm text-gray-400 italic">Upload de l'autorisation Nantes Université (bientôt disponible)</p>
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
    <!-- SÉCURITÉ -->
    <section class="border border-dark-primary p-6 space-y-4">
        <h2 class="text-lg font-semibold text-white">Sécurité & Accès</h2>
        <div>
            <label for="security_notes" class="block text-sm text-gray-400 mb-1">Notes sécurité (clés, badges, portes)</label>
            <textarea id="security_notes" bind:value={form.security_notes} oninput={autoSave} rows="3"
                class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary">
            </textarea>
        </div>
    </section>

    <!-- BULLE SSI (conditionnel automatique) -->
    <section class="border border-dark-primary p-6">
        <h2 class="text-lg font-semibold text-white mb-2">Bulle SSI requise</h2>
        <p class="text-sm text-gray-400 mb-4">
            Ton événement se termine après 20h ou a lieu le weekend — une Bulle SSI est obligatoire.
        </p>
        <p class="text-sm text-gray-400">Upload de la Bulle SSI (bientôt disponible)</p>
    </section>
    {/if}

    <!-- AGENT DE SÉCURITÉ (conditionnel automatique) -->
    {#if form.needs_agent_secu}
    <section class="bg-yellow-900/30 border border-yellow-600 p-6">
        <h2 class="text-lg font-semibold text-yellow-300 mb-2">⚠️ Agent de sécurité requis</h2>
        <p class="text-sm text-yellow-300">
            Plus de 49 personnes attendues — un agent de sécurité est obligatoire.
        </p>
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

    <footer class="fixed bottom-0 left-0 w-full z-40 md:pl-64">
      <div class="bg-dark-secondary p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-3xl mx-auto">
        <div>
          <div class="flex flex-wrap items-baseline gap-x-2">
            <p class="text-sm text-gray-400 whitespace-nowrap">A soumettre avant le</p>
            <p class="text-white font-bold text-sm">
              {new Date(form.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <p class="text-xs text-gray-400 mt-1">
            {form.alcohol.enabled || form.needs_agent_secu || form.has_external_people ? '2 mois avant l\'événement' : '2 semaines avant l\'événement'}
          </p>
        </div>

        <div class="flex gap-3">
            {#if data.fiche.status === 'brouillon'}
            <button type="button" onclick={() => showDeleteModal = true}
                class="flex-1 sm:flex-none border-3 border-dark-red-accent px-3 py-1.5 text-dark-red-accent font-bold hover:bg-dark-red-accent hover:text-white rounded transition-colors">
                Supprimer
            </button>
            <button type="button" onclick={() => { actionErrors = []; showSubmitModal = true }}
                class="flex-1 sm:flex-none border-3 border-dark-green-accent px-3 py-1.5 text-dark-green-accent font-bold hover:bg-dark-green-accent hover:text-white rounded transition-colors">
                Soumettre
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
      </div>
    </footer>
</div>