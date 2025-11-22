---
"react-router": patch
---

[UNSTABLE] Add a new `unstable_defaultShouldRevalidate` flag to various APIs to allow opt-ing out of standard revalidation behaviors.

If active routes include a `shouldRevalidate` function, then your value will be passed as `defaultShouldRevalidate` in those function so that the route always has the final revalidation determination.

- `<Form method="post" unstable_defaultShouldRevalidate={false}>`
- `submit(data, { method: "post", unstable_defaultShouldRevalidate: false })`
- `<fetcher.Form method="post" unstable_defaultShouldRevalidate={false}>`
- `fetcher.submit(data, { method: "post", unstable_defaultShouldRevalidate: false })`

This is also available on non-submission APIs that may trigger revalidations due to changing search params:

- `<Link to="/" unstable_defaultShouldRevalidate={false}>`
- `navigate("/?foo=bar", { unstable_defaultShouldRevalidate: false })`
- `setSearchParams(params, { unstable_defaultShouldRevalidate: false })`
