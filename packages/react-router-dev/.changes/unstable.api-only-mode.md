Add `ssr: "unstable_api-only"` to retain a runtime server for loaders, actions, and route discovery while disabling production document rendering

- Generate a root-only SPA shell when prerendering is disabled
- Support prerendered pages and data files alongside runtime loaders and actions, with a SPA fallback for non-prerendered paths
- Default API-only builds to lazy route discovery
- Reject API-only configuration in RSC Framework Mode
- Preserve server-only route exports in additional Vite server environments in both API-only and SSR modes
- Serve prerendered pages and the SPA fallback in Vite preview while retaining live data requests and route discovery
