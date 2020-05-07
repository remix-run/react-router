# React Router Tutorial

Principles we should cover:

- Static paths like `<Route path="home">`
  - [Static Paths Tutorial](./static-paths.md)
- Dynamic paths like `<Route path=":id">`
- Nested paths (and layouts with `<Outlet>`s) like:

```
function ProductLayout() {
  return (
    <div>
      <h1>Product Layout</h1>
      <Outlet />
    </div>
  )
}

<Route path="products" element={<ProductLayout />}>
  <Route path=":id" element={<ProductDetail />}>
<Route path=":id">
```

- Links
- Redirects (after auth)
- Descendant `<Routes>` (rendered somewhere further down the component tree)
