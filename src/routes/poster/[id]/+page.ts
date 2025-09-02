/**
 * This tells SvelteKit not to pre-render this page at build time.
 * Because this is a dynamic route, it needs to be rendered on the
 * client-side after the page has loaded in the browser.
 */
export const prerender = false;
