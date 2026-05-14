<script lang="ts">
  import { enhance } from '$app/forms'
  import { onMount } from 'svelte'
  import type { PageData, ActionData } from './$types'
  let { data, form: actionData }: { data: PageData, form: ActionData } = $props()

  const isDirection = $derived(data.profile?.roles.name === 'direction')
  const isAdmin = $derived(data.profile?.roles.name !== 'club')

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

  // --- Gestion du Thème ---
  let theme = $state('system');

  $effect(() => {
    theme = localStorage.getItem('theme') || 'system';
  });

  function setTheme(newTheme: string) {
    theme = newTheme;
    localStorage.setItem('theme', theme);
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

</script>

<div class="sticky top-0 z-20 bg-dark-terciary py-4">
  <h1 class="text-2xl font-bold text-text-main">Paramètres</h1>
</div>

<div class="max-w-3xl mx-auto space-y-6">

  <!-- PROFIL -->
  <section class="bg-dark-secondary rounded-lg p-6 space-y-6 shadow">
    <h2 class="text-lg font-semibold text-text-main border-b border-dark-primary pb-2">Mon profil</h2>

    <div class="flex gap-4">
      <div>
        <p class="text-xs text-text-muted uppercase mb-1">Email</p>
        <p class="text-text-main text-sm">{data.profile?.email}</p>
      </div>
      <div>
        <p class="text-xs text-text-muted uppercase mb-1">Rôle</p>
        <p class="text-text-main text-sm">{data.profile?.roles?.label}</p>
      </div>
    </div>

    <!-- Changer nom -->
    <form method="POST" action="?/changerNom" use:enhance={() => {
        return ({ update }) => { update({ reset: false }) }
      }} class="space-y-3">
      <div>
        <label for="name" class="block text-xs text-text-muted uppercase mb-1">Nom affiché</label>
        <input id="name" name="name" type="text" bind:value={name}
          class="w-full bg-dark-primary text-text-main rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm" />
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
      <h3 class="text-text-main font-medium text-sm">Changer le mot de passe</h3>
      <div>
        <label for="password" class="block text-xs text-text-muted uppercase mb-1">Nouveau mot de passe</label>
        <div class="relative">
          <input id="password" name="password" type={showPassword ? 'text' : 'password'} bind:value={password}
            class="w-full bg-dark-primary text-text-main rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm pr-16" />
          <button type="button" onclick={() => showPassword = !showPassword}
            class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-white active:text-white text-xs">
            {showPassword ? 'Cacher' : 'Voir'}
          </button>
        </div>
      </div>
      <div>
        <label for="confirm" class="block text-xs text-text-muted uppercase mb-1">Confirmer</label>
        <input id="confirm" name="confirm" type={showPassword ? 'text' : 'password'} bind:value={confirm}
          class="w-full bg-dark-primary text-text-main rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm" />
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

  <!-- THEME -->
  <section class="bg-dark-secondary rounded-lg p-6 space-y-4 mb-6 shadow">
    <h2 class="text-lg font-semibold text-text-main border-b border-dark-primary pb-2">Apparence</h2>
    <div class="flex gap-4">
      <button onclick={() => setTheme('light')} class="px-4 py-2 rounded border border-dark-primary {theme === 'light' ? 'bg-dark-primary text-text-main' : 'text-text-muted hover:text-text-main transition-colors'}">
        Clair
      </button>
      <button onclick={() => setTheme('dark')} class="px-4 py-2 rounded border border-dark-primary {theme === 'dark' ? 'bg-dark-primary text-text-main' : 'text-text-muted hover:text-text-main transition-colors'}">
        Sombre
      </button>
      <button onclick={() => setTheme('system')} class="px-4 py-2 rounded border border-dark-primary {theme === 'system' ? 'bg-dark-primary text-text-main' : 'text-text-muted hover:text-text-main transition-colors'}">
        Système
      </button>
    </div>
  </section>

  <!-- WORKFLOW DE SIGNATURE (Lecture seule) -->
  {#if !isDirection}
    <section class="bg-dark-secondary rounded-lg p-6 space-y-4 mb-6 shadow">
      <h2 class="text-lg font-semibold text-text-main border-b border-dark-primary pb-2">Workflow de signature</h2>
      <p class="text-sm text-text-muted">
        Voici l'ordre de validation des fiches événements après leur publication.
      </p>

      <div class="space-y-2">
        <div class="flex items-center gap-3 bg-dark-primary/50 rounded-lg px-4 py-3">
          <span class="w-6 h-6 rounded-full bg-dark-secondary text-gray-300 flex items-center justify-center text-xs font-bold shrink-0">0</span>
          <p class="text-text-main text-sm">Soumission par le club</p>
        </div>

        {#each data.workflow ?? [] as etape, i}
          <div class="flex items-center gap-3 bg-dark-primary rounded-lg px-4 py-3">
            <span class="w-6 h-6 rounded-full bg-dark-secondary text-gray-400 border border-dark-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
            <p class="text-text-main text-sm">Validation {etape.roles?.label}</p>
          </div>
        {/each}

        <div class="flex items-center gap-3 bg-dark-primary/50 rounded-lg px-4 py-3">
          <span class="w-6 h-6 rounded-full bg-dark-secondary text-gray-300 flex items-center justify-center text-xs font-bold shrink-0">
            {(data.workflow?.length ?? 0) + 1}
          </span>
          <p class="text-text-main text-sm">Validation finale — Direction</p>
        </div>
      </div>
    </section>
  {/if}

  <!-- SETTINGS SECRÉTAIRE GÉNÉRALE -->
  {#if isDirection}
    <div class="mt-4">
      <div class="sticky top-16 z-20 bg-dark-terciary pb-px mb-6">
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
            Administrateurs
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