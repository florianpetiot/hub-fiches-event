<script lang="ts">
    import { writable } from 'svelte/store'

    const open = writable(false)
    const toggle = () => open.update(v => !v)
    const close = () => open.set(false)

    let { children } = $props()
</script>

<div class="min-h-screen bg-dark-terciary">

    <header class="md:hidden flex items-center justify-between p-4 bg-dark-secondary text-white">
        <button aria-label="Ouvrir le menu" aria-expanded={$open} onclick={toggle} class="p-2 rounded hover:bg-dark-primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <h1 class="text-lg font-bold">Dashboard</h1>
    </header>

    {#if $open}
        <div class="fixed inset-0 bg-black/50 z-30 md:hidden" role="button" tabindex="0" aria-label="Fermer le menu" onclick={close} onkeydown={e => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && close()}></div>
    {/if}

    <aside class={`fixed inset-y-0 left-0 w-64 bg-dark-secondary p-5 text-white border-r border-dark-primary transform ${$open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-40`}>
        <h2 class="text-xl font-bold mb-4">Menu</h2>
        <ul>
            <li class="mb-2"><a href="/dashboard" class="hover:underline">Dashboard</a></li>
            <li class="mb-2"><button type="button" class="hover:underline">Paramètres</button></li>
        </ul>
    </aside>

    <main class="md:ml-64 p-5">
        {@render children()}
    </main>

</div>