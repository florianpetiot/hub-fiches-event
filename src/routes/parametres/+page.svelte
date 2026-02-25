<script lang="ts">
  import { enhance } from '$app/forms'
  import type { PageData, ActionData } from './$types'

  let { data, form: actionData }: { data: PageData, form: ActionData } = $props()

  const isSecretaire = $derived(data.profile?.role === 'secretaire_generale')
  const isAdmin = $derived(data.profile?.role === 'admin' || isSecretaire)

  function hasError(obj: unknown): obj is { error: string } {
    return typeof obj === 'object' && obj !== null && 'error' in obj
  }
  function hasSuccess(obj: unknown): obj is { success: boolean } {
    return typeof obj === 'object' && obj !== null && 'success' in obj
  }

  // Profil
  let name = $state('')
  let password = $state('')
  let confirm = $state('')
  let showPassword = $state(false)
  $effect(() => { name = data.profile?.name ?? '' })

  // Règles Cas 2
  const DEFAULT_REGLES_CAS2 = {
    conditions: {
      hors_horaires: true,
      offre_alimentaire: true,
      debit_boissons: true,
      public_exterieur: true,
      effectif_superieur: true
    } as Record<string, boolean>,
    seuil_effectif: 50,
    heure_fermeture: '20:00',
    delai_cas1_semaines: 2,
    delai_cas2_mois: 2
  }
  let regles = $state(structuredClone(DEFAULT_REGLES_CAS2))
  $effect(() => { regles = structuredClone(data.settings?.regles_cas2 ?? DEFAULT_REGLES_CAS2) })

  // Règles agent de sécu
  const DEFAULT_REGLES_SECU = {
    conditions: {
      effectif_superieur: true,
      presence_alcool: true,
      public_exterieur: true,
      hors_horaires: true
    } as Record<string, boolean>,
    seuil_effectif: 50
  }
  let reglesSecu = $state(structuredClone(DEFAULT_REGLES_SECU))
  $effect(() => { reglesSecu = structuredClone(data.settings?.regles_agent_secu ?? DEFAULT_REGLES_SECU) })

  // Clés
  const DEFAULT_CLES: Record<string, { id: string; key: string }[]> = { sud: [], ouest: [], nord: [], est: [], parking: [] }
  let cles = $state(structuredClone(DEFAULT_CLES))
  let showAddCle = $state<Record<string, boolean>>({})
  let nouvelleCleVal = $state<Record<string, string>>({})
  $effect(() => { cles = structuredClone(data.settings?.cles_disponibles ?? DEFAULT_CLES) })

  // Canaux communication
  let canaux = $state(structuredClone([] as NonNullable<typeof data.settings>['canaux_communication']))
  let showAddCanal = $state(false)
  let nouveauCanal = $state({ id: '', label: '' })
  $effect(() => { canaux = structuredClone(data.settings?.canaux_communication ?? []) })

  // Catégories
  let categories = $state(structuredClone([] as NonNullable<typeof data.settings>['categories_evenement']))
  let showAddCategorie = $state(false)
  let nouvelleCategorie = $state('')
  $effect(() => { categories = structuredClone(data.settings?.categories_evenement ?? []) })

  // Documents aide
  const DEFAULT_DOCUMENTS_AIDE = { fiche_hygiene_path: '', autres: [] as string[] }
  let documentsAide = $state(structuredClone(DEFAULT_DOCUMENTS_AIDE))
  $effect(() => { documentsAide = structuredClone(data.settings?.documents_aide ?? DEFAULT_DOCUMENTS_AIDE) })

  const conditionsCas2Labels: Record<string, string> = {
    hors_horaires: 'Se déroule hors horaires d\'ouverture habituels',
    offre_alimentaire: 'Propose une offre alimentaire',
    debit_boissons: 'Inclut un débit de boissons',
    public_exterieur: 'Ouvert au public extérieur',
    effectif_superieur: 'Effectif prévu supérieur au seuil',
  }

  const conditionsSecuLabels: Record<string, string> = {
    effectif_superieur: 'Effectif supérieur à X personnes',
    presence_alcool: 'Présence d\'alcool',
    public_exterieur: 'Public extérieur',
    hors_horaires: 'Hors horaires d\'ouverture',
  }

  const directions = ['sud', 'ouest', 'nord', 'est', 'parking']

  // Visibilité temporaire des messages (5 secondes)
  let showChangerNom = $state(false)
  let showChangerMotDePasse = $state(false)
  let showSettingsUpdated = $state(false)

  // Toggle pour afficher/cacher tous les paramètres
  let showAllSettings = $state(true)

  // Références aux formulaires de settings pour soumission depuis le footer
  let formRegles = $state<HTMLFormElement>()
  let formReglesSecu = $state<HTMLFormElement>()
  let formCles = $state<HTMLFormElement>()
  let formCanaux = $state<HTMLFormElement>()
  let formCategories = $state<HTMLFormElement>()

  function submitAllSettings() {
    const forms = [formRegles, formReglesSecu, formCles, formCanaux, formCategories]
    forms.forEach((f, i) => setTimeout(() => f?.requestSubmit(), i * 150))
  }

  $effect(() => {
    if (actionData?.changerNom) {
      showChangerNom = true
      const t = setTimeout(() => (showChangerNom = false), 5000)
      return () => clearTimeout(t)
    }
  })

  $effect(() => {
    if (actionData?.changerMotDePasse) {
      showChangerMotDePasse = true
      const t = setTimeout(() => (showChangerMotDePasse = false), 5000)
      return () => clearTimeout(t)
    }
  })

  $effect(() => {
    if (actionData?.settings) {
      showSettingsUpdated = true
      const t = setTimeout(() => (showSettingsUpdated = false), 5000)
      return () => clearTimeout(t)
    }
  })
