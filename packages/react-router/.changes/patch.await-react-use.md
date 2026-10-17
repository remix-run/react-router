Use React's `use()` API internally in `<Await>` while preserving render-prop children, async value/error hooks, and rejection handling

- Update `UNSAFE_AwaitContextProvider` to accept a `PromiseSettledResult` instead of an annotated promise
- Jest tests using React Testing Library may need to wrap `render`/`rerender` calls that suspend on `<Await>` in `await act(async () => { ... })` so resolved content renders correctly
