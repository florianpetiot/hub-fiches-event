<script lang="ts">
    import "../app.css";
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { setContext } from 'svelte';
    
    let { data, children } = $props();

    setContext('supabase', {
       get client() { return data.supabase }
    });

</script>

<svelte:head><link rel="icon" href="{favicon}" /></svelte:head>
{@render children()}
