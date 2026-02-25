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
      <span class="text-green-400 text-sm">✓ Document uploadé</span>
      <PdfViewer path={currentPath} label="Voir le document" bucket={bucket} />
      <button type="button" onclick={() => fileInput?.click()}
        disabled={deleting || uploading}
        class="text-xs text-gray-400 hover:text-white underline">
        Remplacer
      </button>
      <button type="button" onclick={handleDelete}
        disabled={deleting}
        class="text-xs text-red-400 hover:text-red-300 underline">
        {#if deleting}
          Suppression...
        {:else}
          Supprimer
        {/if}
      </button>
    </div>
  {:else}
    <button type="button" onclick={() => fileInput?.click()}
      disabled={uploading}
      class="flex items-center gap-2 px-4 py-2 border border-dashed border-dark-primary rounded-lg text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50">
      {#if uploading}
        <span>Envoi en cours...</span>
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