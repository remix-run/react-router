Fix intermittent `Prerender: Request failed for ... connect ECONNREFUSED` errors during prerendering

- Send requests to the address the Vite preview server bound to
- Avoid re-resolving `localhost` for each request, which could select a different address family (`127.0.0.1` vs `::1`)
