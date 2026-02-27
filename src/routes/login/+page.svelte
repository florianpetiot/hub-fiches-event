<script lang="ts">
    import { supabase } from '$lib/supabase'
    import { goto, invalidateAll } from '$app/navigation'

    let email = ''
    let password = ''
    let showPassword = false
    let error = ''
    let loading = false
    let showForgot = false
    let forgotEmail = ''
    let forgotSent = false
    let forgotError = ''

    async function handleLogin() {
        loading = true
        error = ''
        
            const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })

            if (err) {
                error = 'Email ou mot de passe incorrect'
                loading = false
            } else {
                // Send session tokens to the server so server-side createServerClient can set cookies
                try {
                    const session = data?.session
                    if (session) {
                        await fetch('/auth/session', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token })
                        })
                    }
                } catch (e) {
                    // ignore — server may already have session via other flows
                }

                await invalidateAll()
                await goto('/dashboard')
            }
    }


    async function handleForgotPassword() {
        forgotError = ''
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
            redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`
        })
        if (error) {
            forgotError = 'Aucun compte trouvé avec cet email'
        } else {
            forgotSent = true
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-dark-terciary">
    <div class="bg-dark-secondary p-15 rounded shadow-2xl w-full max-w-md border border-dark-primary">
        <h1 class="text-2xl font-bold mb-6 text-center text-white">Hub Fiches Event</h1>
        <form onsubmit={handleLogin}>
            <input
                type="email"
                bind:value={email}
                placeholder="email"
                class="w-full p-3 mb-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div class="relative mb-4">
                <input
                    type={showPassword ? 'text' : 'password'}
                    bind:value={password}
                    placeholder="mot de passe"
                    class="w-full p-3 pr-8 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Mot de passe"
                />
                <button
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
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

            <button
                type="submit"
                class="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
            >
                {#if loading}
                    Connexion...
                {:else}
                    Se connecter
                {/if}
            </button>

                <p class="text-sm text-center mt-4">
                    <button
                        type="button"
                        class="text-blue-500 hover:underline focus:outline-none"
                        onclick={() => (showForgot = !showForgot)}
                    >
                        {showForgot ? 'Annuler' : 'Mot de passe oublié ?'}
                    </button>
                </p>
        </form>
        {#if error}
            <p class="text-red-500 mt-4 text-center">{error}</p>
        {/if}
    </div>
</div>


{#if showForgot}
  <div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
    <div class="bg-dark-secondary rounded-lg p-6 w-full max-w-sm space-y-4">
      <h2 class="text-white font-semibold">Réinitialiser le mot de passe</h2>

      {#if forgotSent}
        <p class="text-green-400 text-sm">
          ✓ Un email de réinitialisation a été envoyé à {forgotEmail}
        </p>
        <button onclick={() => { showForgot = false; forgotSent = false }}
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">
          Fermer
        </button>
      {:else}
        <p class="text-gray-400 text-sm">
          Entre votre email et vous recevrez un lien pour choisir un nouveau mot de passe.
        </p>
        <input type="email" bind:value={forgotEmail} placeholder="ton@email.fr"
          class="w-full bg-dark-primary text-white rounded px-3 py-2 border border-dark-primary focus:outline-none focus:border-blue-500 text-sm" />
        {#if forgotError}
          <p class="text-red-400 text-xs">{forgotError}</p>
        {/if}
        <div class="flex gap-3">
          <button type="button" onclick={() => showForgot = false}
            class="flex-1 border border-gray-600 text-gray-400 py-2 rounded-lg text-sm">
            Annuler
          </button>
          <button type="button" onclick={handleForgotPassword}
            disabled={!forgotEmail.trim()}
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white py-2 rounded-lg text-sm">
            Envoyer
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}