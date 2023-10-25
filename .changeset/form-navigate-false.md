---
"react-router-dom": minor
---

Add `navigate`/`fetcherKey` params/props to `useSumbit`/`Form` to support kicking off a fetcher submission under the hood with an optionally user-specified `key`

- Invoking a fetcher in this way is ephemeral and stateless
- If you need to access the state of one of these fetchers, you will need to leverage `useFetcher({ key })` to look it up elsewhere
