<script lang="ts">
    import { formatDateSmart } from '$lib/date'
    import { enhance } from '$app/forms'

    let { form, href, isUnread = false, isClub = false }: {
        form: { id: string; title: string | null; event_date: string | null; status: string };
        href: string;
        isUnread?: boolean;
        isClub?: boolean;
    } = $props()

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

    let menuOpen = $state(false)
    let showModal = $state(false)

    function toggleMenu(e: MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        menuOpen = !menuOpen
    }

    function openModal(e: MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        menuOpen = false
        showModal = true
    }

    function closeModal() {
        showModal = false
    }

    function handleClickOutside(e: MouseEvent) {
        menuOpen = false
    }
</script>

<!-- Wrapper relatif pour positionner le menu flottant -->
<div class="relative w-full md:w-48 group">

    <!-- Carte principale -->
    <div 
        class="w-full shadow md:aspect-square relative flex flex-row md:flex-col md:justify-center md:items-center items-center justify-between gap-3 p-3 md:p-4 bg-dark-secondary text-text-main border border-dark-primary rounded-lg hover:bg-dark-primary active:bg-dark-primary transition-colors md:text-center"
    >
        <!-- Lien invisible recouvrant toute la carte -->
        <a href={href} class="absolute inset-0 z-10 rounded-lg outline-none cursor-pointer" aria-label={form.title}></a>

        {#if isUnread}
            <!-- Desktop : dépasse hors de la carte en haut à droite comme une notif d'app -->
            <span class="hidden md:block absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-dark-red-accent z-30 pointer-events-none" aria-label="Messages non lus"></span>
            <!-- Mobile : coin intérieur haut droit -->
            <span class="md:hidden absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-dark-red-accent z-20 pointer-events-none" aria-label="Messages non lus"></span>
        {/if}

        <div class="flex-1 md:flex-none">
            <p class="font-bold md:mb-2 relative z-20 pointer-events-none event-title">{form.title}</p>
            <p class="text-text-muted text-sm md:mb-2 relative z-20 pointer-events-none">
                {formatDateSmart(form.event_date, { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </p>
        </div>

        <div class="flex items-center gap-2 z-20">
            <div class="{statusColor[form.status]} px-2 py-1 rounded text-xs font-bold shrink-0 pointer-events-none">
                {statusLabel[form.status] ?? form.status}
            </div>

            <!-- Bouton ⋯ : inline flex sur mobile, et absolute top-right sur desktop -->
            {#if isClub}
                <button
                    type="button"
                    onclick={toggleMenu}
                    class="md:absolute md:top-2 md:right-2 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-main hover:bg-dark-terciary transition-colors z-20 relative cursor-pointer"
                    aria-label="Options"
                >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.5"/>
                        <circle cx="12" cy="12" r="1.5"/>
                        <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                </button>
            {/if}
        </div>
    </div>

    <!-- Menu flottant -->
    {#if menuOpen}
        <!-- Overlay invisible pour fermer au clic extérieur -->
        <button
            type="button"
            class="fixed inset-0 z-20"
            onclick={handleClickOutside}
            aria-label="Fermer le menu"
        ></button>

        <div class="absolute top-9 right-2 z-30 bg-dark-secondary border border-dark-primary rounded shadow-xl overflow-hidden min-w-40">
            <button
                type="button"
                onclick={openModal}
                class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-main hover:bg-dark-primary transition-colors text-left"
            >
                <svg class="w-4 h-4 text-text-text-main shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                Dupliquer la fiche
            </button>
        </div>
    {/if}
</div>

<!-- Modale de confirmation -->
{#if showModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Fond sombre -->
        <button
            type="button"
            class="absolute inset-0 bg-black/60"
            onclick={closeModal}
            aria-label="Fermer"
        ></button>

        <!-- Contenu modale -->
        <div class="relative bg-dark-secondary rounded-xl border border-dark-primary p-6 w-full max-w-sm space-y-4 shadow-2xl">

            <div class="flex items-center gap-4">
                <!-- Icône -->
                <div class="w-10 h-10 rounded-lg bg-dark-primary flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-link" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                </div>
                <h2 class="text-text-main font-semibold text-base">Dupliquer cette fiche ?</h2>
            </div>

            <div>
                <p class="text-text-main text-sm mt-1">
                    Une nouvelle fiche sera créée avec les mêmes informations que <span class="font-medium">« {form.title} »</span>.
                </p>
                <p class="text-text-muted text-xs mt-2">
                    Les documents uploadés, les messages et les signatures ne seront pas copiés.
                </p>
            </div>

            <!-- Actions -->
            <div class="grid grid-cols-2 gap-3 pt-1">
                <button
                    type="button"
                    onclick={closeModal}
                    class="w-full px-4 py-2 text-sm text-text-muted border border-dark-primary rounded-lg hover:bg-dark-primary hover:text-text-main transition-colors"
                >
                    Annuler
                </button>

                <form
                    method="POST"
                    action="/dashboard?/dupliquerFiche"
                    use:enhance={() => {
                        closeModal()
                        return ({ update }) => update()
                    }}
                    class="w-full"
                >
                    <input type="hidden" name="form_id" value={form.id} />
                    <button
                        type="submit"
                        class="w-full px-4 py-2 text-sm font-medium bg-blue-link hover:bg-blue-link/80 text-white rounded-lg transition-colors"
                    >
                        Dupliquer
                    </button>
                </form>
            </div>
        </div>
    </div>
{/if}

<style>
    .event-title {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1; /* mobile: 1 ligne */
        line-clamp: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal; /* permettre le wrapping quand >1 ligne */
    }

    @media (min-width: 768px) {
        .event-title {
            -webkit-line-clamp: 2; /* desktop: 2 lignes */
            line-clamp: 2;
        }
    }
</style>