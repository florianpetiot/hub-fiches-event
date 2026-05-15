<script lang="ts">
	import { formatDateSmart } from '$lib/date';
    import type { PageData } from './$types'

    export let data: PageData

    // recalc when `data` changes
    $: isClub = data?.profile?.roles.name === 'club'

    const getFormHref = (form: any) => {
        if (!isClub) return `/fiche-event/${form.id}/resume`
        if (form.status === 'brouillon' || form.status === 'en_revision') {
            return `/fiche-event/${form.id}/edition`
        }
        return `/fiche-event/${form.id}/resume`
    }

    const statusLabel: Record<string, string> = {
        brouillon: 'Brouillon',
        soumise: 'Soumise',
        en_revision: 'En révision',
        validee: 'Validée',
        refusee: 'Refusée'
    }

    const statusColor: Record<string, string> = {
        brouillon: 'bg-dark-blue-bg text-dark-blue-accent border border-dark-blue-accent',
        soumise: 'bg-dark-yellow-bg text-dark-yellow-accent border border-dark-yellow-accent',
        en_revision: 'bg-dark-orange-bg text-dark-orange-accent border border-dark-orange-accent',
        validee: 'bg-dark-green-bg text-dark-green-accent border border-dark-green-accent',
        refusee: 'bg-dark-red-bg text-dark-red-accent border border-dark-red-accent'
    }
</script>


<h1 class="text-2xl font-bold text-text-main ml-0 md:mx-5 mt-5">Dashboard</h1>

