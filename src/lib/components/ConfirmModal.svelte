<script lang="ts">
  import DOMPurify from 'dompurify'

  type Props = {
    title: string
    description: string
    confirmWord: string
    confirmLabel: string
    accentColor: 'red' | 'blue' | 'green' | 'yellow'
    onconfirm: () => void
    oncancel: () => void
  }

  let { title, description, confirmWord, confirmLabel, accentColor, onconfirm, oncancel }: Props = $props()

  let inputText = $state('')

  const colors = {
    red:    { border: 'border-dark-red-accent',    text: 'text-dark-red-accent',    bg: 'bg-dark-red-accent hover:opacity-80 active:opacity-80',    focus: 'focus:border-dark-red-accent' },
    blue:   { border: 'border-dark-blue-accent',   text: 'text-dark-blue-accent',   bg: 'bg-dark-blue-accent hover:opacity-80 active:opacity-80',   focus: 'focus:border-dark-blue-accent' },
    green:  { border: 'border-dark-green-accent',  text: 'text-dark-green-accent',  bg: 'bg-dark-green-accent hover:opacity-80 active:opacity-80',  focus: 'focus:border-dark-green-accent' },
    yellow: { border: 'border-dark-yellow-accent', text: 'text-dark-yellow-accent', bg: 'bg-dark-yellow-accent hover:opacity-80 active:opacity-80', focus: 'focus:border-dark-yellow-accent' },
  }

  const c = $derived(colors[accentColor])

  const safeDescription = $derived(
    typeof window !== 'undefined' ? DOMPurify.sanitize(description) : ''
  )
</script>

<div class="fixed inset-0 h-screen bg-black/70 z-50 flex items-center justify-center p-4">
  <div class="bg-dark-terciary border-t-3 border-b {c.border} rounded-lg p-6 w-full max-w-md space-y-4">

    <h2 class="text-xl font-bold text-text-main">{title}</h2>
    <p class="text-text-muted text-sm">{@html safeDescription}</p>

    <input type="text" bind:value={inputText}
      placeholder={confirmWord}
      autocapitalize="off"
      class="w-full bg-dark-secondary text-text-main rounded px-3 py-2 border border-dark-primary focus:outline-none {c.focus}" />

    <div class="flex gap-3">
      <button type="button"
        onclick={() => { inputText = ''; oncancel() }}
        class="flex-1 border border-dark-primary text-text-muted hover:text-text-main active:text-text-main py-2 rounded-lg transition-colors">
        Annuler
      </button>
      <button type="button"
        onclick={onconfirm}
        disabled={inputText !== confirmWord}
        class="flex-1 {c.bg} text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {confirmLabel}
      </button>
    </div>

  </div>
</div>