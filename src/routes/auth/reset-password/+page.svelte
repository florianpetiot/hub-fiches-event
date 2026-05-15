<script lang="ts">
  import { getContext } from 'svelte'
  import type { SupabaseClient } from '@supabase/supabase-js'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  const ctx = getContext<{client: SupabaseClient}>('supabase')

  let password = $state('')
  let confirm = $state('')
  let error = $state('')
  let loading = $state(false)
  let showPassword = $state(false)
  let showConfirmPassword = $state(false)
  let tokenExpired = $state(false)

  onMount(() => {
    // Lire les paramètres dans le hash (#error=access_denied...)
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const errorCode = params.get('error_code')

    if (errorCode === 'otp_expired' || params.get('error') === 'access_denied') {
      tokenExpired = true
    }
  })

  async function handleReset() {
    if (password !== confirm) {
      error = 'Les mots de passe ne correspondent pas'
      return
    }
    if (password.length < 8) {
      error = 'Le mot de passe doit contenir au moins 8 caractères'
      return
    }

    loading = true
    const { error: err } = await ctx.client.auth.updateUser({ password })
    loading = false

    if (err) {
      error = 'Erreur lors de la mise à jour du mot de passe'
      return
    }

    goto('/dashboard')
  }
</script>

<div class="min-h-screen bg-dark-terciary flex items-center justify-center p-4">
  <div class="bg-dark-secondary rounded-lg p-8 w-full max-w-sm space-y-4">

    {#if tokenExpired}
      <div class="text-center space-y-4">
        <div class="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h1 class="text-text-main text-xl font-bold">Lien expiré</h1>
        <p class="text-text-muted text-sm">
          Ce lien de définition de mot de passe a déjà été utilisé ou a expiré.
        </p>
        <p class="text-text-muted text-sm">
          Contactez un administrateur pour recevoir un nouvel email d'invitation.
        </p>
        <a href="/login"
          class="block w-full bg-blue-link hover:bg-blue-link/80 text-white py-2 rounded-lg text-sm font-medium transition-colors text-center">
          Retour à la connexion
        </a>
      </div>

    {:else}
    <h1 class="text-text-main text-2xl font-bold text-center">Hub Fiches Event</h1>
    <h2 class="text-text-main text-lg font-bold">Nouveau mot de passe</h2>
    <p class="text-text-muted text-sm">Choisissez votre nouveau mot de passe.</p>

    <div>
      <label for="new-password" class="block text-xs text-text-muted uppercase mb-1">Nouveau mot de passe</label>
      <div class="relative">
        <input id="new-password" type={showPassword ? 'text' : 'password'} bind:value={password}
          class="w-full bg-dark-primary text-text-main rounded px-3 py-2 pr-8 border border-dark-primary focus:outline-none focus:border-accent-selection text-sm" />
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-muted/80 focus:ring-2 focus:ring-accent-selection"
          onclick={() => (showPassword = !showPassword)}
          aria-pressed={showPassword}
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {#if showPassword}
            <!-- eye-off / fermé -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.03-2.05 2.63-3.82 4.6-5.05M6.1 6.1A9.97 9.97 0 0 1 12 5c5 0 9.27 3.11 11 7-.37.79-.83 1.54-1.36 2.25M3 3l18 18" />
            </svg>
          {:else}
            <!-- eye / ouvert -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
    <div>
      <label for="confirm-password" class="block text-xs text-text-muted uppercase mb-1">Confirmer</label>
      <div class="relative">
        <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} bind:value={confirm}
          class="w-full bg-dark-primary text-text-main rounded px-3 py-2 pr-8 border border-dark-primary focus:outline-none focus:border-accent-selection text-sm" />
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-muted/80 focus:ring-2 focus:ring-accent-selection"
          onclick={() => (showConfirmPassword = !showConfirmPassword)}
          aria-pressed={showConfirmPassword}
          aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {#if showConfirmPassword}
            <!-- eye-off / fermé -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.03-2.05 2.63-3.82 4.6-5.05M6.1 6.1A9.97 9.97 0 0 1 12 5c5 0 9.27 3.11 11 7-.37.79-.83 1.54-1.36 2.25M3 3l18 18" />
            </svg>
          {:else}
            <!-- eye / ouvert -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          {/if}
        </button>
      </div>
    </div>

    {#if error}
      <p class="text-dark-red-accent text-xs">{error}</p>
    {/if}

    <button type="button" onclick={handleReset}
      disabled={!password || !confirm || loading}
      class="w-full bg-blue-link hover:bg-blue-link/80 disabled:opacity-30 text-white py-2 rounded-lg text-sm font-medium transition-colors">
      {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
    </button>

    {/if}
  </div>
</div>