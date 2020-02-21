# React Router Tutorial

Principles we should cover:

- Static paths like `<Route path="home">`
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
- Redirects (main uses are for preserving old URLs and doing auth)
- Descendant `<Routes>` (rendered somewhere further down the component tree)
