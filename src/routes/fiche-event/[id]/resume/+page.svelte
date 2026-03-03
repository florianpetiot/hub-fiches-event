<script lang="ts">
  import type { PageData } from './$types'
  import Row from '$lib/components/Row.svelte'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'
  import MessageModal from '$lib/components/MessageModal.svelte'
  import { enhance } from '$app/forms'
	import PdfViewer from '$lib/components/PdfViewer.svelte';
	import { formatDateSmart } from '$lib/date';

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

  let equipmentList = $derived(f.equipment
    ? Object.entries(f.equipment)
        .filter(([_, value]) => ((value as number) ?? 0 ) > 0)
        .map(([key, value]) => `${key} : ${value}`)
    : [])

  let hasEquipment = $derived(equipmentList.length > 0)


  let communicationList = $derived(f.communication
    ? Object.entries(f.communication).filter(([key, value]) => key !== 'description' && value === true)
    : [])

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


<div class="flex flex-col min-h-screen">
  
  <div class="sticky top-0 z-20 bg-dark-terciary py-4 flex items-center justify-between gap-2 print:hidden">
    <h1 class="text-2xl font-bold text-white">Résumé de la fiche event</h1>
      <button type="button" onclick={() => window.print()}
      class="flex items-center gap-2 text-sm text-gray-400 hover:text-white active:text-white border border-dark-primary hover:border-gray-500 active:border-gray-500 px-3 py-1.5 rounded-lg transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      <span class="hidden md:inline">Exporter PDF</span>
      <span class="md:hidden">PDF</span>
    </button>
  </div>
  
  <div class="hidden print:block mb-6">
    <h1 class="text-2xl font-bold text-black">{f.title}</h1>
    <p class="text-gray-600 text-sm mt-1">
      Fiche event — {f.profiles.name ?? ''} — Statut : {statusLabel[f.status]}
    </p>
    <p class="text-gray-400 text-xs mt-0.5">
      Exporté le {formatDateSmart(new Date().toISOString(), { day: 'numeric', month: 'long', year: 'numeric' })}
    </p>
    <hr class="mt-3 border-gray-300" />
  </div>

  <!-- div principale -->
  <div class="w-full max-w-3xl mx-auto space-y-6 mb-6">
    <!-- INFOS GÉNÉRALES -->
    <section class="bg-dark-secondary rounded-lg p-6 space-y-3">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Informations générales</h2>

      <div class="flex gap-6">
        <Row label="Événement" value={f.title} />
        <Row label="Catégorie" value={f.category} />
      </div>

      <div class="flex gap-6">
        <Row label="Organisateur" value={f.profiles.name} />
        <Row label="Lieu" value={f.location} />
      </div>

      <div class="flex gap-6">
        <Row label="Début" value="{formatDateSmart(f.event_date, { day: 'numeric', month: 'long', year: 'numeric' })} à {f.event_start_time.slice(0, 5).replace(':', 'h')}" />
        {#if f.event_end_date && f.event_end_date !== f.event_date}
          <Row label="Fin" value="{formatDateSmart(f.event_end_date, { day: 'numeric', month: 'long', year: 'numeric' })} à {f.event_end_time.slice(0, 5).replace(':', 'h')}" />
        {:else}
          <Row label="Fin" value={f.event_end_time.slice(0, 5).replace(':', 'h')} />
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
        <div class="grid grid-cols-2 gap-2">
          {#each equipmentList as item}
            <p class="text-white text-sm">• {item}</p>
          {/each}
        </div>
      </section>
    {/if}

    <!-- COMMUNICATION -->
    {#if f.needs_communication && communicationList.length > 0}
      <section class="bg-dark-secondary rounded-lg p-6 space-y-3">
        <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Communication</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          {#each communicationList as [canal, _]}
            <p class="text-white text-sm">• {canal}</p>
          {/each}
        </div>
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

      <!-- ALCOOL -->
    {#if f.alcohol?.enabled}
      <section class="bg-dark-secondary rounded-lg p-6 space-y-3">
        <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Débit de boisson</h2>

        {#if f.alcohol.structure_licence}
          <Row label="Structure détentrice" value={f.alcohol.structure_licence} />
        {/if}

        <Row label="DDB Mairie — date de demande" value={formatDateSmart(f.alcohol.ddb_mairie.date_demande, { day: 'numeric', month: 'long', year: 'numeric' })} />
        <PdfViewer
          path={f.alcohol.ddb_mairie.autorisation_path}
          label="Voir l'autorisation mairie"
        />

        <Row label="DDB Nantes Université — date de demande" value={formatDateSmart(f.alcohol.ddb_nantes_universite.date_demande, { day: 'numeric', month: 'long', year: 'numeric' })} />
        <PdfViewer
          path={f.alcohol.ddb_nantes_universite.autorisation_path!}
          label="Voir l'autorisation Nantes Université"
        />

        {#if f.alcohol?.prevention && f.alcohol.prevention.filter((p: any) => p.selected).length > 0}
          {@const activeDevices = (f.alcohol.prevention as { titre: string; selected: boolean }[]).filter(p => p.selected)}

          <div>
            <p class="text-gray-400 text-xs uppercase mb-2">Dispositifs de prévention</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              {#each activeDevices as dev}
                <div class="mb-1">
                  <p class="text-white text-sm">• {dev.titre}</p>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </section>
    {/if}

    <!-- BULLE SSI -->
    {#if f.needs_bulle_ssi}
      <section class="bg-dark-secondary border border-yellow-600 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2 mb-3">Accès & SSI</h2>
        <p class="text-gray-400 text-xs uppercase mb-2">Clés demandées</p>
        {#if f.security?.cles}
          {@const selectedKeys = (Object.values(f.security.cles) as { key: string; selected: boolean }[][])
            .flat()
            .filter(cle => cle.selected)
            .map(cle => cle.key)}
          {#if selectedKeys.length > 0}
            <p class="text-white text-sm">{selectedKeys.join(', ')}</p>
          {:else}
            <p class="text-gray-500 text-sm italic">Aucune clé sélectionnée</p>
          {/if}
        {/if}

        {#if f.security?.salle_ssi && f.security.salle_ssi.length > 0}
          <div class="mt-4">
            <p class="text-gray-400 text-xs uppercase mb-2">Présents dans la salle SSI</p>
            {#each f.security.salle_ssi as pers}
              <p class="text-white text-sm">• {pers.prenom} {pers.nom}<span class="text-gray-400 pl-1">- {pers.email}</span></p>
            {/each}
          </div>
        {/if}
      </section>
    {/if}

    <!-- AGENT DE SÉCURITÉ -->
    {#if f.needs_agent_secu}
      <section class="bg-dark-secondary border border-yellow-600 rounded-lg p-6">
        <p class="text-lg font-semibold text-white border-b border-dark-primary pb-2 mb-3">Agent de sécurité requis</p>

        {#if f.agent_secu?.entreprise_securite && (f.agent_secu.entreprise_securite.nom || f.agent_secu.entreprise_securite.siret || f.agent_secu.entreprise_securite.devis_path)}
          <div>
            <p class="text-gray-400 text-xs uppercase mb-2">Prestataire de sécurité</p>
            <div class="flex gap-6">
              {#if f.agent_secu.entreprise_securite.nom}
                <Row label="Entreprise" value={f.agent_secu.entreprise_securite.nom} />
              {/if}
              {#if f.agent_secu.entreprise_securite.siret}
                <Row label="SIRET" value={f.agent_secu.entreprise_securite.siret} />
              {/if}
            </div>
            {#if f.agent_secu.entreprise_securite.devis_path}
              <PdfViewer
                path={f.agent_secu.entreprise_securite.devis_path}
                label="Voir le devis de sécurité"
                docTitle={`Devis de l'entreprise de sécurité - ${f.title} - ${formatDateSmart(f.event_date, { day: 'numeric', month: 'long', year: 'numeric' })} - ${f.profiles.name}`}
              />
            {/if}
          </div>
        {/if}

        {#if f.agent_secu?.secouristes}
          <div>
            <p class="text-gray-400 text-xs uppercase mb-2">Secouristes</p>
            {#if f.agent_secu.secouristes.has_organisme}
              <div class="flex gap-6">
                {#if f.agent_secu.secouristes.organisme_nom}
                  <Row label="Organisme" value={f.agent_secu.secouristes.organisme_nom} />
                {/if}
                {#if f.agent_secu.secouristes.organisme_siret}
                  <Row label="SIRET" value={f.agent_secu.secouristes.organisme_siret} />
                {/if}
              </div>
              {#if f.agent_secu.secouristes.organisme_devis_path}
                <PdfViewer
                  path={f.agent_secu.secouristes.organisme_devis_path}
                  label="Voir le devis des secouristes"
                  docTitle={`Devis des secouristes - ${f.title} - ${formatDateSmart(f.event_date, { day: 'numeric', month: 'long', year: 'numeric' })} - ${f.profiles.name}`}
                />
              {/if}
            {:else}
              {#if f.agent_secu.secouristes.dispositions}
                <Row label="Dispositions prises" value={f.agent_secu.secouristes.dispositions} />
              {/if}
            {/if}
          </div>
        {/if}

      </section>
    {/if}

  </div>

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
      description="Rédigez un message à l'attention du club pour expliquer les raisons de votre demande de révision. Le club devra modifier sa fiche event pour pouvoir délibérer à nouveau."
      placeholder="Votre message au club..."
      confirmLabel="Envoyer"
      accentColor="orange"
      onconfirm={reviewFiche}
      oncancel={() => showReviewModal = false}
  />
  {/if}

  <footer class="sticky bottom-0 w-full z-20 mb-0 mt-auto max-w-3xl mx-auto @container print:hidden">
    <div class="bg-dark-secondary p-4 flex {role !== 'club' && f.status === 'soumise' ? 'flex-col @[36rem]:flex-row @[36rem]:items-center @[36rem]:justify-between' : 'flex-row items-center justify-between'} border-t-2 border-x-2 rounded-t border-dark-primary gap-3">
      <div>
        {#if role === 'club'}
          {#if f.status === 'refusee'}
            <p class="text-white text-sm">Votre fiche event a été <span class="text-dark-red-accent font-bold">refusée</span></p>
          {:else if f.status === 'validee'}
            <p class="text-white text-sm">Votre fiche event a été <span class="text-dark-green-accent font-bold">validée</span></p>
          {:else if f.status === 'en_revision'}
          <p class="text-gray-400 text-sm">⚠️ Veuillez sauvegarder une nouvelle version<br>de votre fiche event dans l'onglet <a href="./edition" class="text-blue-400 hover:underline active:underline">Édition</a></p>
          {:else}
          <p class="text-gray-400 text-sm">Votre fiche event est<br>en cours de relecture</p>
          {/if}
        {:else}
          <p class="text-gray-400 text-sm">Événement prévu dans</p>
          <p class="text-white text-lg font-bold">{Math.max(0, Math.ceil((new Date(f.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} jours</p>
        {/if}
      </div>
      
      {#if role === 'club'}
        <div class="text-end">
          <p class="text-gray-400 text-sm">Événement prévu dans</p>
          <p class="text-white text-lg font-bold">{Math.max(0, Math.ceil((new Date(f.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} jours</p>
        </div>
      {:else}
        {#if f.status === 'soumise'}
        <div class="flex gap-3">
          {#if role === 'secretaire_generale'}
          <button type="button" onclick={() => showRefuseModal = true}
            class="text-center @[36rem]:whitespace-nowrap grow @[36rem]:grow-0 border-3 border-dark-red-accent px-3 py-1.5 text-dark-red-accent font-bold hover:bg-dark-red-accent active:bg-dark-red-accent hover:text-white active:text-white rounded transition-colors">
            <svg class="w-5 h-5 mx-auto @[21rem]:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <span class="hidden @[21rem]:inline">Refuser</span>
          </button>
          {/if}
          <button type="button" onclick={() => showReviewModal = true}
            class="text-center @[36rem]:whitespace-nowrap grow @[36rem]:grow-0 border-3 border-dark-orange-accent px-3 py-1.5 text-dark-orange-accent font-bold hover:bg-dark-orange-accent active:bg-dark-orange-accent hover:text-black active:text-black rounded transition-colors">
            <svg class="w-5 h-5 mx-auto @[21rem]:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 12h14"/>
            </svg>
            <span class="hidden @[21rem]:inline">Demander une révision</span>
          </button>
          {#if role === 'secretaire_generale'}
          <button type="button" onclick={() => showValidateModal = true}
            class="text-center @[36rem]:whitespace-nowrap grow @[36rem]:grow-0 border-3 border-dark-green-accent px-3 py-1.5 text-dark-green-accent font-bold hover:bg-dark-green-accent active:bg-dark-green-accent hover:text-white active:text-white rounded transition-colors">
            <svg class="w-5 h-5 mx-auto @[21rem]:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="hidden @[21rem]:inline">Valider</span>
          </button>
          {/if}
        </div>
        {:else if f.status === 'refusee'}
        <p class="text-white text-sm text-end">Cette fiche event a été <span class="text-dark-red-accent font-bold">refusée</span></p>
        {:else if f.status === 'validee'}
        <p class="text-white text-sm text-end">Cette fiche event a été <span class="text-dark-green-accent font-bold">validée</span></p>
        {:else if f.status === 'en_revision'}
        <p class="text-gray-400 text-sm text-end">Cette fiche event est en cours de révision</p>
        {/if}
      {/if}

    </div>
  </footer>

  <form bind:this={refuseFormEl} method="POST" action="?/refuser" use:enhance class="hidden print:hidden"></form>
  <form bind:this={validateFormEl} method="POST" action="?/valider" use:enhance class="hidden print:hidden"></form>
  <form bind:this={reviewFormEl} method="POST" action="?/demander_revision" use:enhance class="hidden print:hidden">
    <input type="hidden" name="message" value={reviewMessage} />
   </form>

</div>

<style>
  @media print {
    /* Fond blanc partout */
    :global(body) {
      background: white !important;
    }

    /* Sections : fond blanc, bordure grise */
    :global(section) {
      background: white !important;
      border: 1px solid #ddd !important;
      break-inside: avoid;
    }

    /* Textes : noir ou gris foncé */
    :global(.text-white) { color: #111 !important; }
    :global(.text-gray-400) { color: #555 !important; }
    :global(.text-gray-500) { color: #666 !important; }
    :global(.text-yellow-400) { color: #b45309 !important; }
    :global(.text-yellow-300) { color: #b45309 !important; }
    :global(.text-green-400) { color: #166534 !important; }
    :global(.text-red-400) { color: #991b1b !important; }
    :global(.text-blue-400) { color: #1d4ed8 !important; }

    /* Bordures */
    :global(.border-dark-primary) { border-color: #ddd !important; }
    :global(.border-yellow-600) { border-color: #d97706 !important; }

    /* Sidebar du layout cachée */
    :global(aside) { display: none !important; }
    :global(header) { display: none !important; }

    /* Marges d'impression */
    :global(main) {
      margin-left: 0 !important;
      padding: 1rem !important;
    }

    /* En-tête PDF généré par le navigateur */
    @page {
      margin: 1.5cm;
    }
  }
</style>