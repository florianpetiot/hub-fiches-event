<script lang="ts">
  import type { PageData } from './$types'
  import Row from '$lib/components/Row.svelte'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'
  import MessageModal from '$lib/components/MessageModal.svelte'
  import { enhance } from '$app/forms'

  let { data }: { data: PageData } = $props()

  // derive a reactive alias for convenience
  let f = $derived(data.fiche)

  let role = $derived(data.profile?.role)

  const statusLabel: Record<string, string> = {
    brouillon: 'Brouillon',
    soumise: 'En attente de validation',
    en_revision: 'En révision',
    validee: 'Validée',
    refusee: 'Refusée'
  }

  const categoryLabel: Record<string, string> = {
    soiree: 'Soirée',
    tournoi: 'Tournoi sportif',
    conference: 'Conférence',
    atelier: 'Atelier',
    autre: 'Autre'
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const equipmentLabels: Record<string, string> = {
    tables: 'Tables', chaises: 'Chaises', panneaux: 'Panneaux',
    rallonges: 'Rallonges', multiprises: 'Multiprises'
  }

  let equipmentList = $derived(f.equipment
    ? Object.entries(equipmentLabels)
        .filter(([key]) => (f.equipment[key] ?? 0) > 0)
        .map(([key, label]) => `${label} : ${f.equipment[key]}`)
    : [])

  let hasEquipment = $derived(equipmentList.length > 0 || f.equipment?.autre?.trim())

  const communicationLabels: Record<string, string> = {
    mur_ecrans: "Mur d'écrans bâtiment Ireste",
    intranet: 'Intranet – Sites Polytech',
    reseaux_sociaux: 'Réseaux sociaux (Meta – LinkedIn – Instagram)',
    newsletter: 'Newsletter Polytech'
  }

  let communicationList = $derived(f.communication
    ? Object.entries(communicationLabels).filter(([key]) => f.communication[key])
    : [])

  const preventionLabels: Record<string, string> = {
    eau_disposition: 'Eau à disposition',
    poste_secours: 'Poste de secours',
    espace_repos: 'Espace repos',
    stand_prevention: 'Stand de prévention',
    capitaine_soiree: 'Dispositif Capitaine de soirée (SAM)',
    affichage_transports: 'Affichage des horaires de transport nocturnes',
    navettes: 'Navettes',
    taxi_vtc: 'Taxi ou voitures avec chauffeur'
  }

  let showRefuseModal = $state(false)
  let showValidateModal = $state(false)
  let showReviewModal = $state(false)
  let reviewMessage = $state('')

  let refuseFormEl = $state<HTMLFormElement>()
  let validateFormEl = $state<HTMLFormElement>()
  let reviewFormEl = $state<HTMLFormElement>()

  function refuseFiche() {
    showRefuseModal = false
    refuseFormEl?.requestSubmit()
  }

  function validateFiche() {
    showValidateModal = false
    validateFormEl?.requestSubmit()
  }

  function reviewFiche(message: string) {
    reviewMessage = message
    showReviewModal = false
    setTimeout(() => {
      reviewFormEl?.requestSubmit()
  })
}

</script>

<div class="sticky top-0 z-20 bg-dark-terciary py-4 px-4 flex items-center justify-between">
  <h1 class="text-2xl font-bold text-white">Résumé de la fiche event</h1>
</div>

<div class="flex flex-col min-h-screen space-y-6 max-w-3xl mx-auto pb-18">

  <!-- INFOS GÉNÉRALES -->
  <section class="bg-dark-secondary rounded-lg p-6 space-y-3">
    <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Informations générales</h2>

    <div class="flex gap-6">
      <Row label="Événement" value={f.title} />
      <Row label="Catégorie" value={categoryLabel[f.category] ?? f.category} />
    </div>
    <Row label="Lieu" value={f.location} />

    <div class="flex gap-6">
      <Row label="Début" value="{formatDate(f.event_date)} à {f.event_start_time}" />
      {#if f.event_end_date && f.event_end_date !== f.event_date}
        <Row label="Fin" value="{formatDate(f.event_end_date)} à {f.event_end_time}" />
      {:else}
        <Row label="Fin" value={f.event_end_time} />
      {/if}
    </div>

    {#if f.description}
      <Row label="Description" value={f.description} />
    {/if}

    <div class="flex gap-6">
      <Row label="Budget" value="{f.budget} €" />
      <Row label="Participants estimés" value={String(f.estimated_attendees)} />
    </div>

    {#if f.has_external_people}
      <p class="text-yellow-400 text-sm">⚠️ Présence de personnes extérieures à l'école</p>
    {/if}
  </section>

  <!-- RESPONSABLES -->
  <section class="bg-dark-secondary rounded-lg p-6 space-y-4">
    <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Responsables</h2>
    {#each [
      { data: f.responsible_prevention, label: 'Prévention' },
      { data: f.responsible_security, label: 'Sécurité' },
      { data: f.responsible_organisation, label: 'Organisation' },
    ] as resp}
      {#if resp.data?.nom}
        <div>
          <p class="text-gray-400 text-xs uppercase mb-1">{resp.label}</p>
          <p class="text-white text-sm">{resp.data.prenom} {resp.data.nom} — {resp.data.departement}</p>
          <p class="text-gray-400 text-sm">{resp.data.email}</p>
        </div>
      {/if}
    {/each}
  </section>

  <!-- MATÉRIEL -->
  {#if f.needs_equipment && hasEquipment}
    <section class="bg-dark-secondary rounded-lg p-6 space-y-3">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Matériel demandé</h2>
      {#each equipmentList as item}
        <p class="text-white text-sm">• {item}</p>
      {/each}
      {#if f.equipment?.autre?.trim()}
        <Row label="Autre" value={f.equipment.autre} />
      {/if}
    </section>
  {/if}

  <!-- COMMUNICATION -->
  {#if f.needs_communication && communicationList.length > 0}
    <section class="bg-dark-secondary rounded-lg p-6 space-y-3">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Communication</h2>
      {#each communicationList as [_, label]}
        <p class="text-white text-sm">• {label}</p>
      {/each}
      {#if f.communication?.description?.trim()}
        <Row label="Contenu à diffuser" value={f.communication.description} />
      {/if}
    </section>
  {/if}

  <!-- ALIMENTATION -->
  {#if f.has_food}
    <section class="bg-dark-secondary rounded-lg p-6 space-y-3">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Offre alimentaire</h2>
      {#if f.food?.has_caterer}
        <div class="flex gap-6">
          <Row label="Prestataire" value={f.food.caterer_name} />
          <Row label="SIRET" value={f.food.caterer_siret} />
        </div>
      {:else if f.food?.organisation}
        <Row label="Organisation" value={f.food.organisation} />
      {/if}
      {#if f.food?.menu}
        <Row label="Menu prévu" value={f.food.menu} />
      {/if}
    </section>
  {/if}



  <!-- SÉCURITÉ -->
  {#if f.security_notes?.trim()}
    <section class="bg-dark-secondary rounded-lg p-6 space-y-3">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Sécurité & Accès</h2>
      <Row label="Notes" value={f.security_notes} />
    </section>
  {/if}

  <!-- BULLE SSI -->
  {#if f.needs_bulle_ssi}
    <section class="bg-dark-secondary rounded-lg p-6">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2 mb-3">Bulle SSI</h2>
      <p class="text-gray-400 text-sm">Document requis — en attente d'upload</p>
    </section>
  {/if}

  <!-- AGENT DE SÉCURITÉ -->
  {#if f.needs_agent_secu}
    <section class="bg-yellow-900/30 border border-yellow-600 rounded-lg p-6">
      <p class="text-yellow-300 font-semibold">⚠️ Agent de sécurité requis (+49 personnes)</p>
    </section>
  {/if}

  <!-- ALCOOL -->
  {#if f.alcohol?.enabled}
    <section class="bg-dark-secondary rounded-lg p-6 space-y-3">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Débit de boisson</h2>

      {#if f.alcohol.structure_licence}
        <Row label="Structure détentrice" value={f.alcohol.structure_licence} />
      {/if}

      {#if f.alcohol.ddb_mairie?.enabled}
        <Row label="DDB Mairie — date de demande" value={formatDate(f.alcohol.ddb_mairie.date_demande)} />
      {/if}

      {#if f.alcohol.ddb_nantes_universite?.enabled}
        <Row label="DDB Nantes Université — date de demande" value={formatDate(f.alcohol.ddb_nantes_universite.date_demande)} />
      {/if}

      {#if Object.entries(f.alcohol.prevention ?? {}).filter(([_, v]: any) => v.oui).length > 0}
        {@const activeDevices = Object.entries(f.alcohol.prevention ?? {}).filter(([_, v]: any) => v.oui) as [string, { oui: boolean; description?: string }][]}
        <div>
          <p class="text-gray-400 text-xs uppercase mb-2">Dispositifs de prévention</p>
          {#each activeDevices as [key, val]}
            <div class="mb-2 flex items-center">
              <p class="text-white text-sm">• {preventionLabels[key]}</p>
              {#if val.description?.trim()}
                <p class="text-white text-sm ml-1"> - {val.description}</p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}


  <!-- Modals -->
  {#if showRefuseModal}
  <ConfirmModal
      title="Refuser la fiche ?"
      description="Cette action est irréversible. Pour confirmer, écrivez <strong class='text-white font-mono'>refuser</strong> ci-dessous."
      confirmWord="refuser"
      confirmLabel="Refuser définitivement"
      accentColor="red"
      onconfirm={refuseFiche}
      oncancel={() => showRefuseModal = false}
  />
  {/if}

  {#if showValidateModal}
  <ConfirmModal
      title="Valider la fiche ?"
      description="La fiche event sera validée définitivement. Pour confirmer, écrivez <strong class='text-white font-mono'>valider</strong> ci-dessous."
      confirmWord="valider"
      confirmLabel="Valider définitivement"
      accentColor="green"
      onconfirm={validateFiche}
      oncancel={() => showValidateModal = false}
  />
  {/if}

  {#if showReviewModal}
  <MessageModal
      title="Demander une révision"
      description="Rédigez un message à l'attention du club pour expliquer les raisons de votre demande de révision. La fiche event ne sera pas modifiée tant que le club n'aura pas soumis une nouvelle version."
      placeholder="Votre message au club..."
      confirmLabel="Envoyer"
      accentColor="orange"
      onconfirm={reviewFiche}
      oncancel={() => showReviewModal = false}
  />
  {/if}



  <footer class="fixed bottom-0 left-0 w-full z-20 md:pl-64 mb-0">
    <div class="bg-dark-secondary p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-3xl mx-auto">
      <div>
        {#if role === 'club'}
          {#if f.status === 'refusee'}
            <p class="text-white text-sm">Votre fiche event a été <span class="text-dark-red-accent font-bold">refusée</span></p>
          {:else if f.status === 'validee'}
            <p class="text-white text-sm">Votre fiche event a été <span class="text-dark-green-accent font-bold">validée</span></p>
          {:else if f.status === 'en_revision'}
          <p class="text-gray-400 text-sm">Veuillez proposer une nouvelle version<br>de votre fiche event</p>
          {:else}
          <p class="text-gray-400 text-sm">Votre fiche event est<br>en cours de relecture</p>
          {/if}
        {:else}
          <p class="text-gray-400 text-sm">Événement prévu dans</p>
          <p class="text-white text-lg font-bold">{Math.max(0, Math.ceil((new Date(f.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} jours</p>
        {/if}
      </div>
      
      {#if role === 'club'}
        <div>
          <p class="text-gray-400 text-sm text-end">Événement prévu dans</p>
          <p class="text-white text-lg font-bold text-end">{Math.max(0, Math.ceil((new Date(f.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} jours</p>
        </div>
      {:else}
        {#if f.status === 'soumise'}
        <div class="flex gap-3">
          <button type="button" onclick={() => showRefuseModal = true}
            class="flex-1 sm:flex-none border-3 border-dark-red-accent px-3 py-1.5 text-dark-red-accent font-bold hover:bg-dark-red-accent hover:text-white rounded transition-colors">
            Refuser
          </button>
          <button type="button" onclick={() => showReviewModal = true}
            class="flex-1 sm:flex-none border-3 border-dark-orange-accent px-3 py-1.5 text-dark-orange-accent font-bold hover:bg-dark-orange-accent hover:text-black rounded transition-colors">
            Demander une révision
          </button>
          <button type="button" onclick={() => showValidateModal = true}
            class="flex-1 sm:flex-none border-3 border-dark-green-accent px-3 py-1.5 text-dark-green-accent font-bold hover:bg-dark-green-accent hover:text-white rounded transition-colors">
            Valider
          </button>
        </div>
        {:else if f.status === 'refusee'}
        <p class="text-white text-sm">Cette fiche event a été <span class="text-dark-red-accent font-bold">refusée</span></p>
        {:else if f.status === 'validee'}
        <p class="text-white text-sm">Cette fiche event a été <span class="text-dark-green-accent font-bold">validée</span></p>
        {:else if f.status === 'en_revision'}
        <p class="text-gray-400 text-sm">Cette fiche event est en cours de révision</p>
        {/if}
      {/if}

    </div>
  </footer>

  <form bind:this={refuseFormEl} method="POST" action="?/refuser" use:enhance class="hidden"></form>
  <form bind:this={validateFormEl} method="POST" action="?/valider" use:enhance class="hidden"></form>
  <form bind:this={reviewFormEl} method="POST" action="?/demander_revision" use:enhance class="hidden">
    <input type="hidden" name="message" value={reviewMessage} />
   </form>

  
</div>