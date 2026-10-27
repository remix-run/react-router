Add an opt-in `<Await unstable_promise={promise}>` implementation based on React's `use()` API

- Skips React Router internal promise tracking in favor of `React.use`
- Accept promise-like values and retains `errorElement`, `useAsyncValue`, and `useAsyncError` support
- `errorElement` only handles promise rejections with `unstable_promise` - child render errors bubble to the nearest React error boundary
- Track streamed promises during decoding so settled server content stays visible during hydration updates with either Await API or direct `React.use()`
