<script lang="ts">
  import { page } from '$app/state'
  import { writable } from 'svelte/store'
  import { getContext } from 'svelte'
  import type { SupabaseClient } from '@supabase/supabase-js'
  import { goto, invalidateAll } from '$app/navigation'
	import type { Database } from '$lib/types/database.types';

  const ctx = getContext<{client: SupabaseClient<Database>}>('supabase')


  let { data } = $props<{
    data: {
      session: { user?: { role?: string; email?: string } } | null;
      profile?: { name?: string; email?: string };
      supabase?: SupabaseClient<Database>;
    };
  }>()

  const open = writable(false)
  const toggle = () => open.update(v => !v)
  const close = () => open.set(false)

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/calendrier', label: 'Calendrier' },
    { href: '/parametres', label: 'Paramètres' },
  ]

  async function logout() {
    await ctx.client.auth.signOut()
    await fetch('/auth/session', { method: 'DELETE' })
    await invalidateAll()
    goto('/login')
  }

</script>

<!-- En-tête mobile (incluse dans le composant) -->
<header class="md:hidden flex items-center justify-between p-4 bg-dark-secondary text-white">
  <button aria-label="Ouvrir le menu" onclick={toggle} class="p-2 rounded hover:bg-dark-primary active:bg-dark-primary text-text-main">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  </button>
  <h1 class="text-lg font-bold text-text-main">Hub Fiches Event</h1>
</header>

{#if $open}
  <div class="fixed inset-0 bg-black/50 z-30 md:hidden"
    role="button" tabindex="0"
    onclick={close}
    onkeydown={e => (e.key === 'Escape' || e.key === 'Enter') && close()}>
  </div>
{/if}

<aside class={`fixed shadow inset-y-0 left-0 w-64 bg-dark-secondary py-8 text-white border-r border-dark-primary transform ${$open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-40`}>

  <a href="/dashboard" class="flex items-center justify-center text-xl font-bold text-text-main px-5 mb-8">
    Hub Fiches Event
  </a>

  <span class="block border-t border-dark-primary mb-6 mx-5"></span>

  <div class="mx-5 mb-6">
    <p class="text-text-main text-sm font-medium truncate">{data.profile?.name}</p>
    <p class="text-text-muted text-xs truncate">{data.session?.user?.email}</p>
  </div>
 

  <nav>
    <ul class="space-y-0">
      {#each links as link}
        <li>
          <a href={link.href}
            onclick={() => close()}
            class={`group block px-3 py-2 transition-colors text-end ${page.url.pathname.startsWith(link.href)
              ? 'bg-dark-primary text-text-main'
              : 'text-text-muted hover:text-text-main active:text-text-main hover:bg-linear-to-r active:bg-linear-to-r hover:from-dark-secondary active:from-dark-secondary hover:to-dark-primary active:to-dark-primary'}`}>
            {link.label}
            <svg class={`w-4 h-4 inline-block ml-1 ${page.url.pathname.startsWith(link.href) ? '' : 'opacity-0 transform translate-x-1 group-hover:opacity-100 group-active:opacity-100 group-hover:translate-x-0 group-active:translate-x-0 transition-all duration-150'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </li>
      {/each}
    </ul>
  </nav>


  <!-- elements en bas de la sidebar -->
  <div class="absolute bottom-0 left-0 right-0">

    <div class="flex flex-col mx-5 mb-5 gap-2 text-xs text-text-muted/50">
      <a href="/mentions-legales" class="hover:text-text-main active:text-text-main" onclick={close}>Mentions légales</a>
      <a href="/politique-de-confidentialite" class="hover:text-text-main active:text-text-main" onclick={close}>Politique de confidentialité</a>
      <a href="/conditions-d-utilisation" class="hover:text-text-main active:text-text-main" onclick={close}>Conditions d’utilisation</a>
      <p class="hover:text-text-main active:text-text-main">© 2026 Hub Fiches Event</p>
    </div>

    <!-- lien de déconnexion -->
    <div class="p-5 border-t border-dark-primary">
      <button class="text-xs text-text-muted hover:text-text-main block active:text-text-main hover:cursor-pointer" onclick={logout}>
      <!-- icon -->
        <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Déconnexion
      </button>
    </div>
  </div>


</aside>