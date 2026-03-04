<script lang="ts">
  import { supabase } from '$lib/supabase'
	import PdfViewer from './PdfViewer.svelte';

  type Props = {
    formId: string
    documentType: string
    label: string
    currentPath?: string | null
    onuploaded: (path: string) => void
    bucket?: string
  }

  let { formId, documentType, label, currentPath, onuploaded, bucket = 'event-documents' }: Props = $props()

  let uploading = $state(false)
  let error = $state('')
  let deleting = $state(false)
  let fileInput = $state<HTMLInputElement>()

  const filePath = $derived(`${formId}/${documentType}.pdf`)

  async function handleUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      error = 'Seuls les fichiers PDF sont acceptés'
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      error = 'Le fichier ne doit pas dépasser 10 Mo'
      return
    }

    uploading = true
    error = ''

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true })

    uploading = false

    if (uploadError) {
      error = "Erreur lors de l'upload : " + uploadError.message
      return
    }

    onuploaded(filePath)
  }

  async function getSignedUrl() {
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(currentPath!, 60) // lien valide 60 secondes
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleDelete() {
    if (!currentPath) return
    const ok = confirm('Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.')
    if (!ok) return

    deleting = true
    error = ''
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([currentPath])
    deleting = false

    if (deleteError) {
      error = 'Erreur lors de la suppression : ' + deleteError.message
      return
    }

    // Signaler au parent que le document a été retiré (chemin vide)
    onuploaded('')
  }
</script>

<div class="space-y-2">
  <p class="text-sm text-gray-400">{label}</p>

  {#if currentPath}
    <div class="flex items-center gap-3">
      <span class="text-green-400 text-sm hidden sm:inline">✓ Document uploadé</span>
      <svg class="w-4 h-4 text-green-400 sm:hidden shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Document uploadé">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      <PdfViewer path={currentPath} label="Voir le document" bucket={bucket} />
      <button type="button" onclick={() => fileInput?.click()}
        disabled={deleting || uploading}
        title="Remplacer"
        class="text-xs text-gray-400 hover:text-white active:text-white flex items-center">
        <svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        <span class="hidden sm:inline underline">Remplacer</span>
      </button>
      <button type="button" onclick={handleDelete}
        disabled={deleting}
        title="Supprimer"
        class="text-xs text-red-400 hover:text-red-300 active:text-red-300 flex items-center">
        <svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        <span class="hidden sm:inline underline">
          {#if deleting}
            Suppression...
          {:else}
            Supprimer
          {/if}
        </span>
      </button>
    </div>
  {:else}
    <button type="button" onclick={() => fileInput?.click()}
      disabled={uploading}
      class="flex items-center gap-2 px-4 py-2 border border-dashed border-dark-primary rounded-lg text-sm text-gray-400 hover:text-white active:text-white hover:border-gray-500 active:border-gray-500 transition-colors disabled:opacity-50">
      {#if uploading}
        <svg class="w-4 h-4 animate-spin sm:hidden" style="animation-direction: reverse;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span class="hidden sm:inline">Envoi en cours...</span>
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
        <span>Choisir un PDF</span>
      {/if}
    </button>
  {/if}

  {#if error}
    <p class="text-red-400 text-xs">{error}</p>
  {/if}

  <input bind:this={fileInput} type="file" accept=".pdf,application/pdf"
    onchange={handleUpload} class="hidden" />
</div>