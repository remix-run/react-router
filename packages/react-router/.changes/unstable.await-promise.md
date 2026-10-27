Add an opt-in `<Await unstable_promise={promise}>` implementation based on React's `use()` API

- Use `React.use` instead of React Router's internal promise tracking
- Accept promise-like values and retain `errorElement`, `useAsyncValue`, and `useAsyncError` support
- Handle only promise rejections with `errorElement` when using `unstable_promise`, allowing child render errors to bubble to the nearest React error boundary
- Track streamed promises during decoding so settled server content stays visible during hydration updates with either Await API or direct `React.use()`
