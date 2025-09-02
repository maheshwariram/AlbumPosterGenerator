<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';
    import '../app.css';
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<div class="bg-white text-gray-800 min-h-screen font-sans">
    <slot />
</div>
