Require Vite 7+ and make the Vite Environment API build path mandatory

- Removed the `future.v8_viteEnvironmentApi` flag because the Vite Environment API is always enabled
- Removed the `@react-router/dev/vite/cloudflare` dev proxy export; use `@cloudflare/vite-plugin` instead
