<script lang="ts">
  import Sidebar from '$lib/components/MainSidebar.svelte'

  let { data, children } = $props()
</script>

<div class="min-h-screen bg-dark-terciary">

  <Sidebar data={data} />

  <main class="md:ml-64 px-5">
    {@render children()}
  </main>

</div>