<script lang="ts">
  import { enhance } from '$app/forms'
  import { onMount } from 'svelte'
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

  // Visibilité temporaire des messages (5 secondes)
  let showChangerNom = $state(false)
  let showChangerMotDePasse = $state(false)

  // Toggle pour afficher/cacher tous les paramètres
  let showAllSettings = $state(true)


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

  // tabs: 'event' | 'clubs' | 'admins'
  let selectedTab: 'event' | 'clubs' | 'admins' = $state('event')
  let TabComponent: import('svelte').Component<any> | null = $state(null)
  let loadingTab = $state(false)

  async function loadTab(tab: typeof selectedTab) {
    selectedTab = tab
    loadingTab = true
    if (tab === 'event') {
      const mod = await import('$lib/components/settings/EventSettings.svelte')
      TabComponent = mod.default
    } else if (tab === 'clubs') {
      const mod = await import('$lib/components/settings/ClubsSettings.svelte')
      TabComponent = mod.default
    } else {
      const mod = await import('$lib/components/settings/AdminsSettings.svelte')
      TabComponent = mod.default
    }
    loadingTab = false
  }

  const tabIndex = $derived(['event', 'clubs', 'admins'].indexOf(selectedTab))

  onMount(() => loadTab(selectedTab))

</script>

<div class="sticky top-0 z-20 bg-dark-terciary py-4 px-4">
  <h1 class="text-2xl font-bold text-white">Paramètres</h1>
</div>

<div class="max-w-3xl mx-auto space-y-6 px-4">

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
          class="border border-blue-500 text-blue-400 hover:bg-blue-600 active:bg-blue-600 hover:text-white active:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
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
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white active:text-white text-xs">
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
          class="border border-blue-500 text-blue-400 hover:bg-blue-600 active:bg-blue-600 hover:text-white active:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:active:bg-transparent disabled:hover:text-blue-400 disabled:active:text-blue-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Changer le mot de passe
        </button>
      </div>
    </form>
  </section>

  <!-- SETTINGS SECRÉTAIRE GÉNÉRALE -->
  {#if isSecretaire}
    <div class="mt-4">
      <div class="sticky top-16 z-40 bg-dark-terciary pb-px mb-6">
        <div class="relative flex border-b border-dark-primary">
          <!-- Indicateur glissant -->
          <div
            class="absolute bottom-0 h-0.5 w-1/3 bg-blue-500 transition-transform duration-300 ease-in-out"
            style="transform: translateX({tabIndex * 100}%)"
          ></div>

          <button
            class="flex-1 pb-3 text-sm font-medium transition-colors {selectedTab === 'event' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}"
            onclick={() => loadTab('event')}>
            Fiche event
          </button>
          <button
            class="flex-1 pb-3 text-sm font-medium transition-colors {selectedTab === 'clubs' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}"
            onclick={() => loadTab('clubs')}>
            Clubs
          </button>
          <button
            class="flex-1 pb-3 text-sm font-medium transition-colors {selectedTab === 'admins' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}"
            onclick={() => loadTab('admins')}>
            Admins
          </button>
        </div>
      </div>

      {#if loadingTab}
        <p>Chargement…</p>
      {:else if TabComponent}
        <TabComponent {data} {actionData} />
      {/if}
    </div>
  {/if}
</div>