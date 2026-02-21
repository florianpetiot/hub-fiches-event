<script lang="ts">
  import { supabase } from '$lib/supabase'
  import { goto, invalidateAll } from '$app/navigation'

  let email = ''
  let password = ''
  let error = ''
  let loading = false

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
</script>

<div class="min-h-screen flex items-center justify-center bg-dark-terciary">
    <div class="bg-dark-secondary p-15 rounded shadow-2xl w-full max-w-md border border-dark-primary">
        <h1 class="text-2xl font-bold mb-6 text-center text-white">Hub Fiches Event</h1>
        <form>
            <input
                type="email"
                bind:value={email}
                placeholder="email"
                class="w-full p-3 mb-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
                type="password"
                bind:value={password}
                placeholder="mot de passe"
                class="w-full p-3 mb-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                onclick={handleLogin}
                class="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                disabled={loading}
            >
                {#if loading}
                    Connexion...
                {:else}
                    Se connecter
                {/if}
            </button>
        </form>
        {#if error}
            <p class="text-red-500 mt-4 text-center">{error}</p>
        {/if}
    </div>
</div>