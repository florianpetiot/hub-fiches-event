<script lang="ts">
  import { page } from '$app/state'
  import { writable } from 'svelte/store'

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

<aside class={`fixed inset-y-0 left-0 w-64 bg-dark-secondary py-5 text-white border-r border-dark-primary transform ${$open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-40`}>

  <h2 class="text-xl font-bold px-5 mb-8">Hub Fiches Event</h2>

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

  <!-- Profil en bas de sidebar -->
  <div class="absolute bottom-0 left-0 right-0 p-5 border-t border-dark-primary">
    <p class="text-white text-sm font-medium truncate">{data.profile?.name}</p>
    <p class="text-gray-400 text-xs truncate">{data.session?.user?.email}</p>
    <a href="/parametres" class="text-xs text-gray-500 hover:text-white mt-1 block">
      Paramètres
    </a>
  </div>

</aside>