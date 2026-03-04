<script lang="ts">
  import { enhance } from '$app/forms'
  import { onMount, untrack, tick } from 'svelte';
   import { afterNavigate } from '$app/navigation'
  import type { PageData, ActionData } from './$types'

  let { data, form: actionData }: { data: PageData, form: ActionData } = $props()

  const isClub = $derived(data.profile?.role === 'club')
  let messageContent = $state('')
  let messages = $state(untrack(() => data.messages))

  onMount(() => {
    const client = data.supabase
    if (!client) return

    let channel: ReturnType<typeof client.channel> | undefined

    // Initialiser la session puis souscrire au realtime
    client.auth.getSession().then(() => {
      channel = client
        .channel(`messagerie-${data.fiche.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `form_id=eq.${data.fiche.id}`
          },
          async (payload) => {
            const { data: profile } = await client
              .from('profiles')
              .select('name, role')
              .eq('id', payload.new.sender_id)
              .single()

            const newMessage = {
              ...payload.new,
              profiles: profile
            }

            messages = [...messages, newMessage as any]

            setTimeout(() => {
              window.scrollTo(0, document.body.scrollHeight)
            }, 100)
          }
        )
        .subscribe()
      })

    return () => {
      if (channel) client.removeChannel(channel)
    }
  })

  // ensure we scroll to bottom after navigation (SvelteKit may reset scroll)
  afterNavigate(() => {
    tick().then(() => window.scrollTo(0, document.body.scrollHeight))
  })


  // Scroll vers le bas à l'arrivée et après chaque nouveau message
  $effect(() => {
    messages
    tick().then(() => window.scrollTo(0, document.body.scrollHeight))
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


  function getInitials(name: string): string {
    if (!name) return '?'
    const words = name.trim().split(/\s+/)
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  function getAvatarColor(role: string): string {
    if (role === 'club') return 'bg-blue-700 text-white'
    if (role === 'admin') return 'bg-purple-700 text-white'
    if (role === 'secretaire_generale') return 'bg-emerald-700 text-white'
    return 'bg-gray-600 text-white'
  }
</script>

<!-- div principale -->
<div class="flex flex-col min-h-screen">

  <div class="sticky top-0 z-20 bg-dark-terciary py-4 px-4 flex items-center justify-between">
    <h1 class="text-2xl font-bold text-white">Messagerie</h1>
  </div>

  <!-- div mère des messages -->
  <div class="flex-1 pt-4 w-full max-w-3xl px-4 mx-auto">
      {#if messages.length === 0}
        <div class="flex items-center justify-center h-full min-h-48">
          <p class="text-gray-500 text-sm">Aucun message pour l'instant. Démarrez la conversation !</p>
        </div>
      {/if}

      {#each messages as message}
        {@const senderRole = message.profiles?.role ?? 'unknown'}
        {@const senderName = message.profiles?.name ?? 'Inconnu'}
        {@const isMine = (isClub && senderRole === 'club') || (!isClub && senderRole !== 'club')}
        {@const initials = getInitials(senderName)}
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
                {senderName}
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

  <!-- Footer : zone de saisie -->
  <footer class="sticky bottom-0 w-full max-w-3xl mx-auto z-20 mb-0">
    <div class="bg-dark-secondary p-4 flex flex-col border-t-2 border-x-2 rounded-t border-dark-primary">

      {#if actionData?.error}
        <p class="text-red-400 text-xs mb-2">{actionData.error}</p>
      {/if}

      <form method="POST" action="?/envoyer" use:enhance={() => {
        return ({ update }) => update({ reset: false, invalidateAll: false })
      }} class="flex gap-3 items-center justify-center">

        <textarea
          name="content"
          bind:value={messageContent}
          placeholder="Écrivez votre message..."
          rows="2"
          onkeydown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.closest('form')?.requestSubmit()
            }
          }}
          class="flex-1 bg-dark-secondary text-white rounded-xl px-4 py-3 border-2 border-dark-primary focus:outline-none focus:border-blue-500 resize-none text-sm placeholder:text-gray-600 transition-colors">
        </textarea>

        <button type="submit"
          disabled={!messageContent.trim()}
          class="bg-blue-600 hover:bg-blue-700 active:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-colors font-medium text-sm flex items-center gap-2">
          <span class="hidden sm:inline">Envoyer</span>
          <svg class="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>

      </form>
    </div>
  </footer>

</div>