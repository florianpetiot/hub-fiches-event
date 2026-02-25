<script lang="ts">
  type Props = {
    title: string
    description?: string
    placeholder?: string
    confirmLabel: string
    accentColor: 'red' | 'blue' | 'green' | 'yellow' | 'orange'
    onconfirm: (message: string) => void
    oncancel: () => void
  }

  let { title, description, placeholder, confirmLabel, accentColor, onconfirm, oncancel }: Props = $props()

  let messageText = $state('')

  const colors = {
    red:    { border: 'border-red-600',    text: 'text-red-500',    bg: 'bg-dark-red-accent hover:bg-red-500 active:bg-red-500',      focus: 'focus:border-red-500' },
    blue:   { border: 'border-blue-600',   text: 'text-blue-500',   bg: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-700',            focus: 'focus:border-blue-500' },
    green:  { border: 'border-green-600',  text: 'text-green-500',  bg: 'bg-green-600 hover:bg-green-700 active:bg-green-700',          focus: 'focus:border-green-500' },
    yellow: { border: 'border-yellow-600', text: 'text-yellow-500', bg: 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-700',        focus: 'focus:border-yellow-500' },
    orange: { border: 'border-dark-orange-accent', text: 'text-dark-orange-accent', bg: 'bg-dark-orange-accent hover:bg-dark-orange-500 active:bg-dark-orange-500', focus: 'focus:border-dark-orange-500' },
  }

  const c = $derived(colors[accentColor])
</script>

<div class="fixed inset-0 h-screen bg-black/70 z-50 flex items-center justify-center p-4">
  <div class="bg-dark-terciary border-t-3 border-b {c.border} rounded-lg p-6 w-full max-w-md space-y-4">

    <h2 class="text-xl font-bold text-white">{title}</h2>
    {#if description}
      <p class="text-gray-400 text-sm">{@html description}</p>
    {/if}

    <textarea
      bind:value={messageText}
      placeholder={placeholder ?? 'Écris ton message...'}
      rows="4"
      class="w-full bg-dark-secondary text-white rounded px-3 py-2 border border-dark-primary {c.focus} focus:outline-none resize-none text-sm">
    </textarea>

    <div class="flex gap-3">
      <button type="button"
        onclick={() => { messageText = ''; oncancel() }}
        class="flex-1 border border-gray-600 text-gray-400 hover:text-white active:text-white py-2 rounded-lg transition-colors">
        Annuler
      </button>
      <button type="button"
        onclick={() => onconfirm(messageText)}
        disabled={!messageText.trim()}
        class="flex-1 {c.bg} text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {confirmLabel}
      </button>
    </div>

  </div>
</div>