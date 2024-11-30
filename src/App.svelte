<script lang="ts">
  import HouseSchedule from './lib/HouseSchedule.svelte'
</script>

<main>
  <HouseSchedule />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  main {
    width: 100%;
    min-height: 100vh;
  }
</style>