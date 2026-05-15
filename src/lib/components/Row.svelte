<script lang="ts">
  let { label, value }: { label: string; value: string } = $props()
</script>

<div>
  <p class="text-text-muted text-xs uppercase">{label}</p>
  <p class="text-text-main text-sm mt-0.5">{value}</p>
</div>