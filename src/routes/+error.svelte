<script lang="ts">
  import { page } from '$app/state'
</script>

<div class="min-h-screen bg-dark-terciary flex items-center justify-center">
  <div class="text-center space-y-4">

    <p class="text-6xl font-bold text-text-muted">{page.status}</p>

    {#if page.status === 404}
      <h1 class="text-2xl font-bold text-text-main">Page introuvable</h1>
      <p class="text-text-muted">Cette fiche n'existe pas ou a été supprimée.</p>
    {:else if page.status === 403}
      <h1 class="text-2xl font-bold text-text-main">Accès refusé</h1>
      <p class="text-text-muted">Vous n'avez pas les droits pour accéder à cette page.</p>
    {:else}
      <h1 class="text-2xl font-bold text-text-main">Une erreur est survenue</h1>
      <p class="text-text-muted">{page.error?.message ?? 'Erreur inconnue'}</p>
    {/if}

    <a href="/dashboard" class="inline-block mt-4 bg-blue-link hover:bg-blue-link/80 active:bg-blue-link/80 text-white px-4 py-2 rounded-lg transition-colors">
      Retour au dashboard
    </a>

  </div>
</div>