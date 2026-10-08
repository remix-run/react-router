Add `ssr: "unstable_api-only"` to generate a static client build backed by server loaders and actions

- API-only builds continue to support client-side navigation and server data requests while not handling document requests in production.
- Support prerendering in API-only mode by retaining route UI for build-time rendering. Without prerendering, retain only the root route UI to generate the SPA shell.
