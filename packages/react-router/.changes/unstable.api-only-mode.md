Support client-side hydration and single-fetch data loading for API-only framework builds without requiring server-rendered route UI

- Use prerendered data during hydration when available, while continuing to serve runtime loaders and actions for routes outside the prerender list.
- Preserve normal loader revalidation and server-action support for lazily discovered routes, and honor loader opt-outs when making server data requests.
