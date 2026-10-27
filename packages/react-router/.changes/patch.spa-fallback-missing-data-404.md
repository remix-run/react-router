Surface the host's 404 response when a SPA fallback route has no prerendered data

- Request single-fetch `.data` files for hydrating routes with a server `loader` in an `ssr: false` app with a `prerender` config
- Avoid the internal "No result found for routeId" error for non-prerendered parameterized paths served via the SPA fallback
