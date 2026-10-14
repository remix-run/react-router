Support API-only Framework Mode with runtime server data loading, actions, revalidation, and lazy route discovery

- Hydrate prerendered pages from build-time data and fetch server loader data when hydrating a SPA fallback
- Preserve normal loader revalidation and server-action support for eagerly loaded and lazily discovered routes, and honor loader opt-outs when making server data requests
