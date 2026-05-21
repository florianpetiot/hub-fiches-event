<script lang="ts">
  import { page } from '$app/state'
  import { eventDetails } from '$lib/eventStore.svelte';
	import { formatDateSmart } from '$lib/date';
  import type { LayoutData } from './$types'
  import type { Snippet } from 'svelte'

  let { data, children }: { data: LayoutData; children: Snippet } = $props()

  let open = $state(false)
  const toggle = () => open = !open
  const close = () => open = false

  // Use the `page` state reactively to keep `id` up-to-date
  let id = $derived(page.params.id)

  // Make `isClub` and `canEdit` reactive so they update when `data` changes
  let isClub = $derived(data?.profile?.roles.name === 'club')
  let canEdit = $derived(isClub && (data?.fiche?.status === 'brouillon' || data?.fiche?.status === 'en_revision'))

  type EventData = {
    title: string;
    eventDate: string;
  };

  // Direct access to the reactive store — no subscribe/onDestroy needed
  let eventData: EventData = $derived({ title: eventDetails.title, eventDate: eventDetails.eventDate })

  // when the layout receives fiche data (e.g. on initial load) ensure store has current title/date
  $effect(() => {
    if (data?.fiche) {
      eventDetails.title = data.fiche.title;
      eventDetails.eventDate = data.fiche.event_date;
    }
  });

  const statusLabel: Record<string, string> = {
        brouillon: 'Brouillon',
        soumise: 'Soumise',
        en_revision: 'En révision',
        validee: 'Validée',
        refusee: 'Refusée'
    }

    const statusColor: Record<string, string> = {
        brouillon: 'bg-dark-blue-bg text-dark-blue-accent border border-dark-blue-primary',
        soumise: 'bg-dark-yellow-bg text-dark-yellow-accent border border-dark-yellow-primary',
        en_revision: 'bg-dark-orange-bg text-dark-orange-accent border border-dark-orange-primary',
        validee: 'bg-dark-green-bg text-dark-green-accent border border-dark-green-primary',
        refusee: 'bg-dark-red-bg text-dark-red-accent border border-dark-red-primary'
    }
</script>

<div class="min-h-screen bg-dark-terciary">

  <!-- mobile header -->
  <header class="md:hidden flex items-center justify-between p-4 bg-dark-secondary text-text-main">
    <button aria-label="Ouvrir le menu" onclick={toggle} class="p-2 rounded hover:bg-dark-primary active:bg-dark-primary">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>
    <h1 class="text-lg font-bold truncate">{data?.fiche?.title}</h1>
  </header>

  {#if open}
    <div class="fixed inset-0 bg-black/50 z-30 md:hidden"
      role="button" tabindex="0"
      onclick={close}
      onkeydown={e => (e.key === 'Escape' || e.key === 'Enter') && close()}>
    </div>
  {/if}

  <aside class={`fixed inset-y-0 left-0 w-64 bg-dark-secondary py-8 text-text-main border-r border-dark-primary transform ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-40`}>

    <a href="/dashboard" class="flex items-center gap-2 mb-8 mx-5 text-sm text-text-muted hover:text-text-main active:text-text-main">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Retour au dashboard
    </a>

    <span class="block border-t border-dark-primary mb-6 mx-5"></span>

    <h2 class="text-xl text-text-main font-bold mb-2 mx-5">{eventData.title}</h2>
    <h3 class="text-text-main text-sm mb-2 mx-5">{data?.fiche?.profiles?.name}</h3>
    <p class="text-sm text-text-muted mb-2 mx-5">{formatDateSmart(eventData.eventDate, { day: 'numeric', month: 'long', year: 'numeric' })} - V{data?.fiche?.version}</p>

    <span class={statusColor[data?.fiche?.status] + ' inline-block px-2 py-1 mb-6 mx-5 rounded text-xs font-bold'}>{statusLabel[data?.fiche?.status] ?? data?.fiche?.status}</span>

    <nav>
      <ul class="space-y-0">
        {#if canEdit}
          <li>
            <a href={`/fiche-event/${id}/edition`} onclick={close}
                class={`group block px-3 py-2 transition-colors text-end ${page.url.pathname.includes('edition') ? 'bg-dark-primary text-text-main' : 'text-text-muted hover:text-text-main active:text-text-main hover:bg-linear-to-r active:bg-linear-to-r hover:from-dark-secondary active:from-dark-secondary hover:to-dark-primary active:to-dark-primary'}`}>
                Édition
                <svg class={`w-4 h-4 inline-block ml-1 ${page.url.pathname.includes('edition') ? '' : 'opacity-0 transform translate-x-1 group-hover:opacity-100 group-active:opacity-100 group-hover:translate-x-0 group-active:translate-x-0 transition-all duration-150'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </a>
          </li>
        {/if}
        {#if data?.fiche?.status !== 'brouillon'}
        <li>
          <a href={`/fiche-event/${id}/resume`} onclick={close}
            class={`group block px-3 py-2 transition-colors text-end ${page.url.pathname.includes('resume') ? 'bg-dark-primary text-text-main' : 'text-text-muted hover:text-text-main active:text-text-main hover:bg-linear-to-r active:bg-linear-to-r hover:from-dark-secondary active:from-dark-secondary hover:to-dark-primary active:to-dark-primary'}`}>
            Résumé
            <svg class={`w-4 h-4 inline-block ml-1 ${page.url.pathname.includes('resume') ? '' : 'opacity-0 transform translate-x-1 group-hover:opacity-100 group-active:opacity-100 group-hover:translate-x-0 group-active:translate-x-0 transition-all duration-150'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </li>
        <li>
          <a href={`/fiche-event/${id}/messagerie`} onclick={close}
            class={`group block px-3 py-2 transition-colors text-end ${page.url.pathname.includes('messagerie') ? 'bg-dark-primary text-text-main' : 'text-text-muted hover:text-text-main active:text-text-main hover:bg-linear-to-r active:bg-linear-to-r hover:from-dark-secondary active:from-dark-secondary hover:to-dark-primary active:to-dark-primary'}`}>
            Messagerie
            <svg class={`w-4 h-4 inline-block ml-1 ${page.url.pathname.includes('messagerie') ? '' : 'opacity-0 transform translate-x-1 group-hover:opacity-100 group-active:opacity-100 group-hover:translate-x-0 group-active:translate-x-0 transition-all duration-150'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </li>
        {/if}
      </ul>
    </nav>


    <div class="absolute bottom-0 left-0 right-0 flex flex-col mx-5 mb-5 gap-2 text-xs text-text-muted/50">
      <a href="/mentions-legales" class="hover:text-text-main active:text-text-main" onclick={close}>Mentions légales</a>
      <a href="/politique-de-confidentialite" class="hover:text-text-main active:text-text-main" onclick={close}>Politique de confidentialité</a>
      <a href="/conditions-d-utilisation" class="hover:text-text-main active:text-text-main" onclick={close}>Conditions d’utilisation</a>
      <p class="hover:text-text-main active:text-text-main">© 2026 Hub Fiches Event</p>
    </div>



  </aside>

  <main class="md:ml-64 px-5">
    {@render children()}
  </main>

</div>