---
"react-router": minor
---

Stabilize the `dataStrategy` `match.shouldRevalidateArgs`/`match.shouldCallHandler()` APIs.

- The `match.shouldLoad` API is now marked deprecated in favor of these more powerful alternatives
- If you're using this API in a custom `dataStrategy` today, you can swap to the new API at your convenience:

  ```tsx
  // Before
  const matchesToLoad = matches.filter((m) => m.shouldLoad);

  // After
  const matchesToLoad = matches.filter((m) => m.shouldCallHandler());
  ```

- `match.shouldRevalidateArgs` is the argument that will be passed to the route `shouldRevaliate` function
- Combined with the parameter accepted by `match.shouldCallHandler`, you can define a custom revalidation behavior for your `dataStrategy`:

```tsx
const matchesToLoad = matches.filter((m) => {
  const defaultShouldRevalidate = customRevalidationBehavior(
    match.shouldRevalidateArgs,
  );
  return m.shouldCallHandler(defaultShouldRevalidate);
  // The argument here will override the internal `defaultShouldRevalidate` value
});
```
