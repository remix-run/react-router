Ensure `react-router-serve` falls back to the client HTML shell for unmatched API-only requests while forwarding data requests to React Router

- Serve prerendered documents when available and use `__spa-fallback.html` for unmatched document requests when the home page is prerendered.
