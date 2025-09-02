<script lang="ts">
    import { goto } from '$app/navigation';

    interface Album {
        collectionId: number;
        artistName: string;
        collectionName: string;
        artworkUrl100: string;
    }

    let searchTerm: string = '';
    let searchResults: Album[] = [];
    let isLoading: boolean = false;
    let hasSearched: boolean = false;

    async function search() {
        if (!searchTerm.trim()) return;
        isLoading = true;
        hasSearched = true;
        searchResults = [];

        try {
            const response = await fetch(
                `https://itunes.apple.com/search?term=${encodeURIComponent(
                    searchTerm
                )}&entity=album&limit=50`
            );
            if (!response.ok) {
                throw new Error('Failed to fetch search results');
            }
            const data = await response.json();
            searchResults = data.results;
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            isLoading = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            search();
        }
    }

    function goToPoster(collectionId: number) {
        goto(`/poster/${collectionId}`);
    }
</script>

<svelte:head>
    <title>Album Poster Generator</title>
    <meta name="description" content="Instantly create posters for any music album!" />
</svelte:head>

<div class="flex flex-col min-h-screen justify-center items-center p-4">
    {#if !hasSearched}
        <main class="text-center">
            <h1 class="text-5xl font-bold">Album Poster Generator</h1>
            <p class="mt-4 text-gray-600">
                To start generating a poster, type in the name of the Album below
            </p>
            <form on:submit|preventDefault={search} class="mt-8 flex flex-col items-center gap-4">
                <div class="relative w-full max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                                class="w-5 h-5 text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                        >
                            <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                            />
                        </svg>
                    </div>
                    <input
                            type="text"
                            bind:value={searchTerm}
                            on:keydown={handleKeydown}
                            placeholder="Album Name"
                            class="w-full p-4 pl-10 bg-gray-100 border-2 border-transparent rounded-full focus:outline-none focus:border-blue-500 transition"
                    />
                </div>
                <button
                        type="submit"
                        disabled={isLoading}
                        class="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
                >
                    {#if isLoading}
                        Searching...
                    {:else}
                        Search
                    {/if}
                </button>
            </form>
        </main>
    {:else}
        <div class="w-full max-w-6xl">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-3xl font-bold">Search Results for "{searchTerm}"</h1>
                <button on:click={() => (hasSearched = false)} class="text-blue-600 hover:underline"
                >New Search</button
                >
            </div>

            {#if isLoading}
                <p class="text-center text-gray-500">Loading results...</p>
            {:else if searchResults.length > 0}
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {#each searchResults as album (album.collectionId)}
                        <div
                                class="album bg-white p-3 rounded-lg shadow-md cursor-pointer transition-transform transform hover:-translate-y-1"
                                on:click={() => goToPoster(album.collectionId)}
                                role="button"
                                tabindex="0"
                                on:keydown={(e) => e.key === 'Enter' && goToPoster(album.collectionId)}
                        >
                            <img
                                    src={album.artworkUrl100.replace('100x100', '400x400')}
                                    alt="{album.collectionName} artwork"
                                    class="w-full aspect-square object-cover rounded-md"
                            />
                            <p class="album-name font-semibold mt-2 truncate" title={album.collectionName}>
                                {album.collectionName}
                            </p>
                            <p class="artist-name text-sm text-gray-500 truncate" title={album.artistName}>
                                {album.artistName}
                            </p>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="text-center py-10">
                    <p class="text-gray-600">No results found for "{searchTerm}".</p>
                </div>
            {/if}
        </div>
    {/if}
</div>

