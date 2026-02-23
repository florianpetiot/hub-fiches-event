<script lang="ts">
  import { enhance } from '$app/forms'
  import type { PageData, ActionData } from './$types'

  let { data, form: actionData }: { data: PageData, form: ActionData } = $props()

  const isClub = $derived(data.profile?.role === 'club')
  let messageContent = $state('')
  let messagesContainer = $state<HTMLDivElement>()

  // Scroll vers le bas à l'arrivée et après chaque nouveau message
  $effect(() => {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  })

  // Vider le champ après envoi réussi
  $effect(() => {
    if (actionData?.success) {
      messageContent = ''
    }
  })

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  const roleLabel: Record<string, string> = {
    club: 'Club',
    admin: 'Admin',
    secretaire_generale: 'Sec. gén.'
  }

  function getInitials(role: string, name: string): string {
    if (role === 'club') return 'CL'
    if (role === 'admin') return 'AD'
    if (role === 'secretaire_generale') return 'SG'
    return (name ?? '?').slice(0, 2).toUpperCase()
  }

  function getAvatarColor(role: string): string {
    if (role === 'club') return 'bg-blue-700 text-white'
    if (role === 'admin') return 'bg-purple-700 text-white'
    if (role === 'secretaire_generale') return 'bg-emerald-700 text-white'
    return 'bg-gray-600 text-white'
  }
</script>

<div class="sticky top-0 z-20 bg-dark-terciary py-4 px-4 flex items-center justify-between">
  <h1 class="text-2xl font-bold text-white">Messagerie</h1>
</div>

<!-- Zone de messages scrollable avec padding-bottom pour le footer fixe -->
<div bind:this={messagesContainer} class="overflow-y-auto pb-28 pt-4 px-2 max-w-3xl mx-auto"
  style="height: calc(100vh - 7rem)">

  {#if data.messages.length === 0}
    <div class="flex items-center justify-center h-full min-h-48">
      <p class="text-gray-500 text-sm">Aucun message pour l'instant. Démarrez la conversation !</p>
    </div>
  {/if}

  {#each data.messages as message}
    {@const senderRole = message.profiles?.role ?? 'unknown'}
    {@const senderName = message.profiles?.name ?? 'Inconnu'}
    {@const isMine = (isClub && senderRole === 'club') || (!isClub && senderRole !== 'club')}
    {@const initials = getInitials(senderRole, senderName)}
    {@const avatarColor = getAvatarColor(senderRole)}

    {#if message.is_system === true}
      {#if message.content === 'SYSTEM_MESSAGE:DEMANDE_REVISION'}
        <!-- separateur system -->
        <div class="flex items-center my-6">
          <div class="flex-1 border-t border-dark-orange-accent"></div>
          <span class="mx-4 text-xs text-dark-orange-accent">Révision demandée par {senderName}</span>
          <div class="flex-1 border-t border-dark-orange-accent"></div>
        </div>
      {:else if message.content === 'SYSTEM_MESSAGE:MISE_A_JOUR'}
        <!-- separateur system -->
        <div class="flex items-center my-6">
          <div class="flex-1 border-t border-dark-primary"></div>
          <span class="mx-4 text-xs text-gray-400">Mise à jour de la fiche par {senderName}</span>
          <div class="flex-1 border-t border-dark-primary"></div>
        </div>
      {:else if message.content === 'SYSTEM_MESSAGE:VALIDATION_FICHE'}
        <!-- separateur system -->
        <div class="flex items-center my-6">
          <div class="flex-1 border-t border-dark-green-accent"></div>
          <span class="mx-4 text-xs text-dark-green-accent">Fiche validée par {senderName}</span>
          <div class="flex-1 border-t border-dark-green-accent"></div>
        </div>
      {:else if message.content === 'SYSTEM_MESSAGE:REFUS_FICHE'}
        <!-- separateur system -->
        <div class="flex items-center my-6">
          <div class="flex-1 border-t border-dark-red-accent"></div>
          <span class="mx-4 text-xs text-dark-red-accent">Fiche refusée par {senderName}</span>
          <div class="flex-1 border-t border-dark-red-accent"></div>
        </div>
      {/if}
    {:else}
    <div class="flex {isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 mb-4">

      <!-- Avatar -->
      <div class="shrink-0 w-8 h-8 rounded-full {avatarColor} flex items-center justify-center text-xs font-bold select-none">
        {initials}
      </div>

      <!-- Contenu : métadonnées + bulle -->
      <div class="flex flex-col {isMine ? 'items-end' : 'items-start'} max-w-xs md:max-w-md lg:max-w-lg">

        <!-- Métadonnées -->
        <div class="flex items-center gap-1.5 mb-1 {isMine ? 'flex-row-reverse' : ''}">
          <span class="text-xs font-medium {isMine ? 'text-blue-400' : 'text-gray-300'}">
            {roleLabel[senderRole] ?? senderName}
          </span>
          <span class="text-xs text-gray-600">·</span>
          <span class="text-xs text-gray-500">v{message.form_version}</span>
          <span class="text-xs text-gray-600">·</span>
          <span class="text-xs text-gray-500">{formatTime(message.created_at)}</span>
        </div>

        <!-- Bulle -->
        <div class="px-4 py-2.5 text-sm leading-relaxed wrap-break-word {isMine
          ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
          : 'bg-dark-secondary text-gray-100 rounded-2xl rounded-bl-md border border-dark-primary'}">
          {message.content}
        </div>

      </div>
    </div>
    {/if}
  {/each}

</div>

<!-- Footer fixe : zone de saisie -->
<footer class="fixed bottom-0 left-0 w-full z-20 md:pl-64">
  <div class="bg-dark-secondary border-t border-dark-primary p-4 max-w-3xl mx-auto">

    {#if actionData?.error}
      <p class="text-red-400 text-xs mb-2">{actionData.error}</p>
    {/if}

    <form method="POST" action="?/envoyer" use:enhance={() => {
      return ({ update }) => update({ reset: false })
    }} class="flex gap-3 items-end">

      <textarea
        name="content"
        bind:value={messageContent}
        placeholder="Écris ton message… (Entrée pour envoyer)"
        rows="2"
        onkeydown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.closest('form')?.requestSubmit()
          }
        }}
        class="flex-1 bg-dark-primary text-white rounded-xl px-4 py-3 border border-dark-primary focus:outline-none focus:border-blue-500 resize-none text-sm placeholder:text-gray-600 transition-colors">
      </textarea>

      <button type="submit"
        disabled={!messageContent.trim()}
        class="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl transition-colors font-medium text-sm flex items-center gap-2 self-end">
        Envoyer
        <svg class="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
      </button>

    </form>
  </div>
</footer>