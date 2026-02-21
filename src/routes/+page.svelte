<script>
  import { supabase } from '$lib/supabase'
  async function test() {
    await supabase.auth.signOut()
    await fetch('/auth/session', { method: 'DELETE' })
    location.reload()
  }
</script>

<button onclick={test}>Logout</button>