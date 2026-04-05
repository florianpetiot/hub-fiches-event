<script lang="ts">
  import { untrack } from 'svelte'
  import type { PageData } from './$types'
  import Row from '$lib/components/Row.svelte'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'
  import MessageModal from '$lib/components/MessageModal.svelte'
  import { enhance } from '$app/forms'
	import PdfViewer from '$lib/components/PdfViewer.svelte'
	import { formatDateSmart } from '$lib/date'

  let { data }: { data: PageData } = $props()

  type ResumeResolvedData = {
    fiche: any
    signatures: any[]
  }

  function isPromise<T>(value: unknown): value is Promise<T> {
    return !!value && typeof (value as { then?: unknown }).then === 'function'
  }

  function createResumeState(resolved?: Partial<ResumeResolvedData> | null): ResumeResolvedData {
    const fiche = resolved?.fiche ?? {}
    const profileName = fiche?.profiles?.name ?? ''

    return {
      fiche: {
        status: '',
        event_date: '',
        event_start_time: '',
        event_end_time: '',
        ...fiche,
        profiles: {
          name: profileName
        }
      },
      signatures: Array.isArray(resolved?.signatures) ? resolved.signatures : []
    }
  }

  const initialResumeData: unknown = untrack(() => data.resumeData)
  const initialResumePending = isPromise<ResumeResolvedData>(initialResumeData)

  let resumeLoading = $state(initialResumePending)
  let resumeError = $state('')
  let resumeData = $state<ResumeResolvedData>(
    !initialResumePending && initialResumeData
      ? createResumeState(initialResumeData as ResumeResolvedData)
      : createResumeState()
  )

  $effect(() => {
    const source: unknown = data.resumeData

    if (isPromise<ResumeResolvedData>(source)) {
      resumeLoading = true
      resumeError = ''

      source
        .then((resolved) => {
          resumeData = createResumeState(resolved)
        })
        .catch((err) => {
          console.error('Erreur lors du chargement du résumé:', err)
          resumeError = 'Impossible de charger le résumé de la fiche.'
          resumeData = createResumeState()
        })
        .finally(() => {
          resumeLoading = false
        })

      return
    }

    resumeData = createResumeState(source as ResumeResolvedData)
    resumeError = ''
    resumeLoading = false
  })

  let f = $derived(resumeData.fiche)
  let signatures = $derived(resumeData.signatures)
  const sortedSignatures = $derived(
    [...signatures].sort((a: any, b: any) => (a.workflow_etapes?.ordre ?? 0) - (b.workflow_etapes?.ordre ?? 0))
  )

  let myRole = $derived(data.profile?.roles?.name)

  const maSignature = $derived(
    signatures.find((s: any) =>
      s.workflow_etapes?.roles?.name === myRole
    )
  )

  const monTour = $derived.by(() => {
    if (!maSignature || maSignature.status === 'signe') return false;
    
    return signatures
      ?.filter((s: any) => s.ordre_relatif < maSignature.ordre_relatif)
      ?.every((s: any) => s.status === 'signe') ?? true;
  })

  
  const peutSigner = $derived(monTour && f.status === 'soumise')
  const peutDemanderRevision = $derived(
    f.status === 'soumise' && (myRole === 'direction' || monTour)
  )
  const peutRefuser = $derived(f.status === 'soumise' && myRole === 'direction')

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
  let showSignModal = $state(false)
  let showReviewModal = $state(false)
  let showMobileSignatures = $state(false)
  let reviewMessage = $state('')

  let refuseFormEl = $state<HTMLFormElement>()
  let signFormEl = $state<HTMLFormElement>()
  let reviewFormEl = $state<HTMLFormElement>()

  function refuseFiche() {
    showRefuseModal = false
    refuseFormEl?.requestSubmit()
  }

  function signFiche() {
    showSignModal = false
    signFormEl?.requestSubmit()
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
      <span class="hidden md:inline">Exporter en PDF</span>
      <span class="md:hidden">PDF</span>
    </button>
  </div>

  {#if resumeError}
    <div class="max-w-3xl mx-auto mt-4 rounded border border-dark-red-accent bg-dark-secondary px-4 py-3 text-sm text-dark-red-accent">
      {resumeError}
    </div>
  {:else if resumeLoading}
    <div class="w-full max-w-3xl mx-auto space-y-6 mb-6 pt-4 skeleton-fade-in">
      {#each [1, 2, 3, 4] as i}
        <section class="bg-dark-secondary rounded-lg p-6 space-y-3 animate-pulse">
          <div class="h-5 w-56 bg-dark-primary rounded"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="h-9 w-full bg-dark-primary rounded"></div>
            <div class="h-9 w-full bg-dark-primary rounded"></div>
          </div>
          <div class="h-9 w-full bg-dark-primary rounded"></div>
          {#if i % 2 === 0}
            <div class="h-16 w-full bg-dark-primary rounded"></div>
          {/if}
        </section>
      {/each}

      <div class="bg-dark-secondary rounded-lg p-4 border border-dark-primary animate-pulse">
        <div class="h-9 w-full bg-dark-primary rounded"></div>
      </div>
    </div>
  {:else}
  
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

      {#if f.deadline < f.submitted_at}
      {@const timeDiff = new Date(f.submitted_at).getTime() - new Date(f.deadline).getTime()}
      {@const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))}
      {@const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}
      {@const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))}
      {@const timeString = days > 0 ? `${days} jour${days > 1 ? 's' : ''}` : `${hours} heure${hours > 1 ? 's' : ''} et ${minutes} minute${minutes > 1 ? 's' : ''}`}
        <p class="text-red-400 text-sm font-bold">Fiche soumise {timeString} en retard</p>
      {/if}

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

      {#if f.site_plan_path}
        <PdfViewer
          path={f.site_plan_path}
          label="Voir le plan d'implantation de l'événement"
          docTitle={`Plan d'implantation - ${f.title} - ${formatDateSmart(f.event_date, { day: 'numeric', month: 'long', year: 'numeric' })} - ${f.profiles.name}`}
        />
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
            <p class="text-gray-400 text-sm">{resp.data.email} — {resp.data.telephone}</p>
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
        {/if}
        {#if f.food?.organisation}
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

        {#if f.alcohol?.prevention && f.alcohol.prevention.length > 0}
          {@const devices = f.alcohol.prevention as { titre: string; selected: boolean }[]}

          <div>
            <p class="text-gray-400 text-xs uppercase mb-2">Dispositifs de prévention</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              {#each devices as dev}
          <div class="mb-1">
            <p class="text-white text-sm">• {dev.titre} : <span class="text-white font-bold">{dev.selected ? 'Oui' : 'Non'}</span></p>
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
            <p class="text-gray-500 text-sm italic">⚠️ Aucune clé sélectionnée</p>
          {/if}
        {/if}

        {#if f.security?.salle_ssi && f.security.salle_ssi.length > 0}
          <div class="mt-4">
            <p class="text-gray-400 text-xs uppercase mb-2">Présents dans la salle SSI</p>
            {#each f.security.salle_ssi as pers}
              <p class="text-white text-sm">• {pers.prenom} {pers.nom}<span class="text-gray-400 pl-1">- {pers.email} - {pers.telephone}</span></p>
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

  {#if showSignModal}
  <ConfirmModal
      title="Signer la fiche ?"
      description="Vous allez signer cette fiche event, attestant de votre approbation pour votre étape. Pour confirmer, écrivez <strong class='text-white font-mono'>signer</strong> ci-dessous."
      confirmWord="signer"
      confirmLabel="Signer la fiche"
      accentColor="green"
      onconfirm={signFiche}
      oncancel={() => showSignModal = false}
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
  <div class="bg-dark-secondary p-4 flex flex-col border-t-2 border-x-2 rounded-t border-dark-primary gap-3">

    <!-- LIGNE 1 : statut à gauche + coches au centre + compteur à droite -->
    <div class="flex items-center justify-between gap-3">

      <!-- Statut -->
      <div class="shrink-0">
        {#if myRole === 'club'}
          {#if f.status === 'refusee'}
            <p class="text-white text-sm">Fiche <span class="text-dark-red-accent font-bold">refusée</span></p>
          {:else if f.status === 'validee'}
            <p class="text-white text-sm">Fiche <span class="text-dark-green-accent font-bold">validée</span></p>
          {:else if f.status === 'en_revision'}
            <p class="text-sm text-yellow-400">⚠️ Révision demandée<br><a href="./edition" class="text-blue-400 hover:underline">Éditez</a> votre fiche event.</p>
          {:else}
            <p class="text-gray-400 text-sm">En cours<br>de relecture</p>
          {/if}
        {:else}
          <p class="text-gray-400 text-xs">Événement dans</p>
          <p class="text-white text-lg font-bold">{Math.max(0, Math.ceil((new Date(f.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} j</p>
        {/if}
      </div>

      <!-- COCHES WORKFLOW -->
      {#if signatures.length > 0 && f.status !== 'brouillon'}
        <div class="hidden md:flex items-center gap-1.5 flex-wrap justify-center">
          <!-- Affichage Desktop -->
          {#each sortedSignatures as sig}
            {@const signed = sig.status === 'signe'}
            {@const isNext = !signed && sortedSignatures
              .filter((s: any) => (s.workflow_etapes?.ordre ?? 0) < (sig.workflow_etapes?.ordre ?? 0))
              .every((s: any) => s.status === 'signe')}
            <div class="relative group">
              <div class="w-7 h-7 rounded-full flex items-center justify-center transition-colors
                {signed
                  ? 'bg-dark-green-accent'
                  : isNext
                    ? 'bg-dark-secondary border-2 border-gray-400'
                    : 'bg-dark-secondary border-2 border-gray-600'}">
                {#if signed}
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                {:else}
                  <svg class="w-3.5 h-3.5 {isNext ? 'text-gray-400' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                {/if}
              </div>
              <!-- Tooltip au survol -->
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-dark-primary text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {(sig.role_label ?? 'Inconnu').replace(/ /g, '\n')}
              </div>
            </div>
          {/each}
        </div>

        <!-- Affichage Mobile -->
        <button type="button" class="md:hidden relative flex items-center border border-dark-primary rounded gap-1 p-2 -m-2" onclick={() => showMobileSignatures = !showMobileSignatures}>
          {#each sortedSignatures as sig}
            {@const signed = sig.status === 'signe'}
            {@const isNext = !signed && sortedSignatures
              .filter((s: any) => (s.workflow_etapes?.ordre ?? 0) < (sig.workflow_etapes?.ordre ?? 0))
              .every((s: any) => s.status === 'signe')}
            <div class="w-2.5 h-2.5 rounded-full {signed ? 'bg-dark-green-accent' : isNext ? 'bg-gray-400' : 'bg-gray-600'}"></div>
          {/each}

          {#if showMobileSignatures}
            <!-- Overlay invisible pour fermer en cliquant à côté -->
            <div class="fixed inset-0 z-40" role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') showMobileSignatures = false; }} onclick={(e) => { e.stopPropagation(); showMobileSignatures = false; }} aria-label="Fermer les signatures"></div>
            
            <!-- Popup -->
            <div class="absolute bottom-[calc(100%+1rem)] left-1/2 -translate-x-1/2 w-max max-w-[90vw] bg-dark-secondary border-2 border-dark-primary rounded-xl px-2 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.2)] z-50 flex flex-wrap justify-center cursor-default" role="dialog" aria-label="Signatures" tabindex="-1" onkeydown={(e) => { if (e.key === 'Escape') showMobileSignatures = false; }} onclick={(e) => e.stopPropagation()}>
              <!-- Flèche du popup -->
              <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-dark-primary drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)]"></div>
              
              {#each sortedSignatures as sig}
                {@const signed = sig.status === 'signe'}
                {@const isNext = !signed && sortedSignatures
                  .filter((s: any) => (s.workflow_etapes?.ordre ?? 0) < (sig.workflow_etapes?.ordre ?? 0))
                  .every((s: any) => s.status === 'signe')}
                <div class="flex flex-col items-center gap-1.5 min-w-14">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center
                    {signed
                      ? 'bg-dark-green-accent'
                      : isNext
                        ? 'bg-dark-secondary border-2 border-gray-400'
                        : 'bg-dark-secondary border-2 border-gray-600'}">
                    {#if signed}
                      <svg class="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                    {:else}
                      <svg class="w-4 h-4 {isNext ? 'text-gray-400' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                    {/if}
                  </div>
                  <span class="text-[10px] text-gray-400 text-center uppercase tracking-[0.03em] leading-[1.15] max-w-full px-1 whitespace-pre-wrap wrap-break-word">
                    {(sig.role_label ?? 'Inconnu').replace(/ /g, '\n')}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </button>
      {/if}

      <!-- Compteur jours (club) ou message -->
      {#if myRole === 'club'}
        <div class="text-end shrink-0">
          <p class="text-gray-400 text-xs">Événement dans</p>
          <p class="text-white text-lg font-bold">{Math.max(0, Math.ceil((new Date(f.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} j</p>
        </div>
      {:else if f.status === 'refusee' && myRole !== 'club'}
        <p class="text-white text-sm text-end">Cette fiche a été <span class="text-dark-red-accent font-bold">refusée</span></p>
      {:else if f.status === 'validee' && myRole !== 'club'}
        <p class="text-white text-sm text-end">Cette fiche a été <span class="text-dark-green-accent font-bold">validée</span></p>
      {:else if f.status === 'en_revision' && myRole !== 'club'}
        <p class="text-gray-400 text-sm text-end">En cours de révision</p>
      {:else if maSignature?.status === 'signe'}
        <p class="text-gray-400 text-sm text-end">Vous avez<br>déjà signé</p>
      {:else if monTour}
        <p class="text-dark-green-accent text-sm font-medium text-end">C'est à vous<br>de signer</p>
      {:else if !maSignature}
        <p class="text-gray-400 text-sm text-end">Vous n'êtes pas<br>signataire</p>
      {:else}
        <p class="text-gray-400 text-sm text-end">Ce n'est pas à<br>vous de signer</p>
      {/if}
    </div>

    <!-- LIGNE 2 : boutons d'action (seulement si pertinent) -->
    {#if myRole !== 'club' && (peutRefuser || peutDemanderRevision || peutSigner)}
      <div class="flex gap-3">

        {#if peutRefuser}
          <button type="button" onclick={() => showRefuseModal = true}
            class="text-center whitespace-nowrap grow border-3 border-dark-red-accent px-3 py-1.5 text-dark-red-accent font-bold hover:bg-dark-red-accent active:bg-dark-red-accent hover:text-white active:text-white rounded transition-colors">
            <svg class="w-5 h-5 mx-auto @[27rem]:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <span class="hidden @[27rem]:inline">Refuser</span>
          </button>
        {/if}

        {#if peutDemanderRevision}
          <button type="button" onclick={() => showReviewModal = true}
            class="text-center whitespace-nowrap grow border-3 border-dark-orange-accent px-3 py-1.5 text-dark-orange-accent font-bold hover:bg-dark-orange-accent active:bg-dark-orange-accent hover:text-black active:text-black rounded transition-colors">
            <svg class="w-5 h-5 mx-auto @[27rem]:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 12h14"/>
            </svg>
            <span class="hidden @[27rem]:inline">Demander une révision</span>
          </button>
        {/if}

        {#if peutSigner}
          <button type="button" onclick={() => showSignModal = true}
              class=" text-center whitespace-nowrap border-3 border-dark-green-accent px-3 py-1.5 text-dark-green-accent font-bold hover:bg-dark-green-accent active:bg-dark-green-accent hover:text-white active:text-white rounded transition-colors grow">
              <svg class="w-5 h-5 mx-auto @[27rem]:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="hidden @[27rem]:inline">Signer</span>
          </button>
        {/if}

      </div>
    {/if}
  </div>
</footer>

  <form bind:this={refuseFormEl} method="POST" action="?/refuser" use:enhance class="hidden print:hidden"></form>
  <form bind:this={signFormEl} method="POST" action="?/signer" use:enhance class="hidden print:hidden"></form>
  <form bind:this={reviewFormEl} method="POST" action="?/demander_revision" use:enhance class="hidden print:hidden">
    <input type="hidden" name="message" value={reviewMessage} />
   </form>

  {/if}

</div>

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