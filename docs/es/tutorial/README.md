# Tutorial de React Router

Principios que deberiamos cubrir:

- Rutas estáticas como `<Route path="home">`
- Rutas dinámicas como `<Route path=":id">`
- Rutas anidadas (y layouts con `<Outlet>`s) como por ejemplo:

```
function ProductLayout() {
  return (
    <div>
      <h1>Layout de Producto</h1>
      <Outlet />
    </div>
  )
}

<Route path="products" element={<ProductLayout />}>
  <Route path=":id" element={<ProductDetail />}>
<Route path=":id">
```

- Links
- Redirecciones (despues de autentificar)
- `<Routes>` descendientes (renderizadas en algún lugar más abajo en el arbol de componentes)