</script>

<div class="sticky top-0 z-20 bg-dark-terciary py-4 px-4">
  <h1 class="text-2xl font-bold text-white">Paramètres</h1>
</div>

<div class="max-w-2xl mx-auto space-y-6 px-4">

  <!-- PROFIL -->
  <section class="bg-dark-secondary rounded-lg p-6 space-y-6">
    <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Mon profil</h2>

    <div>
      <p class="text-xs text-gray-400 uppercase mb-1">Email</p>
      <p class="text-white text-sm">{data.profile?.email}</p>
    </div>

    <!-- Changer nom -->
    <form method="POST" action="?/changerNom" use:enhance={() => {
        return ({ update }) => { update({ reset: false }) }
      }} class="space-y-3">
      <div>
        <label for="name" class="block text-xs text-gray-400 uppercase mb-1">Nom affiché</label>
        <input id="name" name="name" type="text" bind:value={name}
          class="w-full bg-dark-primary text-white rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm" />
      </div>
      <div class="flex justify-between items-center">
        <div>
          {#if showChangerNom && hasError(actionData?.changerNom)}<p class="text-red-400 text-xs">{actionData.changerNom.error}</p>{/if}
          {#if showChangerNom && hasSuccess(actionData?.changerNom)}<p class="text-green-400 text-xs">✓ Nom mis à jour</p>{/if}
        </div>
        <button type="submit"
          class="border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Mettre à jour le nom
        </button>
      </div>
    </form>

    <!-- Changer mot de passe -->
    <form method="POST" action="?/changerMotDePasse" use:enhance={() => {
      return ({ update }) => { update({ reset: false }); password = ''; confirm = '' }
    }} class="space-y-3 border-t border-dark-primary pt-6">
      <h3 class="text-white font-medium text-sm">Changer le mot de passe</h3>
      <div>
        <label for="password" class="block text-xs text-gray-400 uppercase mb-1">Nouveau mot de passe</label>
        <div class="relative">
          <input id="password" name="password" type={showPassword ? 'text' : 'password'} bind:value={password}
            class="w-full bg-dark-primary text-white rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm pr-16" />
          <button type="button" onclick={() => showPassword = !showPassword}
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs">
            {showPassword ? 'Cacher' : 'Voir'}
          </button>
        </div>
      </div>
      <div>
        <label for="confirm" class="block text-xs text-gray-400 uppercase mb-1">Confirmer</label>
        <input id="confirm" name="confirm" type={showPassword ? 'text' : 'password'} bind:value={confirm}
          class="w-full bg-dark-primary text-white rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm" />
      </div>
      <div class="flex justify-between items-center">
        <div>
          {#if showChangerMotDePasse && hasError(actionData?.changerMotDePasse)}<p class="text-red-400 text-xs">{actionData.changerMotDePasse.error}</p>{/if}
          {#if showChangerMotDePasse && hasSuccess(actionData?.changerMotDePasse)}<p class="text-green-400 text-xs">✓ Mot de passe mis à jour</p>{/if}
        </div>
        <button type="submit" disabled={!password || !confirm}
          class="border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-blue-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Changer le mot de passe
        </button>
      </div>
    </form>
  </section>

  <!-- SETTINGS SECRÉTAIRE GÉNÉRALE -->
  {#if isSecretaire}
    <div class="flex justify-end mb-4 px-4">
      <button type="button" onclick={() => showAllSettings = !showAllSettings}
        class="border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        {showAllSettings ? 'Cacher tous les paramètres' : 'Afficher tous les paramètres'}
      </button>
    </div>

    {#if showAllSettings}
    <!-- DÉLAIS DE SOUMISSION DES FICHES -->
    <section class="bg-dark-secondary rounded-lg p-6 space-y-5">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Délais de soumission des fiches</h2>
      <p class="text-sm text-gray-400">Définissez les délais auxquels les clubs doivent soumettre leur fiche événement avant la date prévue, et les conditions qui imposent un délai plus long.</p>

      <form bind:this={formRegles} method="POST" action="?/mettreAJourSettings" use:enhance={() => {
        return ({ update }) => { update({ reset: false }) }
      }} class="space-y-6">
        <input type="hidden" name="key" value="regles_cas2" />
        <input type="hidden" name="value" value={JSON.stringify(regles)} />

        <!-- Délais -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
            <span class="text-white text-sm font-medium">Délai standard</span>
            <span class="text-gray-400 text-sm">— fiche à rendre au moins</span>
            <input type="number" bind:value={regles.delai_cas1_semaines} min="1"
              class="w-16 bg-dark-secondary text-white rounded px-2 py-1 border border-dark-primary text-sm text-center focus:outline-none focus:border-blue-500" />
            <span class="text-xs text-gray-400">semaines avant</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
            <span class="text-white text-sm font-medium">Délai allongé</span>
            <span class="text-gray-400 text-sm">— fiche à rendre au moins</span>
            <input type="number" bind:value={regles.delai_cas2_mois} min="1"
              class="w-16 bg-dark-secondary text-white rounded px-2 py-1 border border-dark-primary text-sm text-center focus:outline-none focus:border-blue-500" />
            <span class="text-xs text-gray-400">mois avant</span>
          </div>
        </div>

        <!-- Conditions déclenchant le délai allongé -->
        <div class="space-y-3">
          <h3 class="text-white font-medium text-sm">Conditions déclenchant le délai allongé</h3>
          <p class="text-xs text-gray-500">Si au moins une condition est remplie, le délai allongé s'applique et le dossier complet est obligatoire.</p>
          <div class="grid grid-cols-2 gap-2">
            {#each Object.entries(conditionsCas2Labels) as [key, label]}
              <label class="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" bind:checked={regles.conditions[key]} class="w-4 h-4 rounded shrink-0" />
                <span class="text-white text-sm">{label}</span>
              </label>
            {/each}
          </div>
        </div>

        <!-- Paramètres associés -->
        <div class="space-y-3">
          <h3 class="text-white font-medium text-sm">Seuils et horaires de référence</h3>
          <div class="space-y-2">
            {#if regles.conditions.effectif_superieur}
            <div class="flex items-center justify-start gap-4">
              <span class="text-sm text-gray-300">Seuil d'effectif (personnes)</span>
              <input type="number" bind:value={regles.seuil_effectif} min="1"
                class="w-20 bg-dark-secondary text-white rounded px-2 py-1 border border-dark-primary text-sm text-center focus:outline-none focus:border-blue-500" />
            </div>
            {/if}
            <div class="flex items-center justify-start gap-4">
              <span class="text-sm text-gray-300">Heure de fermeture de référence</span>
              <input type="time" bind:value={regles.heure_fermeture}
                class="w-28 bg-dark-secondary text-white rounded px-2 py-1 border border-dark-primary text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div>
            {#if showSettingsUpdated && hasError(actionData?.settings)}<p class="text-red-400 text-xs">{actionData.settings.error}</p>{/if}
            {#if showSettingsUpdated && hasSuccess(actionData?.settings)}<p class="text-green-400 text-xs">✓ Mis à jour</p>{/if}
          </div>
          <button type="submit" class="hidden">Enregistrer</button>
        </div>
      </form>
    </section>

    <!-- RÈGLES AGENT DE SÉCU -->
    <section class="bg-dark-secondary rounded-lg p-6 space-y-5">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Conditions agent de sécurité</h2>

      <form bind:this={formReglesSecu} method="POST" action="?/mettreAJourSettings" use:enhance={() => {
        return ({ update }) => { update({ reset: false }) }
      }} class="space-y-5">
        <input type="hidden" name="key" value="regles_agent_secu" />
        <input type="hidden" name="value" value={JSON.stringify(reglesSecu)} />

        <div class="space-y-3 grid grid-cols-2 gap-4">
          {#each Object.entries(conditionsSecuLabels) as [key, label]}
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" bind:checked={reglesSecu.conditions[key]} class="w-4 h-4 rounded" />
              <span class="text-white text-sm">{label}</span>
            </label>
          {/each}
        </div>

        {#if reglesSecu.conditions.effectif_superieur}
          <div class="flex items-center justify-start gap-4">
              <span class="text-sm text-gray-300">Seuil d'effectif (personnes)</span>
              <input type="number" bind:value={reglesSecu.seuil_effectif} min="1"
                class="w-20 bg-dark-secondary text-white rounded px-2 py-1 border border-dark-primary text-sm text-center focus:outline-none focus:border-blue-500" />
          </div>
        {/if}

        <div class="flex justify-between items-center">
          <div>
            {#if showSettingsUpdated && hasError(actionData?.settings)}<p class="text-red-400 text-xs">{actionData.settings.error}</p>{/if}
            {#if showSettingsUpdated && hasSuccess(actionData?.settings)}<p class="text-green-400 text-xs">✓ Mis à jour</p>{/if}
          </div>
          <button type="submit" class="hidden">Enregistrer</button>
        </div>
      </form>
    </section>

    <!-- CLÉS DISPONIBLES -->
    <section class="bg-dark-secondary rounded-lg p-6 space-y-5">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Clés disponibles</h2>

      <form bind:this={formCles} method="POST" action="?/mettreAJourSettings" use:enhance class="space-y-5">
        <input type="hidden" name="key" value="cles_disponibles" />
        <input type="hidden" name="value" value={JSON.stringify(cles)} />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each directions as direction}
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <p class="text-xs text-gray-400 uppercase">{direction}</p>
                <button type="button"
                  onclick={() => { showAddCle[direction] = !showAddCle[direction]; nouvelleCleVal[direction] = '' }}
                  class="text-blue-400 hover:text-blue-300 text-xs">+ Ajouter</button>
              </div>
              <div class="flex flex-wrap gap-2">
                {#each cles[direction] ?? [] as cle, i}
                  <div class="flex items-center gap-1 bg-dark-primary rounded px-2 py-1">
                    <span class="text-white text-sm font-mono">{cle.key}</span>
                    <button type="button"
                      onclick={() => { cles[direction] = cles[direction].filter((_: any, j: number) => j !== i) }}
                      class="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                  </div>
                {/each}
              </div>
              {#if showAddCle[direction]}
                <div class="flex gap-2 mt-2">
                  <input type="text" placeholder="Ex: E1+110" bind:value={nouvelleCleVal[direction]}
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = nouvelleCleVal[direction]?.trim()
                        if (val) {
                          cles[direction] = [...(cles[direction] ?? []), { id: `${direction}_${val}`, key: val }]
                          nouvelleCleVal[direction] = ''
                          showAddCle[direction] = false
                        }
                      } else if (e.key === 'Escape') {
                        showAddCle[direction] = false
                      }
                    }}
                    class="w-32 bg-dark-primary text-white rounded px-2 py-1 border border-blue-500 text-sm focus:outline-none font-mono" />
                  <button type="button"
                    onclick={() => {
                      const val = nouvelleCleVal[direction]?.trim()
                      if (val) {
                        cles[direction] = [...(cles[direction] ?? []), { id: `${direction}_${val}`, key: val }]
                        nouvelleCleVal[direction] = ''
                        showAddCle[direction] = false
                      }
                    }}
                    class="text-blue-400 hover:text-blue-300 text-xs px-2">OK</button>
                  <button type="button" onclick={() => showAddCle[direction] = false}
                    class="text-gray-500 hover:text-gray-300 text-xs">Annuler</button>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <div class="flex justify-between items-center">
          <div>
            {#if showSettingsUpdated && hasError(actionData?.settings)}<p class="text-red-400 text-xs">{actionData.settings.error}</p>{/if}
            {#if showSettingsUpdated && hasSuccess(actionData?.settings)}<p class="text-green-400 text-xs">✓ Mis à jour</p>{/if}
          </div>
          <button type="submit" class="hidden">Enregistrer</button>
        </div>
      </form>
    </section>

    <!-- CANAUX DE COMMUNICATION -->
    <section class="bg-dark-secondary rounded-lg p-6 space-y-4">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Canaux de communication</h2>

      <form bind:this={formCanaux} method="POST" action="?/mettreAJourSettings" use:enhance class="space-y-4">
        <input type="hidden" name="key" value="canaux_communication" />
        <input type="hidden" name="value" value={JSON.stringify(canaux)} />

        <div class="space-y-2">
          {#each canaux as canal, i}
            <div class="flex items-center gap-2">
              <input type="text" bind:value={canal.label}
                class="flex-1 bg-dark-primary text-white rounded px-3 py-1.5 border border-dark-primary text-sm focus:outline-none focus:border-blue-500" />
              <button type="button"
                onclick={() => { canaux = canaux.filter((_: any, j: number) => j !== i) }}
                class="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
            </div>
          {/each}
        </div>

        {#if showAddCanal}
          <div class="flex gap-2">
            <input type="text" bind:value={nouveauCanal.label} placeholder="Nom du canal..."
              onkeydown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (nouveauCanal.label.trim()) {
                    canaux = [...canaux, { id: nouveauCanal.label.toLowerCase().replace(/\s+/g, '_'), label: nouveauCanal.label }]
                    nouveauCanal = { id: '', label: '' }
                    showAddCanal = false
                  }
                } else if (e.key === 'Escape') {
                  showAddCanal = false
                }
              }}
              class="flex-1 bg-dark-primary text-white rounded px-3 py-1.5 border border-blue-500 text-sm focus:outline-none" />
            <button type="button"
              onclick={() => {
                if (nouveauCanal.label.trim()) {
                  canaux = [...canaux, { id: nouveauCanal.label.toLowerCase().replace(/\s+/g, '_'), label: nouveauCanal.label }]
                  nouveauCanal = { id: '', label: '' }
                  showAddCanal = false
                }
              }}
              class="text-blue-400 hover:text-blue-300 text-sm px-2">OK</button>
            <button type="button" onclick={() => { showAddCanal = false; nouveauCanal = { id: '', label: '' } }}
              class="text-gray-500 hover:text-gray-300 text-sm">Annuler</button>
          </div>
        {:else}
          <button type="button" onclick={() => showAddCanal = true}
            class="text-blue-400 hover:text-blue-300 text-sm">+ Ajouter un canal</button>
        {/if}

        <div class="flex justify-between items-center">
          <div>
            {#if showSettingsUpdated && hasError(actionData?.settings)}<p class="text-red-400 text-xs">{actionData.settings.error}</p>{/if}
            {#if showSettingsUpdated && hasSuccess(actionData?.settings)}<p class="text-green-400 text-xs">✓ Mis à jour</p>{/if}
          </div>
          <button type="submit" class="hidden">Enregistrer</button>
        </div>
      </form>
    </section>

    <!-- CATÉGORIES D'ÉVÉNEMENT -->
    <section class="bg-dark-secondary rounded-lg p-6 space-y-4">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Catégories d'événement</h2>

      <form bind:this={formCategories} method="POST" action="?/mettreAJourSettings" use:enhance class="space-y-4">
        <input type="hidden" name="key" value="categories_evenement" />
        <input type="hidden" name="value" value={JSON.stringify(categories)} />

        <div class="flex flex-wrap gap-2">
          {#each categories as cat, i}
            <div class="flex items-center gap-1 bg-dark-primary rounded-full px-3 py-1">
              <span class="text-white text-sm">{cat}</span>
              <button type="button"
                onclick={() => { categories = categories.filter((_: any, j: number) => j !== i) }}
                class="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
            </div>
          {/each}
        </div>

        {#if showAddCategorie}
          <div class="flex gap-2">
            <input type="text" bind:value={nouvelleCategorie} placeholder="Nouvelle catégorie..."
              onkeydown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (nouvelleCategorie.trim()) {
                    categories = [...categories, nouvelleCategorie.trim()]
                    nouvelleCategorie = ''
                    showAddCategorie = false
                  }
                } else if (e.key === 'Escape') {
                  showAddCategorie = false
                }
              }}
              class="flex-1 bg-dark-primary text-white rounded px-3 py-1.5 border border-blue-500 text-sm focus:outline-none" />
            <button type="button"
              onclick={() => {
                if (nouvelleCategorie.trim()) {
                  categories = [...categories, nouvelleCategorie.trim()]
                  nouvelleCategorie = ''
                  showAddCategorie = false
                }
              }}
              class="text-blue-400 hover:text-blue-300 text-sm px-2">OK</button>
            <button type="button" onclick={() => { showAddCategorie = false; nouvelleCategorie = '' }}
              class="text-gray-500 hover:text-gray-300 text-sm">Annuler</button>
          </div>
        {:else}
          <button type="button" onclick={() => showAddCategorie = true}
            class="text-blue-400 hover:text-blue-300 text-sm">+ Ajouter une catégorie</button>
        {/if}

        
        <div class="flex justify-between items-center">
          <div>
            {#if showSettingsUpdated && hasError(actionData?.settings)}<p class="text-red-400 text-xs">{actionData.settings.error}</p>{/if}
            {#if showSettingsUpdated && hasSuccess(actionData?.settings)}<p class="text-green-400 text-xs">✓ Mis à jour</p>{/if}
          </div>
          <button type="submit" class="hidden">Enregistrer</button>
        </div>
      </form>
    </section>

    <!-- DOCUMENTS D'AIDE -->
    <section class="bg-dark-secondary rounded-lg p-6 space-y-4">
      <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Documents d'aide</h2>
      <p class="text-sm text-gray-400">Ces documents seront mis à disposition des clubs dans le formulaire.</p>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-white text-sm">Fiche d'aide hygiène / alimentation</p>
            {#if documentsAide.fiche_hygiene_path}
              <p class="text-green-400 text-xs mt-0.5">✓ Document uploadé</p>
            {:else}
              <p class="text-gray-500 text-xs mt-0.5">Aucun document</p>
            {/if}
          </div>
          <p class="text-gray-500 text-xs italic">Upload bientôt disponible</p>
        </div>
      </div>
    </section>

    {/if}

    <!-- Footer global pour Enregistrer (affiché seulement quand les paramètres sont dépliés) -->
    {#if showAllSettings}
    <footer class="sticky bottom-0 w-full max-w-2xl z-20 mb-0 mt-6">
      <div class="bg-dark-secondary p-4 flex items-center justify-end border-t-2 border-x-2 rounded-t border-dark-primary gap-3 max-w-2xl mx-auto">
        <button type="button" onclick={submitAllSettings}
          class="border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Enregistrer
        </button>
      </div>
    </footer>
    {/if}

  {/if}
</div>