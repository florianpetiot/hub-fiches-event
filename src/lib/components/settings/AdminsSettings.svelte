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

  let newAdminEmail = $state('')
  let newAdminName = $state('')
  let newAdminRoleId = $state('')
  let newRoleLabel = $state('')
  let newWorkflowRoleId = $state('')
  let confirmDelete = $state<string | null>(null)
  let nameAdminToDelete = $state<string | null>(null)
  let deleteFormEl = $state<HTMLFormElement>()

  let confirmDeleteRole = $state<string | null>(null)
  let nameRoleToDelete = $state<string | null>(null)
  let roleDeleteFormEl = $state<HTMLFormElement>()

  let confirmChangeRoleAdmin = $state<{ profile_id: string, new_role_id: string, profile_name: string, new_role_label: string } | null>(null)
  let changeRoleFormEl = $state<HTMLFormElement>()

  let confirmDeleteEtape = $state<string | null>(null)
  let nameEtapeToDelete = $state<string | null>(null)
  let etapeDeleteFormEl = $state<HTMLFormElement>()

  let showAddRole = $state(false)

  let savingCreerRole = $state(false)
  let savingSupprimerRole = $state(false)
  let savingCreerAdmin = $state(false)
  let savingSupprimerAdmin = $state(false)
  let savingChangerRoleAdmin = $state(false)
  let savingWorkflow = $state(false)

  let showCreerRoleFeedback = $state(false)
  let showSupprimerRoleFeedback = $state(false)
  let showCreerAdminFeedback = $state(false)
  let showSupprimerAdminFeedback = $state(false)
  let showChangerRoleAdminFeedback = $state(false)
  let showWorkflowFeedback = $state(false)

  let rolesDisponiblesWorkflow = $derived(
    (data.roles ?? []).filter((r: any) =>
      !(data.workflow ?? []).some((e: any) => e.role_id === r.id)
    )
  )

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  $effect(() => {
    if (!newAdminRoleId && (data.roles?.length ?? 0) > 0) {
      const firstNonClubRole = (data.roles ?? []).find((r: any) => r.name !== 'club')
      newAdminRoleId = firstNonClubRole?.id ?? data.roles[0].id
    }
  })

  $effect(() => {
    if (actionData?.creerRole) {
      showCreerRoleFeedback = true
      const t = setTimeout(() => (showCreerRoleFeedback = false), 5000)
      return () => clearTimeout(t)
    }
  })

  $effect(() => {
    if (actionData?.supprimerRole) {
      showSupprimerRoleFeedback = true
      const t = setTimeout(() => (showSupprimerRoleFeedback = false), 5000)
      return () => clearTimeout(t)
    }
  })

  $effect(() => {
    if (actionData?.creerAdmin) {
      showCreerAdminFeedback = true
      const t = setTimeout(() => (showCreerAdminFeedback = false), 5000)
      return () => clearTimeout(t)
    }
  })

  $effect(() => {
    if (actionData?.supprimerAdmin) {
      showSupprimerAdminFeedback = true
      const t = setTimeout(() => (showSupprimerAdminFeedback = false), 5000)
      return () => clearTimeout(t)
    }
  })

  $effect(() => {
    if (actionData?.changerRoleAdmin) {
      showChangerRoleAdminFeedback = true
      const t = setTimeout(() => (showChangerRoleAdminFeedback = false), 5000)
      return () => clearTimeout(t)
    }
  })

  $effect(() => {
    if (actionData?.workflow) {
      showWorkflowFeedback = true
      const t = setTimeout(() => (showWorkflowFeedback = false), 5000)
      return () => clearTimeout(t)
    }
  })

</script>

