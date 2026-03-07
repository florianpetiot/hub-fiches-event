<script lang="ts">
  import { enhance } from '$app/forms'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'


  let { data, actionData }: { data: any, actionData: any } = $props()

  function hasError(obj: unknown): obj is { error: string } {
    return typeof obj === 'object' && obj !== null && 'error' in obj
  }
  function hasSuccess(obj: unknown): obj is { success: boolean } {
    return typeof obj === 'object' && obj !== null && 'success' in obj
  }

  let newEmail = $state('')
  let newName = $state('')
  let clubToDelete = $state<string | null>(null) // id du club à supprimer
  let nameClubToDelete = $state<string | null>(null)
  let deleteFormEl = $state<HTMLFormElement>()

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
</script>

<div class="space-y-6 mb-6">

  <!-- CRÉER UN CLUB -->
  <section class="bg-dark-secondary rounded-lg p-6 space-y-4">
    <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">
      Créer un compte club
    </h2>
    <p class="text-sm text-gray-400">
      Un email d'invitation sera envoyé au club pour qu'il définisse son mot de passe.
    </p>

    <form method="POST" action="?/creerClub" use:enhance={() => {
      return ({ update }) => { update({ reset: false }); newEmail = ''; newName = '' }
    }} class="space-y-3">

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label for="newName" class="block text-xs text-gray-400 uppercase mb-1">Nom du club</label>
          <input id="newName" name="name" type="text" bind:value={newName}
            placeholder="Ex : BDE Polytech"
            class="w-full bg-dark-primary text-white rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm" />
        </div>
        <div>
          <label for="newEmail" class="block text-xs text-gray-400 uppercase mb-1">Email</label>
          <input id="newEmail" name="email" type="email" bind:value={newEmail}
            placeholder="club@polytech.fr"
            class="w-full bg-dark-primary text-white rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm" />
        </div>
      </div>

      <div class="flex justify-between items-center">
        <div>
          {#if hasError(actionData?.creerClub)}
            <p class="text-red-400 text-xs">{actionData.creerClub.error}</p>
          {/if}
          {#if hasSuccess(actionData?.creerClub)}
            <p class="text-green-400 text-xs">✓ Invitation envoyée</p>
          {/if}
        </div>
        <button type="submit" disabled={!newEmail.trim() || !newName.trim()}
          class="border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white disabled:opacity-30 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Envoyer l'invitation
        </button>
      </div>

    </form>
  </section>

  <!-- LISTE DES CLUBS -->
  <section class="bg-dark-secondary rounded-lg p-6 space-y-4">
    <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">
      Clubs enregistrés ({data.clubs?.length ?? 0})
    </h2>

    {#if data.clubs?.length === 0}
      <p class="text-gray-500 text-sm italic">Aucun club enregistré pour l'instant.</p>
    {/if}

    <div class="space-y-2">
      {#each data.clubs ?? [] as club}
        <div class="flex items-center justify-between bg-dark-secondary border border-dark-primary rounded-lg px-4 py-3">
          <div>
            <p class="text-white text-sm font-medium">{club.name}</p>
            <p class="text-gray-400 text-xs">{club.email}</p>
            <p class="text-gray-500 text-xs">Créé le {formatDate(club.created_at)}</p>
          </div>

            <button type="button" onclick={() => { clubToDelete = club.id; nameClubToDelete = club.name }}
              class="text-red-400 hover:text-white hover:bg-red-500 rounded text-xs px-2 py-1 transition-colors">
              Supprimer
            </button>
        </div>
      {/each}
    </div>

    {#if hasSuccess(actionData?.supprimerClub)}
      <p class="text-green-400 text-xs">✓ Club supprimé</p>
    {/if}
  </section>

  {#if clubToDelete}
    <ConfirmModal
      title="Supprimer le club ?"
      description="Cette action est irréversible. L'ensemble des fiches-event, messages et documents associés au club {nameClubToDelete} seront supprimés. Pour confirmer, écrivez <strong class='text-white font-mono'>supprimer {nameClubToDelete}</strong> ci-dessous."
      confirmWord="supprimer {nameClubToDelete}"
      confirmLabel="Supprimer le club"
      accentColor="red"
      onconfirm={() => { deleteFormEl?.requestSubmit(); clubToDelete = null }}
      oncancel={() => { clubToDelete = null }}
    />

    <form bind:this={deleteFormEl} method="POST" action="?/supprimerClub" use:enhance class="hidden">
      <input type="hidden" name="id" value={clubToDelete} />
    </form>
  {/if}

</div>