<script>
  import { supabase } from '$lib/supabase'
  
  async function test() {
    const { data, error } = await supabase.from('ma_table').select('*')
    console.log(data, error)
  }
</script>

<button onclick={test}>Tester Supabase</button>