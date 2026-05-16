<script lang="ts">
  import DOMPurify from 'dompurify'

  type Props = {
    title: string
    description: string
    placeholder: string
    confirmLabel: string
    accentColor: 'red' | 'blue' | 'green' | 'yellow' | 'orange'
    onconfirm: (message: string) => void
    oncancel: () => void
  }

  let { title, description, placeholder, confirmLabel, accentColor, onconfirm, oncancel }: Props = $props()

  let messageText = $state('')

  const colors = {
    red:    { border: 'border-dark-red-accent',    text: 'text-dark-red-accent',    bg: 'bg-dark-red-accent hover:opacity-80 active:opacity-80',      focus: 'focus:border-dark-red-accent' },
    blue:   { border: 'border-dark-blue-accent',   text: 'text-dark-blue-accent',   bg: 'bg-dark-blue-accent hover:opacity-80 active:opacity-80',            focus: 'focus:border-dark-blue-accent' },
    green:  { border: 'border-dark-green-accent',  text: 'text-dark-green-accent',  bg: 'bg-dark-green-accent hover:opacity-80 active:opacity-80',          focus: 'focus:border-dark-green-accent' },
    yellow: { border: 'border-dark-yellow-accent', text: 'text-dark-yellow-accent', bg: 'bg-dark-yellow-accent hover:opacity-80 active:opacity-80',        focus: 'focus:border-dark-yellow-accent' },
    orange: { border: 'border-dark-orange-accent', text: 'text-dark-orange-accent', bg: 'bg-dark-orange-accent hover:opacity-80 active:opacity-80', focus: 'focus:border-dark-orange-accent' },
  }

  const c = $derived(colors[accentColor])

  const safeDescription = $derived(
    typeof window !== 'undefined' ? DOMPurify.sanitize(description) : ''
  )
</script>

<div class="fixed inset-0 h-screen bg-black/70 z-50 flex items-center justify-center p-4">
  <div class="bg-dark-terciary border-t-3 border-b {c.border} rounded-lg p-6 w-full max-w-md space-y-4">

    <h2 class="text-xl font-bold text-text-main">{title}</h2>
    {#if description}
      <p class="text-text-muted text-sm">{@html safeDescription}</p>
    {/if}

    <textarea
      bind:value={messageText}
      placeholder={placeholder ?? 'Écris ton message...'}
      rows="4"
      class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary {c.focus} focus:outline-none resize-none text-sm">
    </textarea>

    <div class="flex gap-3">
      <button type="button"
        onclick={() => { messageText = ''; oncancel() }}
        class="flex-1 border border-dark-primary text-text-muted hover:text-text-main active:text-text-main hover:border-text-main active:border-text-main py-2 rounded-lg transition-colors hover:cursor-pointer">
        Annuler
      </button>
      <button type="button"
        onclick={() => onconfirm(messageText)}
        disabled={!messageText.trim()}
        class="flex-1 {c.bg} text-dark-terciary font-bold py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer">
        {confirmLabel}
      </button>
    </div>

  </div>
</div>