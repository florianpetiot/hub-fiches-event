<script lang="ts">
    import type { PageData } from './$types'

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


<h1 class="text-2xl font-bold text-white ml-0 md:ml-10 mt-5">Dashboard</h1>

<div class="md:ml-10 mt-10 flex flex-wrap gap-5">
    {#if isClub}
    <form method="POST" action="?/creerFiche">
        <button type="submit" class="flex flex-col justify-center items-center gap-5 p-5 bg-dark-tertiary text-white border border-dark-primary cursor-pointer w-50 rounded-lg aspect-square hover:bg-dark-secondary transition-colors">
            <p class="text-center font-bold">Nouvelle<br>fiche-event</p>
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
    </form>
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
        <a href={`/fiche-event/${form.id}/edition`} class="flex flex-col justify-center items-center gap-5 p-5 bg-dark-secondary text-white border border-dark-primary cursor-pointer w-50 rounded-lg aspect-square hover:bg-dark-primary transition-colors">
            <div>
                <p class="text-center font-bold">{form.title}</p>
                <p class="text-center text-gray-400">{form.event_date}</p>
            </div>
            <div class={statusColor[form.status] + ' px-2 py-1 rounded text-xs font-bold'}>{statusLabel[form.status] ?? form.status}</div>
        </a>
    {/each}
</div>


