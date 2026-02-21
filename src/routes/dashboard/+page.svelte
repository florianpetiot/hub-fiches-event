<script lang="ts">
    import { writable } from 'svelte/store'
    import type { PageData } from './$types'

    // reactive state for the sidebar (use store so template sees updates)
    const open = writable(false)
    const toggle = () => open.update(v => !v)
    const close = () => open.set(false)

    export let data: PageData

    // recalc when `data` changes
    $: isClub = data?.profile?.role === 'club'

    const statusLabel: Record<string, string> = {
        brouillon: 'Brouillon',
        soumise: 'En attente',
        en_revision: 'En révision',
        validee: 'Validée',
        refusee: 'Refusée'
    }

    const statusColor: Record<string, string> = {
        brouillon: 'bg-dark-primary text-white',
        soumise: 'bg-dark-yellow-accent text-black',
        en_revision: 'bg-dark-orange-accent text-black',
        validee: 'bg-dark-green-accent text-black',
        refusee: 'bg-dark-red-accent text-white'
    }
</script>

<div class="min-h-screen bg-dark-terciary">

    <!-- mobile header -->
    <header class="md:hidden flex items-center justify-between p-4 bg-dark-secondary text-white">
        <button aria-label="Ouvrir le menu" aria-expanded={$open} onclick={toggle} class="p-2 rounded hover:bg-dark-primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <h1 class="text-lg font-bold">Dashboard</h1>
    </header>

    <!-- overlay for mobile when open -->
    {#if $open}
        <div class="fixed inset-0 bg-black/50 z-30 md:hidden" role="button" tabindex="0" aria-label="Fermer le menu" onclick={close} onkeydown={e => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && close()}></div>
    {/if}

    <!-- left panel -->
    <aside class={`fixed inset-y-0 left-0 w-64 bg-dark-secondary p-5 text-white border-r border-dark-primary transform ${$open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-40`}>
        <h2 class="text-xl font-bold mb-4">Menu</h2>
        <ul>
            <li class="mb-2"><button type="button" class="hover:underline">Dashboard</button></li>
            <li class="mb-2"><button type="button" class="hover:underline">Fiches Event</button></li>
            <li class="mb-2"><button type="button" class="hover:underline">Paramètres</button></li>
        </ul>
    </aside>

    <!-- main content: add left margin on md+ to account for sidebar -->
    <main class="md:ml-64 p-5">
        <h1 class="text-2xl font-bold text-white ml-0 md:ml-10 mt-5">Dashboard</h1>

        <div class="md:ml-10 mt-10 flex flex-wrap gap-5">
            {#if isClub}
            <div class="flex flex-col justify-center items-center gap-5 p-5 bg-dark-tertiary text-white border border-dark-primary cursor-pointer w-50 rounded-lg aspect-square hover:bg-dark-secondary transition-colors">
                <p class="text-center font-bold">Nouvelle<br>fiche-event</p>
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </div>
            {/if}

            <div class="flex flex-col justify-center items-center gap-5 p-5 bg-dark-secondary text-white border border-dark-primary cursor-pointer w-50 rounded-lg aspect-square hover:bg-dark-primary transition-colors">
                <div>
                    <p class="text-center font-bold">Polyflette</p>
                    <p class="text-center text-gray-400">16/02/26</p>
                </div>
                <div class="bg-dark-primary px-2 py-1 rounded text-xs font-bold">Brouillon</div>
            </div>

            <div class="flex flex-col justify-center items-center gap-5 p-5 bg-dark-secondary text-white border border-dark-primary cursor-pointer w-50 rounded-lg aspect-square hover:bg-dark-primary transition-colors">
                <div>
                    <p class="text-center font-bold">Polyflette</p>
                    <p class="text-center text-gray-400">16/02/26</p>
                </div>
                <div class="bg-dark-red-accent px-2 py-1 rounded text-xs font-bold">Refusée</div>
            </div>

            <div class="flex flex-col justify-center items-center gap-5 p-5 bg-dark-secondary text-white border border-dark-primary cursor-pointer w-50 rounded-lg aspect-square hover:bg-dark-primary transition-colors">
                <div>
                    <p class="text-center font-bold">Polyflette</p>
                    <p class="text-center text-gray-400">16/02/26</p>
                </div>
                <div class="bg-dark-yellow-accent px-2 py-1 rounded text-xs text-black font-bold">Soumise</div>
            </div>

            <div class="flex flex-col justify-center items-center gap-5 p-5 bg-dark-secondary text-white border border-dark-primary cursor-pointer w-50 rounded-lg aspect-square hover:bg-dark-primary transition-colors">
                <div>
                    <p class="text-center font-bold">Polyflette</p>
                    <p class="text-center text-gray-400">16/02/26</p>
                </div>
                <div class="bg-dark-orange-accent px-2 py-1 rounded text-xs text-black font-bold">En révision</div>
            </div>

            <div class="flex flex-col justify-center items-center gap-5 p-5 bg-dark-secondary text-white border border-dark-primary cursor-pointer w-50 rounded-lg aspect-square hover:bg-dark-primary transition-colors">
                <div>
                    <p class="text-center font-bold">Polyflette</p>
                    <p class="text-center text-gray-400">16/02/26</p>
                </div>
                <div class="bg-dark-green-accent px-2 py-1 rounded text-xs text-black font-bold">Validée</div>
            </div>

            {#each data.forms ?? [] as form}
                <div class="flex flex-col justify-center items-center gap-5 p-5 bg-dark-secondary text-white border border-dark-primary cursor-pointer w-50 rounded-lg aspect-square hover:bg-dark-primary transition-colors">
                    <div>
                        <p class="text-center font-bold">{form.title}</p>
                        <p class="text-center text-gray-400">{form.event_date}</p>
                    </div>
                    <div class={statusColor[form.status] + ' px-2 py-1 rounded text-xs font-bold'}>{statusLabel[form.status] ?? form.status}</div>
                </div>
            {/each}
        </div>
    </main>

</div>