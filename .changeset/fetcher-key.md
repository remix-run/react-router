---
"react-router-dom": minor
---

Add support for manual fetcher key specification via `useFetcher({ key: string })` so you can access the same fetcher instance from different components in your application without prop-drilling ([RFC](https://github.com/remix-run/remix/discussions/7698))

- Fetcher keys are now also exposed on the fetchers returned from `useFetchers` so that they can be looked up by `key`
