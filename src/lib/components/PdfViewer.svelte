<!-- components/PdfViewer.svelte -->
<script lang="ts">
  import { getContext } from 'svelte'
  import type { SupabaseClient } from '@supabase/supabase-js'

  const ctx = getContext<{client: SupabaseClient}>('supabase')

  type Props = {
    path: string
    label: string
    docTitle?: string
    bucket?: string
  }

  let { path, label, docTitle: propDocTitle, bucket = 'event-documents' }: Props = $props()

  // Titre affiché dans l'entête du viewer (séparé de `label`)
  // Si la page passe `docTitle`, on l'utilisera prioritairement
  let docTitle = $derived(propDocTitle ?? 'Document joint')
  let showViewer = $state(false)
  let signedUrl = $state<string | null>(null)
  let loading = $state(false)
  let error = $state('')

  async function openPdf() {
    loading = true
    error = ''

    const { data, error: err } = await ctx.client.storage
      .from(bucket)
      .createSignedUrl(path, 300) // valide 5 minutes

    loading = false

    if (err || !data?.signedUrl) {
      error = 'Impossible de charger le document'
      return
    }

    signedUrl = data.signedUrl
    showViewer = true
  }
</script>

<!-- Bouton -->
<button type="button" onclick={openPdf} disabled={loading}
  class="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 active:text-blue-300 disabled:opacity-50 transition-colors print:hidden">
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
  </svg>
  {loading ? 'Chargement...' : label}
</button>

<span class="hidden print:inline text-sm text-gray-600">
  - Document joint (voir version numérique)
</span>

{#if error}
  <p class="text-red-400 text-xs mt-1">{error}</p>
{/if}

<!-- Popup visionneuse -->
{#if showViewer && signedUrl}
  <div class="fixed inset-0 bg-black/80 z-50 flex flex-col">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-dark-secondary border-b border-dark-primary shrink-0">
      <p class="text-white font-medium text-sm truncate">{docTitle}</p>
      <div class="flex items-center gap-3">
        <a href={signedUrl} target="_blank"
          class="text-sm text-blue-400 hover:text-blue-300 active:text-blue-300 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Télécharger
        </a>
        <button type="button" onclick={() => { showViewer = false; signedUrl = null }}
          class="text-gray-400 hover:text-white active:text-white text-xl leading-none">✕</button>
      </div>
    </div>

    <!-- PDF iframe -->
    <iframe
      src={signedUrl}
      title={docTitle}
      class="flex-1 w-full bg-gray-900"
    ></iframe>

  </div>
{/if}