<div class="space-y-6">
    
  <!-- GESTION DES RÔLES -->
  <section class="bg-dark-secondary rounded-lg p-6 space-y-4">
    <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Rôles</h2>
    <p class="text-xs text-gray-500">Les rôles "Club" et "Direction" sont fixes et ne peuvent pas être supprimés.</p>

    <div class="space-y-3">
      <div class="space-y-2">
        <div class="flex flex-wrap gap-2">
          {#each data.roles ?? [] as role}
            <div class="flex items-center gap-2 bg-dark-primary rounded-full px-3 py-1">
              <span class="text-white text-sm">{role.label}</span>
              {#if role.is_system === false}
                <button type="button" class="text-red-400 hover:text-red-300 active:text-red-300 text-xs ml-1"
                  onclick={() => { confirmDeleteRole = role.id; nameRoleToDelete = role.label }}>
                  ✕
                </button>
              {/if}
            </div>
          {/each}
        </div>

        <div>
          {#if savingCreerRole || savingSupprimerRole}<p class="text-gray-400 text-xs">Enregistrement en cours...</p>{/if}
          {#if showSupprimerRoleFeedback && hasError(actionData?.supprimerRole)}<p class="text-red-400 text-xs">{actionData.supprimerRole.error}</p>{/if}
          {#if showSupprimerRoleFeedback && hasSuccess(actionData?.supprimerRole)}<p class="text-green-400 text-xs">✓ Rôle supprimé</p>{/if}
        </div>

        <!-- Créer un rôle -->
        <form method="POST" action="?/creerRole" use:enhance={() => {
          savingCreerRole = true
          showAddRole = false
          return async ({ update }) => {
            savingCreerRole = false
            await update({ reset: false })
            newRoleLabel = ''
          }
        }} class="space-y-3">
          {#if showAddRole}
            <div class="flex gap-2">
              <input type="text" name="label" bind:value={newRoleLabel} placeholder="Nom du rôle..."
                onkeydown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (newRoleLabel.trim()) e.currentTarget.closest('form')?.requestSubmit()
                  } else if (e.key === 'Escape') {
                    showAddRole = false
                    newRoleLabel = ''
                  }
                }}
                class="flex-1 bg-dark-primary text-white rounded px-3 py-1.5 border border-blue-500 text-sm focus:outline-none" />

              <button type="submit" disabled={!newRoleLabel.trim()} class="text-blue-400 hover:text-blue-300 active:text-blue-300 text-sm px-2">
                OK
              </button>
              <button type="button" onclick={() => { showAddRole = false; newRoleLabel = '' }} class="text-gray-500 hover:text-gray-300 active:text-gray-300 text-sm">Annuler</button>
            </div>
          {:else}
            <button type="button" onclick={() => showAddRole = true} class="text-blue-400 hover:text-blue-300 active:text-blue-300 text-sm">+ Ajouter un rôle</button>
          {/if}

          <div class="flex justify-between items-center">
            <div>
              {#if showCreerRoleFeedback && hasError(actionData?.creerRole)}<p class="text-red-400 text-xs">{actionData.creerRole.error}</p>{/if}
              {#if showCreerRoleFeedback && hasSuccess(actionData?.creerRole)}<p class="text-green-400 text-xs">✓ Rôle créé</p>{/if}
            </div>
          </div>
        </form>
      </div>
    </div>
  </section>

    {#if confirmDeleteRole}
      <ConfirmModal
        title="Supprimer le rôle ?"
        description="Cette action est irréversible. Les références liées au rôle seront supprimées. Pour confirmer, écrivez <strong class='text-white font-mono'>supprimer {nameRoleToDelete}</strong> ci-dessous."
        confirmWord="supprimer {nameRoleToDelete}"
        confirmLabel="Supprimer le rôle"
        accentColor="red"
        onconfirm={() => { roleDeleteFormEl?.requestSubmit(); confirmDeleteRole = null }}
        oncancel={() => { confirmDeleteRole = null }}
      />

      <form bind:this={roleDeleteFormEl} method="POST" action="?/supprimerRole" use:enhance={() => {
        savingSupprimerRole = true
        return async ({ update }) => {
          savingSupprimerRole = false
          await update({ reset: false })
        }
      }} class="hidden">
        <input type="hidden" name="id" value={confirmDeleteRole} />
      </form>
    {/if}

  <!-- COMPTES ADMIN -->
  <section class="bg-dark-secondary rounded-lg p-6 space-y-4">
    <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">
      Comptes staff ({data.admins?.length ?? 0})
    </h2>

    <div class="space-y-2">
      {#each data.admins ?? [] as admin}
        <div class="flex items-center justify-between bg-dark-secondary border border-dark-primary rounded-lg px-4 py-3">
          <div>
            <p class="text-white text-sm font-medium">{admin.name}</p>
            <p class="text-gray-400 text-xs">{admin.email}</p>
            <p class="text-gray-500 text-xs">Créé le {formatDate(admin.created_at)}</p>
          </div>

          <div class="flex items-center gap-2">
            <!-- Changer le rôle -->
            <select
              value={admin.role_id}
              disabled={admin.roles?.name === 'direction'}
              onchange={(e) => {
                const select = e.currentTarget;
                const newRoleId = select.value;
                if (newRoleId === admin.role_id) return;
                const newRoleLabel = select.options[select.selectedIndex].text;
                
                confirmChangeRoleAdmin = {
                  profile_id: admin.id,
                  new_role_id: newRoleId,
                  profile_name: admin.name,
                  new_role_label: newRoleLabel
                };
                
                // Revenir visuellement à l'ancien rôle en attendant la confirmation
                select.value = admin.role_id;
              }}
              class="bg-dark-secondary text-white text-xs rounded pl-2 pr-8 py-1 border border-dark-primary disabled:cursor-not-allowed">
              {#each data.roles ?? [] as role}
                {#if role.name !== 'club' }
                <option value={role.id}>{role.label}</option>
                {/if}
              {/each}
            </select>

            <button type="button" onclick={() => { confirmDelete = admin.id; nameAdminToDelete = admin.name }}
              class="text-red-400 hover:text-red-300 text-xs px-2 py-1">✕</button>
          </div>
        </div>
      {/each}
    </div>

    <div>
      {#if savingCreerAdmin || savingSupprimerAdmin || savingChangerRoleAdmin}<p class="text-gray-400 text-xs">Enregistrement en cours...</p>{/if}
      {#if showChangerRoleAdminFeedback && hasError(actionData?.changerRoleAdmin)}<p class="text-red-400 text-xs">{actionData.changerRoleAdmin.error}</p>{/if}
      {#if showChangerRoleAdminFeedback && hasSuccess(actionData?.changerRoleAdmin)}<p class="text-green-400 text-xs">✓ Rôle mis à jour</p>{/if}
      {#if showSupprimerAdminFeedback && hasError(actionData?.supprimerAdmin)}<p class="text-red-400 text-xs">{actionData.supprimerAdmin.error}</p>{/if}
      {#if showSupprimerAdminFeedback && hasSuccess(actionData?.supprimerAdmin)}<p class="text-green-400 text-xs">✓ Compte supprimé</p>{/if}
    </div>

    {#if confirmChangeRoleAdmin}
      <ConfirmModal
        title="Changer le rôle ?"
        description="Le rôle de {confirmChangeRoleAdmin.profile_name} va devenir <b>{confirmChangeRoleAdmin.new_role_label}</b>. Si son ancien rôle n'est plus utilisé par aucun compte, ses étapes de workflow associées seront supprimées. Pour confirmer, écrivez <strong class='text-white font-mono'>modifier {confirmChangeRoleAdmin.profile_name}</strong> ci-dessous."
        confirmWord="modifier {confirmChangeRoleAdmin.profile_name}"
        confirmLabel="Confirmer"
        accentColor="yellow"
        onconfirm={() => { changeRoleFormEl?.requestSubmit(); confirmChangeRoleAdmin = null }}
        oncancel={() => { confirmChangeRoleAdmin = null }}
      />

      <form bind:this={changeRoleFormEl} method="POST" action="?/changerRoleAdmin" use:enhance={() => {
        savingChangerRoleAdmin = true
        return async ({ update }) => {
          savingChangerRoleAdmin = false
          await update({ reset: false })
        }
      }} class="hidden">
        <input type="hidden" name="profile_id" value={confirmChangeRoleAdmin.profile_id} />
        <input type="hidden" name="role_id" value={confirmChangeRoleAdmin.new_role_id} />
      </form>
    {/if}

    {#if confirmDelete}
      <ConfirmModal
        title="Supprimer le compte ?"
        description="Cette action est irréversible. L'ensemble des messages et signatures associées à {nameAdminToDelete} seront supprimés. Pour confirmer, écrivez <strong class='text-white font-mono'>supprimer {nameAdminToDelete}</strong> ci-dessous."
        confirmWord="supprimer {nameAdminToDelete}"
        confirmLabel="Supprimer le compte"
        accentColor="red"
        onconfirm={() => { deleteFormEl?.requestSubmit(); confirmDelete = null }}
        oncancel={() => { confirmDelete = null }}
      />

      <form bind:this={deleteFormEl} method="POST" action="?/supprimerAdmin" use:enhance={() => {
        savingSupprimerAdmin = true
        return async ({ update }) => {
          savingSupprimerAdmin = false
          await update({ reset: false })
        }
      }} class="hidden">
        <input type="hidden" name="id" value={confirmDelete} />
      </form>
    {/if}

    <!-- Créer un admin -->
    <form method="POST" action="?/creerAdmin" use:enhance={() => {
      savingCreerAdmin = true
      return async ({ update }) => {
        savingCreerAdmin = false
        await update({ reset: false })
        newAdminEmail = ''
        newAdminName = ''
      }
    }} class="space-y-3">
      <h3 class="text-white text-sm font-medium">Inviter un membre staff</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="new-admin-name" class="block text-xs text-gray-400 uppercase mb-1">Nom</label>
          <input id="new-admin-name" type="text" name="name" bind:value={newAdminName}
            class="w-full bg-dark-primary text-white rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm" />
        </div>
        <div>
          <label for="new-admin-email" class="block text-xs text-gray-400 uppercase mb-1">Email</label>
          <input id="new-admin-email" type="email" name="email" bind:value={newAdminEmail}
            class="w-full bg-dark-primary text-white rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm" />
        </div>
      </div>
      <div>
        <label for="new-admin-role" class="block text-xs text-gray-400 uppercase mb-1">Rôle</label>
        <select id="new-admin-role" name="role_id" bind:value={newAdminRoleId}
          class="w-full bg-dark-primary text-white rounded px-3 py-2 border border-dark-primary text-sm">
          {#each data.roles ?? [] as role}
            {#if role.name !== 'club' }
            <option value={role.id}>{role.label}</option>
            {/if}
          {/each}
        </select>
      </div>
      <div class="flex justify-between items-center">
        <div>
          {#if showCreerAdminFeedback && hasError(actionData?.creerAdmin)}<p class="text-red-400 text-xs">{actionData.creerAdmin.error}</p>{/if}
          {#if showCreerAdminFeedback && hasSuccess(actionData?.creerAdmin)}<p class="text-green-400 text-xs">✓ Invitation envoyée</p>{/if}
        </div>
        <button type="submit" disabled={!newAdminEmail.trim() || !newAdminName.trim()}
          class="border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white disabled:opacity-30 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Envoyer l'invitation
        </button>
      </div>
    </form>
  </section>



  <!-- WORKFLOW DE SIGNATURE -->
  <section class="bg-dark-secondary rounded-lg p-6 space-y-4 mb-6">
    <h2 class="text-lg font-semibold text-white border-b border-dark-primary pb-2">Workflow de signature</h2>
    <p class="text-sm text-gray-400">
      Les étapes s'exécutent dans l'ordre. La signature par la Direction est toujours la dernière étape.
    </p>

    <!-- Étapes actuelles -->
    <div class="space-y-2">

      <!-- Étape fixe : soumission club -->
      <div class="flex items-center gap-3 bg-dark-primary/50 rounded-lg px-4 py-3">
        <span class="w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs font-bold shrink-0">0</span>
        <p class="text-white text-sm">Soumission par le club</p>
      </div>

      {#each data.workflow ?? [] as etape, i}
        <div class="flex items-center gap-3 bg-dark-primary rounded-lg px-4 py-3">
          <span class="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {etape.ordre}
          </span>
          <p class="text-white text-sm font-bold flex-1">{etape.roles?.label}</p>

            <div class="flex items-center gap-1">
            <!-- Monter -->
            {#if i > 0}
              <form method="POST" action="?/monterEtapeWorkflow" use:enhance={() => {
                savingWorkflow = true
                return async ({ update }) => {
                  savingWorkflow = false
                  await update({ reset: false })
                }
              }} class="inline">
              <input type="hidden" name="id" value={etape.id} />
              <input type="hidden" name="ordre" value={etape.ordre} />
              <button aria-label="up" type="submit" class="text-gray-400 hover:text-white px-1 py-1 text-sm">
                <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                </svg>
              </button>
              </form>
            {:else}
              <span class="w-6"></span>
            {/if}

            <!-- Descendre -->
            {#if i < (data.workflow?.length ?? 0) - 1}
              <form method="POST" action="?/descendreEtapeWorkflow" use:enhance={() => {
                savingWorkflow = true
                return async ({ update }) => {
                  savingWorkflow = false
                  await update({ reset: false })
                }
              }} class="inline">
              <input type="hidden" name="id" value={etape.id} />
              <input type="hidden" name="ordre" value={etape.ordre} />
              <button aria-label="down" type="submit" class="text-gray-400 hover:text-white px-1 py-1 text-sm">
                <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              </form>
            {:else}
              <span class="w-6"></span>
            {/if}

            <!-- Supprimer -->
            <button type="button" class="text-red-400 hover:text-red-300 px-1 py-1 text-sm"
              onclick={() => { confirmDeleteEtape = etape.id; nameEtapeToDelete = etape.roles?.label }}>
              ✕
            </button>
          </div>
        </div>
      {/each}

      <!-- Étape fixe : Direction -->
      <div class="flex items-center gap-3 bg-dark-primary/50 rounded-lg px-4 py-3">
        <span class="w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs font-bold shrink-0">
          {(data.workflow?.length ?? 0) + 1}
        </span>
        <p class="text-white text-sm">Validation finale — Direction</p>
      </div>
    </div>

    <!-- Ajouter une étape -->
    {#if rolesDisponiblesWorkflow.length > 0}
      <form method="POST" action="?/ajouterEtapeWorkflow" use:enhance={() => {
        savingWorkflow = true
        return async ({ update }) => {
          savingWorkflow = false
          await update({ reset: false })
        }
      }} class="flex gap-3 items-end border-t border-dark-primary pt-4">
        <div class="flex-1">
          <label for="new-workflow-role" class="block text-xs text-gray-400 uppercase mb-1">Ajouter une étape</label>
          <select id="new-workflow-role" name="role_id" bind:value={newWorkflowRoleId}
            class="w-full bg-dark-primary text-white rounded px-3 py-2 border border-dark-primary text-sm">
            {#each rolesDisponiblesWorkflow as role}
              {#if role.name !== 'club' && role.name !== 'direction'}
              <option value={role.id}>{role.label}</option>
              {/if}
            {/each}
          </select>
        </div>
        <button type="submit"
          class="border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Ajouter
        </button>
      </form>
    {:else}
      <p class="text-gray-500 text-sm italic border-t border-dark-primary pt-4">
        Tous les rôles signataires sont déjà dans le workflow.
      </p>
    {/if}

    {#if savingWorkflow}<p class="text-gray-400 text-xs">Enregistrement en cours...</p>{/if}
    {#if showWorkflowFeedback && hasError(actionData?.workflow)}<p class="text-red-400 text-xs">{actionData.workflow.error}</p>{/if}
    {#if showWorkflowFeedback && hasSuccess(actionData?.workflow)}<p class="text-green-400 text-xs">✓ Workflow mis à jour</p>{/if}
  </section>

  {#if confirmDeleteEtape}
    <ConfirmModal
      title="Supprimer l'étape ?"
      description="Cette action est irréversible. Les signatures en attente associées à cette étape seront supprimées. Les signatures déjà obtenues seront conservées. Pour confirmer, écrivez <strong class='text-white font-mono'>supprimer {nameEtapeToDelete}</strong> ci-dessous."
      confirmWord="supprimer {nameEtapeToDelete}"
      confirmLabel="Supprimer l'étape"
      accentColor="red"
      onconfirm={() => { etapeDeleteFormEl?.requestSubmit(); confirmDeleteEtape = null }}
      oncancel={() => { confirmDeleteEtape = null }}
    />

    <form bind:this={etapeDeleteFormEl} method="POST" action="?/supprimerEtapeWorkflow" use:enhance={() => {
      savingWorkflow = true
      return async ({ update }) => {
        savingWorkflow = false
        await update({ reset: false })
      }
    }} class="hidden">
      <input type="hidden" name="id" value={confirmDeleteEtape} />
    </form>
  {/if}

</div>