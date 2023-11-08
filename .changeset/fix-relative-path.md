---
"@remix-run/router": patch
---

Fix `relative="path"` bug where relative path calculations started from the full location pathname, instead of from the current contextual route pathname.

```jsx
<Route path="/a">
  <Route path="/b" element={<Component />}>
    <Route path="/c" />
  </Route>
</Route>;

function Component() {
  return (
    <>
      {/* This is now correctly relative to /a/b, not /a/b/c */}
      <Link to=".." relative="path" />
      <Outlet />
    </>
  );
}
```
