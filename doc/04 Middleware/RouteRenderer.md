Renders the matched route branch components into elements.

Props
-----

### `renderComponent(Component, props)`

Optional property to customize component rendering.

#### Examples

This is the default `renderComponent`.

```js
<RouteRenderer renderComponent={(Component, props) => (
  <Component {...props}/>
)}/>
```

Maybe you need to wrap your route components in a HoC.

```js
<RouteRenderer renderComponent={(Component, props) => (
  <SomeDataContainer Component={Component} {...props}/>
)}/>
```

Middleware Props Passed
-----------------------

### `element`

The next middleware will get a new `element` prop. Its the root element
to be rendered at the end of the middleware by a `Renderer`.

