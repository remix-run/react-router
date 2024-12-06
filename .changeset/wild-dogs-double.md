---
"@react-router/dev": patch
---

Remove the leftover/unused `abortDelay` prop from `ServerRouter` and update the default `entry.server.tsx` to use the new `streamTimeout` value for Single Fetch

- The `abortDelay` functionality was removed in v7 as it was coupled to the `defer` implementation from Remix v2, but this removal of this prop was missed
- If you were still using this prop in your `entry.server` file, it's likely your app is not aborting streams as you would expect and you will need to adopt the new [`streamTimeout`](https://reactrouter.com/explanation/special-files#streamtimeout) value introduced with Single Fetch