<div class="md:mx-5 mt-6">
    <div class="flex flex-col gap-8">
        {#key data}
            {#if data}
                {#await data.forms}
                    <div class="space-y-8 skeleton-fade-in">
                        {#each [1, 2, 3] as _}
                            <section>
                                <div class="h-6 w-56 bg-dark-primary rounded mb-3 animate-pulse"></div>
                                <div class="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-5">
                                    {#each [1, 2, 3, 4] as i}
                                        <div class="w-full animate-pulse md:w-48 md:aspect-square flex flex-row md:flex-col md:justify-center md:items-center items-center justify-between gap-3 p-3 md:p-4 bg-dark-secondary border border-dark-primary rounded-lg md:text-center">
                                            <div class="flex-1 md:flex-none">
                                                <div class="h-5 w-36 md:w-28 bg-dark-primary rounded md:mx-auto md:mb-2"></div>
                                                <div class="h-4 w-24 md:w-20 bg-dark-primary rounded mt-2 md:mx-auto md:mb-2"></div>
                                            </div>
                                            <div class={`h-6 rounded text-xs font-bold shrink-0 w-16 bg-dark-primary`}></div>
                                        </div>
                                    {/each}
                                </div>
                            </section>
                        {/each}
                    </div>
                {:then dashboard}
                    <!-- prepare groups -->
                    {@const allForms = dashboard.forms}
                    {@const unreadByForm = new Set(dashboard.unreadByForm ?? [])}
                    {@const aVousDeSigner = allForms.filter((f: any) => f.monTour)}
                    {@const inProgress = allForms.filter((f: any) => ['brouillon','soumise','en_revision'].includes(f.status) && !f.monTour)}
                    {@const validated = allForms.filter((f: any) => f.status === 'validee')}
                    {@const refused = allForms.filter((f: any) => f.status === 'refusee')}

                    {@const titles = isClub ? ['En cours de traitement','Validées','Refusées'] : ['À vous de signer', 'En cours de traitement','Validées','Refusées']}

                    <!-- Column: À vous de signer -->
                    {#if !isClub}
                    <div>
                        <h2 class="text-lg font-semibold text-text-main mb-3">{titles[0]} ({aVousDeSigner.length})</h2>
                        <div class="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-5">
                            {#each aVousDeSigner as form}
                                <a href={getFormHref(form)} class="w-full shadow md:w-48 md:aspect-square relative flex flex-row md:flex-col md:justify-center md:items-center items-center justify-between gap-3 p-3 md:p-4 bg-dark-secondary text-text-main border border-dark-primary cursor-pointer rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors md:text-center">
                                    {#if unreadByForm.has(form.id)}
                                        <span class="absolute md:top-3 md:right-3 md:w-3 md:h-3 top-1 right-1 w-2 h-2 rounded-full bg-dark-red-accent z-10" aria-label="Messages non lus"></span>
                                    {/if}
                                    <div class="flex-1 md:flex-none">
                                        <p class="font-bold md:mb-2">{form.title}</p>
                                        <p class="text-text-muted text-sm md:mb-2">{formatDateSmart(form.event_date, { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                                    </div>
                                    <div class={statusColor[form.status] + ' px-2 py-1 rounded text-xs font-bold shrink-0'}>{statusLabel[form.status] ?? form.status}</div>
                                </a>
                            {/each}
                            {#if aVousDeSigner.length === 0}
                                <p class="text-text-muted text-sm italic py-4">Aucune fiche en attente de votre signature.</p>
                            {/if}
                        </div>
                    </div>
                    {/if}

                    <!-- Column: En cours / À traiter -->
                    <div>
                        <h2 class="text-lg font-semibold text-text-main mb-3">{isClub ? titles[0] : titles[1]} ({inProgress.length})</h2>
                        <div class="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-5">
                            {#if isClub}
                                <form method="POST" action="?/creerFiche" class="w-full md:w-48">
                                    <button type="submit" class="w-full shadow h-16 md:h-auto md:aspect-square flex flex-row md:flex-col justify-between md:justify-center items-center px-4 md:px-0 gap-2 bg-dark-terciary text-text-main border border-dark-primary rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors">
                                        <p class="font-bold md:text-center">Nouvelle<br class="hidden md:block" /> fiche event</p>
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                    </button>
                                </form>
                            {/if}

                            {#each inProgress as form}
                                <a href={getFormHref(form)} class="w-full shadow md:w-48 md:aspect-square relative flex flex-row md:flex-col md:justify-center md:items-center items-center justify-between gap-3 p-3 md:p-4 bg-dark-secondary text-text-main border border-dark-primary cursor-pointer rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors md:text-center">
                                    {#if unreadByForm.has(form.id)}
                                        <span class="absolute md:top-3 md:right-3 md:w-3 md:h-3 top-1 right-1 w-2 h-2 rounded-full bg-dark-red-accent z-10" aria-label="Messages non lus"></span>
                                    {/if}
                                    <div class="flex-1 md:flex-none">
                                        <p class="font-bold md:mb-2">{form.title}</p>
                                        <p class="text-text-muted text-sm md:mb-2">{formatDateSmart(form.event_date, { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                                    </div>
                                    <div class={statusColor[form.status] + ' px-2 py-1 rounded text-xs font-bold shrink-0'}>{statusLabel[form.status] ?? form.status}</div>
                                </a>
                            {/each}
                        </div>
                    </div>

                    <!-- Column: Validés -->
                    <div>
                        <h2 class="text-lg font-semibold text-text-main mb-3">{isClub ? titles[1] : titles[2]} ({validated.length})</h2>
                        <div class="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-5">
                            {#each validated as form}
                                <a href={getFormHref(form)} class="w-full shadow md:w-48 md:aspect-square relative flex flex-row md:flex-col md:justify-center md:items-center items-center justify-between gap-3 p-3 md:p-4 bg-dark-secondary text-text-main border border-dark-primary cursor-pointer rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors md:text-center">
                                    {#if unreadByForm.has(form.id)}
                                        <span class="absolute md:top-3 md:right-3 md:w-3 md:h-3 top-1 right-1 w-2 h-2 rounded-full bg-dark-red-accent z-10" aria-label="Messages non lus"></span>
                                    {/if}
                                    <div class="flex-1 md:flex-none">
                                        <p class="font-bold md:mb-2">{form.title}</p>
                                        <p class="text-text-muted text-sm md:mb-2">{formatDateSmart(form.event_date, { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                                    </div>
                                    <div class={statusColor[form.status] + ' px-2 py-1 rounded text-xs font-bold shrink-0'}>{statusLabel[form.status] ?? form.status}</div>
                                </a>
                            {/each}
                        </div>
                    </div>

                    <!-- Column: Refusés -->
                    <div>
                        <h2 class="text-lg font-semibold text-text-main mb-3">{isClub ? titles[2] : titles[3]} ({refused.length})</h2>
                        <div class="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-5">
                            {#each refused as form}
                                <a href={getFormHref(form)} class="w-full shadow md:w-48 md:aspect-square relative flex flex-row md:flex-col md:justify-center md:items-center items-center justify-between gap-3 p-3 md:p-4 bg-dark-secondary text-text-main border border-dark-primary cursor-pointer rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors md:text-center">
                                    {#if unreadByForm.has(form.id)}
                                        <span class="absolute md:top-3 md:right-3 md:w-3 md:h-3 top-1 right-1 w-2 h-2 rounded-full bg-dark-red-accent z-10" aria-label="Messages non lus"></span>
                                    {/if}
                                    <div class="flex-1 md:flex-none">
                                        <p class="font-bold md:mb-2">{form.title}</p>
                                        <p class="text-text-muted text-sm md:mb-2">{formatDateSmart(form.event_date, { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
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

<style>
    .skeleton-fade-in {
        opacity: 0;
        animation: skeletonFadeIn 200ms ease-out 200ms forwards;
    }

    @keyframes skeletonFadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .skeleton-fade-in {
            opacity: 1;
            animation: none;
        }
    }
</style>


