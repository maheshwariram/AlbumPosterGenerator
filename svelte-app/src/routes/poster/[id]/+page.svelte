<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';

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

    function timeToMMSS(millis: number): string {
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

<div class="grid md:grid-cols-2 h-screen bg-gray-50">
    <div class="options-panel p-6 overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4">Poster Options</h2>
        {#if albumDetails}
            <form on:submit|preventDefault={generatePoster} class="space-y-4">
                <div>
                    <label for="album-name" class="block text-sm font-medium text-gray-700"
                    >Album Name</label
                    >
                    <input
                            id="album-name"
                            bind:value={albumDetails.collectionName}
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>
                <div>
                    <label for="album-artist" class="block text-sm font-medium text-gray-700"
                    >Artist</label
                    >
                    <input
                            id="album-artist"
                            bind:value={albumDetails.artistName}
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>

                <div class="flex items-center">
                    <input id="copyright" type="checkbox" bind:checked={showCopyright} class="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <label for="copyright" class="ml-2 block text-sm text-gray-900">Display copyright info</label>
                </div>

                <h3 class="text-xl font-bold pt-4">Tracklist</h3>
                <div class="tracklist space-y-2">
                    {#each tracklist as track, i (i)}
                        <div class="grid grid-cols-12 gap-2 items-center">
                            <span class="col-span-1 text-right text-sm text-gray-500">{i + 1}.</span>
                            <input
                                    bind:value={track.trackName}
                                    placeholder="Track Name"
                                    class="col-span-8 mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                            <input
                                    bind:value={track.trackTime}
                                    placeholder="mm:ss"
                                    class="col-span-3 mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                    {/each}
                </div>

                <div class="pt-4">
                    <button
                            type="submit"
                            disabled={isGenerating}
                            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isGenerating ? 'Generating...' : 'Regenerate Poster'}
                    </button>
                </div>
            </form>
        {/if}
    </div>

    <div class="poster-display bg-gray-800 flex items-center justify-center p-6">
        {#if isGenerating}
            <div class="text-white">Loading Poster...</div>
        {:else if posterUrl}
            <div class="text-center">
                <img
                        src={posterUrl}
                        alt="Generated album poster"
                        class="max-h-[80vh] w-auto shadow-2xl rounded-lg"
                />
                <button
                        on:click={saveImage}
                        class="mt-4 bg-white text-gray-800 py-2 px-6 rounded-md font-semibold hover:bg-gray-200"
                >
                    Save Image
                </button>
            </div>
        {:else}
            <div class="text-red-400">Could not generate poster. Please try again.</div>
        {/if}
    </div>
</div>
