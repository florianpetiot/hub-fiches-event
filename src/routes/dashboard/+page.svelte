<script lang="ts">
	import { formatDateSmart } from '$lib/date';
    import type { PageData } from './$types'

    export let data: PageData

    // recalc when `data` changes
    $: isClub = data?.profile?.roles.name === 'club'

    const statusLabel: Record<string, string> = {
        brouillon: 'Brouillon',
        soumise: 'Soumise',
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

<div class="md:ml-10 mt-6">
    <div class="flex flex-col gap-8">
        {#key data}
            {#if data}
                {#await Promise.resolve(data.forms ?? []) then forms}
                    <!-- prepare groups -->
                    {@const allForms = forms}
                    {@const aVousDeSigner = allForms.filter((f: any) => f.monTour)}
                    {@const inProgress = allForms.filter((f: any) => ['brouillon','soumise','en_revision'].includes(f.status) && !f.monTour)}
                    {@const validated = allForms.filter((f: any) => f.status === 'validee')}
                    {@const refused = allForms.filter((f: any) => f.status === 'refusee')}

                    {@const titles = isClub ? ['En cours de traitement','Validées','Refusées'] : ['À vous de signer', 'En cours de traitement','Validées','Refusées']}

                    <!-- Column: À vous de signer -->
                    {#if !isClub}
                    <div>
                        <h2 class="text-lg font-semibold text-white mb-3">{titles[0]} ({aVousDeSigner.length})</h2>
                        <div class="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-5">
                            {#each aVousDeSigner as form}
                                <a href={`/fiche-event/${form.id}/`} class="w-full md:w-48 md:aspect-square flex flex-row md:flex-col md:justify-center md:items-center items-center justify-between gap-3 p-3 md:p-4 bg-dark-secondary text-white border border-dark-primary cursor-pointer rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors md:text-center">
                                    <div class="flex-1 md:flex-none">
                                        <p class="font-bold md:mb-2">{form.title}</p>
                                        <p class="text-gray-400 text-sm md:mb-2">{formatDateSmart(form.event_date, { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                                    </div>
                                    <div class={statusColor[form.status] + ' px-2 py-1 rounded text-xs font-bold shrink-0'}>{statusLabel[form.status] ?? form.status}</div>
                                </a>
                            {/each}
                            {#if aVousDeSigner.length === 0}
                                <p class="text-gray-400 text-sm italic py-4">Aucune fiche en attente de votre signature.</p>
                            {/if}
                        </div>
                    </div>
                    {/if}

                    <!-- Column: En cours / À traiter -->
                    <div>
                        <h2 class="text-lg font-semibold text-white mb-3">{isClub ? titles[0] : titles[1]} ({inProgress.length})</h2>
                        <div class="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-5">
                            {#if isClub}
                                <form method="POST" action="?/creerFiche" class="w-full md:w-48">
                                    <button type="submit" class="w-full h-16 md:h-auto md:aspect-square flex flex-row md:flex-col justify-between md:justify-center items-center px-4 md:px-0 gap-2 bg-dark-tertiary text-white border border-dark-primary rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors">
                                        <p class="font-bold md:text-center">Nouvelle<br class="hidden md:block" /> fiche event</p>
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                    </button>
                                </form>
                            {/if}

                            {#each inProgress as form}
                                <a href={`/fiche-event/${form.id}/`} class="w-full md:w-48 md:aspect-square flex flex-row md:flex-col md:justify-center md:items-center items-center justify-between gap-3 p-3 md:p-4 bg-dark-secondary text-white border border-dark-primary cursor-pointer rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors md:text-center">
                                    <div class="flex-1 md:flex-none">
                                        <p class="font-bold md:mb-2">{form.title}</p>
                                        <p class="text-gray-400 text-sm md:mb-2">{formatDateSmart(form.event_date, { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                                    </div>
                                    <div class={statusColor[form.status] + ' px-2 py-1 rounded text-xs font-bold shrink-0'}>{statusLabel[form.status] ?? form.status}</div>
                                </a>
                            {/each}
                        </div>
                    </div>

                    <!-- Column: Validés -->
                    <div>
                        <h2 class="text-lg font-semibold text-white mb-3">{isClub ? titles[1] : titles[2]} ({validated.length})</h2>
                        <div class="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-5">
                            {#each validated as form}
                                <a href={`/fiche-event/${form.id}/`} class="w-full md:w-48 md:aspect-square flex flex-row md:flex-col md:justify-center md:items-center items-center justify-between gap-3 p-3 md:p-4 bg-dark-secondary text-white border border-dark-primary cursor-pointer rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors md:text-center">
                                    <div class="flex-1 md:flex-none">
                                        <p class="font-bold md:mb-2">{form.title}</p>
                                        <p class="text-gray-400 text-sm md:mb-2">{formatDateSmart(form.event_date, { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                                    </div>
                                    <div class={statusColor[form.status] + ' px-2 py-1 rounded text-xs font-bold shrink-0'}>{statusLabel[form.status] ?? form.status}</div>
                                </a>
                            {/each}
                        </div>
                    </div>

                    <!-- Column: Refusés -->
                    <div>
                        <h2 class="text-lg font-semibold text-white mb-3">{isClub ? titles[2] : titles[3]} ({refused.length})</h2>
                        <div class="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-5">
                            {#each refused as form}
                                <a href={`/fiche-event/${form.id}/`} class="w-full md:w-48 md:aspect-square flex flex-row md:flex-col md:justify-center md:items-center items-center justify-between gap-3 p-3 md:p-4 bg-dark-secondary text-white border border-dark-primary cursor-pointer rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors md:text-center">
                                    <div class="flex-1 md:flex-none">
                                        <p class="font-bold md:mb-2">{form.title}</p>
                                        <p class="text-gray-400 text-sm md:mb-2">{formatDateSmart(form.event_date, { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                                    </div>
                                    <div class={statusColor[form.status] + ' px-2 py-1 rounded text-xs font-bold shrink-0'}>{statusLabel[form.status] ?? form.status}</div>
                                </a>
                            {/each}
                        </div>
                    </div>
                {/await}
            {/if}
        {/key}
    </div>
</div>


