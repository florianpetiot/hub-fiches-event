<script lang="ts">
  import { page } from '$app/state'
  import { writable } from 'svelte/store'
  import { supabase } from '$lib/supabase'
  import { goto, invalidateAll } from '$app/navigation'

  let { data } = $props<{
    data: {
      session: { user?: { role?: string; email?: string } } | null;
      profile?: { name?: string; email?: string };
      supabase?: any;
    };
  }>()

  const open = writable(false)
  const toggle = () => open.update(v => !v)
  const close = () => open.set(false)

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { href: '/calendrier', label: 'Calendrier', icon: '📅', adminOnly: true },
    { href: '/parametres', label: 'Paramètres', icon: '⚙️' },
  ]

  async function logout() {
    await supabase.auth.signOut()
    await fetch('/auth/session', { method: 'DELETE' })
    await invalidateAll()
    goto('/login')
  }

</script>

<!-- En-tête mobile (incluse dans le composant) -->
<header class="md:hidden flex items-center justify-between p-4 bg-dark-secondary text-white">
  <button aria-label="Ouvrir le menu" onclick={toggle} class="p-2 rounded hover:bg-dark-primary">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  </button>
  <h1 class="text-lg font-bold">Hub Fiches Event</h1>
</header>

{#if $open}
  <div class="fixed inset-0 bg-black/50 z-30 md:hidden"
    role="button" tabindex="0"
    onclick={close}
    onkeydown={e => (e.key === 'Escape' || e.key === 'Enter') && close()}>
  </div>
{/if}

<aside class={`fixed inset-y-0 left-0 w-64 bg-dark-secondary py-8 text-white border-r border-dark-primary transform ${$open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-40`}>

  <a href="/dashboard" class="flex items-center justify-center text-xl font-bold px-5 mb-8">
    Hub Fiches Event
  </a>

  <span class="block border-t border-dark-primary mb-6 mx-5"></span>

  <div class="mx-5 mb-6">
    <p class="text-white text-sm font-medium truncate">{data.profile?.name}</p>
    <p class="text-gray-400 text-xs truncate">{data.session?.user?.email}</p>
  </div>
 

  <nav>
    <ul class="space-y-0">
      {#each links as link}
        {#if !link.adminOnly || data.session?.user?.role !== 'club'}
          <li>
            <a href={link.href}
              onclick={() => close()}
              class={`group block px-3 py-2 transition-colors text-end ${page.url.pathname.startsWith(link.href)
                ? 'bg-dark-primary text-white'
                : 'text-gray-400 hover:text-white hover:bg-linear-to-r hover:from-dark-secondary hover:to-dark-primary'}`}>
              {link.label}
              <svg class={`w-4 h-4 inline-block ml-1 ${page.url.pathname.startsWith(link.href) ? '' : 'opacity-0 transform translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </li>
        {/if}
      {/each}
    </ul>
  </nav>

<!-- lien de déconnexion -->
  <div class="absolute bottom-0 left-0 right-0 p-5 border-t border-dark-primary">
    <button class="text-xs text-gray-300 hover:text-white block" onclick={logout}>
    <!-- icon -->
      <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
      </svg>
      Déconnexion
    </button>
  </div>

</aside>