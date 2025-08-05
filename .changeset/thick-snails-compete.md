---
"react-router": patch
---

Fix types for `UIMatch` to reflect that the `loaderData`/`data` properties may be `undefined`

- When an `ErrorBoundary` is being rendered, not all active matches will have loader data available, since it may have been their `loader` that threw to trigger the boundary
- The `UIMatch.data` type was not correctly handing this and would always reflect the presence of data, leading to the unexpected runtime errors when an `ErrorBoundary` was rendered
- ⚠️ This may cause some type errors to show up in your code for unguarded `match.data` accesses - you should properly guard for `undefined` values in those scenarios.

```tsx
// app/root.tsx
export function loader() {
  someFunctionThatThrows(); // ❌ Throws an Error
  return { title: "My Title" };
}

export function Layout({ children }: { children: React.ReactNode }) {
  let matches = useMatches();
  let rootMatch = matches[0] as UIMatch<Awaited<ReturnType<typeof loader>>>;
  //  ^ rootMatch.data is incorrectly typed here, so TypeScript does not
  //    complain if you do the following which throws an error at runtime:
  let { title } = rootMatch.data; // 💥

  return <html>...</html>;
}
```
