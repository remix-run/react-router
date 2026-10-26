Fix SSR-unsafe error being rendered for non-prerendered parameterized routes served via the SPA fallback

- When an `ssr:false` app with a `prerender` config served the SPA fallback document for a non-prerendered path, hydrating routes with a server `loader` no longer skipped the single-fetch `.data` request, so a missing `.data` file now surfaces the host's 404 response instead of an internal "No result found for routeId" error
