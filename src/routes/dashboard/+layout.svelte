<!-- dashboard/+layout.svelte -->
<script lang="ts">
  import Sidebar from '$lib/components/MainSidebar.svelte'

  let { data, children } = $props()
</script>

<div class="min-h-screen bg-dark-terciary">

  <Sidebar data={data} />

  <main class="md:ml-64 p-5">
    {@render children()}
  </main>

</div>