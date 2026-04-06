<script lang="ts">
    import "../app.css";
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { setContext } from 'svelte';
    import { onMount } from 'svelte';

    onMount(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js', {
        type: 'module'
      })
    }
  })
    
    let { data, children } = $props();

    setContext('supabase', {
       get client() { return data.supabase }
    });

</script>

<svelte:head><link rel="icon" href="{favicon}" /></svelte:head>
{@render children()}
