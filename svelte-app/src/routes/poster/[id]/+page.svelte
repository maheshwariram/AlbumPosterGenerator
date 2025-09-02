<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    interface AlbumDetails {
        collectionName: string;
        artistName: string;
        releaseDate: string;
        artworkUrl100: string;
        copyright: string;
    }

    interface Track {
        trackName: string;
        trackTimeMillis: number;
    }

    interface PosterTrack {
        trackName: string;
        trackTime: string; // Stored as "mm:ss" for the input fields
        trackTimeMillis: number;
    }

    let albumDetails: AlbumDetails | null = null;
    let tracklist: PosterTrack[] = [];
    let posterUrl: string = '';
    let isGenerating: boolean = true;
    let showCopyright: boolean = true;
    let imageResolution: string = '';

    onMount(async () => {
        const { id } = $page.params;
        try {
            const response = await fetch(`https://itunes.apple.com/lookup?id=${id}&entity=song`);
            if (!response.ok) throw new Error('Album not found');
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                albumDetails = data.results[0];
                tracklist = data.results.slice(1).map((track: Track) => ({
                    trackName: track.trackName,
                    trackTime: timeToMMSS(track.trackTimeMillis),
                    trackTimeMillis: track.trackTimeMillis
                }));
                await generatePoster();
            } else {
                throw new Error('No album data found');
            }
        } catch (error) {
            console.error('Failed to load album details:', error);
        } finally {
            isGenerating = false;
        }
    });

    async function generatePoster() {
        if (!albumDetails) return;
        isGenerating = true;
        posterUrl = '';
        imageResolution = '';

        try {
            const response = await fetch(`https://postergen-server.maheshwariram.com/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: albumDetails.collectionName,
                    artist: albumDetails.artistName,
                    year: new Date(albumDetails.releaseDate).getFullYear(),
                    artwork: albumDetails.artworkUrl100,
                    tracklist: tracklist.map((t) => ({
                        trackName: t.trackName,
                        trackTimeMillis: t.trackTimeMillis
                    })),
                    copyright: showCopyright && albumDetails.copyright ? albumDetails.copyright.replace('℗', '(c)') : ''
                })
            });
            if (!response.ok) throw new Error('Poster generation failed on the server');

            const blob = await response.blob();
            posterUrl = URL.createObjectURL(blob);
        } catch (error) {
            console.error('Poster generation error:', error);
        } finally {
            isGenerating = false;
        }
    }

    function handleImageLoad(event: Event) {
        const img = event.target as HTMLImageElement;
        imageResolution = `${img.naturalWidth}x${img.naturalHeight}`;
    }

    function timeToMMSS(millis: number): string {
        if (isNaN(millis)) return '00:00';
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function saveImage() {
        if (!posterUrl || !albumDetails) return;
        const link = document.createElement('a');
        link.href = posterUrl;
        link.download = `${albumDetails.collectionName} poster.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
</script>

<svelte:head>
    <title>{albumDetails ? `${albumDetails.collectionName} Poster` : 'Generating Poster...'}</title>
</svelte:head>

<div class="grid md:grid-cols-2 h-screen">
    <div class="options-panel p-8 md:p-12 overflow-y-auto">

        <div class="flex items-center gap-4 mb-8">
            <button
                    type="button"
                    on:click={() => goto('/')}
                    class="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-transparent border border-gray-300 text-black rounded-full hover:bg-gray-100 transition"
                    aria-label="Back to Search"
            >
                <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <h1 class="text-3xl font-bold">Poster Options</h1>
        </div>

        {#if albumDetails}
            <form on:submit|preventDefault={generatePoster} class="space-y-6">
                <div class="grid grid-cols-5">
                    <label
                            for="album-name"
                            class="block text-sm font-medium mb-1"
                    >
                        Album Name
                    </label>
                    <input
                            id="album-name"
                            bind:value={albumDetails.collectionName}
                            class="form-input col-span-5 left-aligned"
                    />
                </div>

                <div class="grid grid-cols-5">
                    <label
                            for="album-year"
                            class="block text-sm font-medium mb-1"
                    >
                        Album Year
                    </label>
                    <input
                            id="album-year"
                            value={new Date(albumDetails.releaseDate).getFullYear()}
                            class="form-input col-span-5 left-aligned"
                    />
                </div>

                <div class="grid grid-cols-5">
                    <label
                            for="album-artist"
                            class="block text-sm font-medium mb-1"
                    >
                        Album Artist
                    </label>
                    <input
                            id="album-artist"
                            bind:value={albumDetails.artistName}
                            class="form-input col-span-5 left-aligned"
                    />
                </div>

                <div class="flex items-center pt-2">
                    <input
                            id="copyright"
                            type="checkbox"
                            bind:checked={showCopyright}
                            class="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <label
                            for="copyright"
                            class="ml-3 block text-sm font-medium text-gray-900"
                    >
                        Display Copyright info?
                    </label>
                </div>

                <div>
                    <h3 class="text-xl font-bold text-gray-700 mb-4">Tracklist</h3>
                    <div class="tracklist space-y-2">
                        {#each tracklist as track, i (i)}
                            <div class="grid grid-cols-5 gap-2 items-center">
                                <input
                                        bind:value={track.trackName}
                                        placeholder="Track Name"
                                        class="form-input col-span-4 mt-1 left-aligned"
                                />
                                <input
                                        bind:value={track.trackTime}
                                        placeholder="mm:ss"
                                        class="form-input col-span-1 mt-1 text-center"
                                />
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="pt-4">
                    <button
                            type="submit"
                            disabled={isGenerating}
                            class="w-full bg-black text-white py-3 px-4 rounded-full font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition"
                    >
                        {isGenerating ? 'Generating...' : 'Regenerate Poster'}
                    </button>
                    <button
                            type="button"
                            on:click={() => goto('/')}
                            class="mt-2 w-full bg-transparent border border-black text-black py-3 px-4 rounded-full font-semibold hover:bg-gray-100 transition"
                    >
                        Back to Search
                    </button>
                </div>
            </form>
        {/if}
    </div>

    <div class="poster-display bg-black flex flex-col items-center justify-center p-6">
        {#if isGenerating}
            <div class="text-white">Loading Poster...</div>
        {:else if posterUrl}
            <div class="text-center">
                <img
                        src={posterUrl}
                        alt="Generated album poster"
                        class="max-h-[75vh] w-auto shadow-2xl rounded-lg"
                        on:load={handleImageLoad}
                />
                {#if imageResolution}
                    <p class="text-white mt-4">Resolution: {imageResolution}</p>
                {/if}
                <button
                        on:click={saveImage}
                        class="mt-4 bg-white text-black py-3 px-8 rounded-full font-semibold hover:bg-gray-200 transition"
                >
                    Save Image
                </button>
            </div>
        {:else}
            <div class="text-red-400 p-8 bg-red-900/20 rounded-lg">
                Could not generate poster. Please try again.
            </div>
        {/if}
    </div>
</div>
