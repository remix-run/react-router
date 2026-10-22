Add an opt-in `<Await promise={promise}>` implementation based on React's `use()` API

- Accept promise-like values without modifying application promises and retain `errorElement`, `useAsyncValue`, and `useAsyncError` support
- Let child render errors bubble to the nearest React error boundary when using `promise`; retain existing behavior for `resolve`
- Preserve the original rejection when `onError` throws and log the reporting failure separately
- Support the `promise` prop in React Server Components, including async hooks in client descendants
- Track streamed promises during decoding so settled server content stays visible during hydration updates with either Await API or direct `React.use()`
