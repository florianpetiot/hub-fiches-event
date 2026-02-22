<script lang="ts">
  let { label, value }: { label: string; value: string } = $props()
</script>

<div>
  <p class="text-gray-400 text-xs uppercase">{label}</p>
  <p class="text-white text-sm mt-0.5">{value}</p>
</div>