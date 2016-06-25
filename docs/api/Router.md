# `<Router>`

Rendering a router makes all of the other components in this library
work.

## `history`

This history to listen to for location changes.

```js
import createBrowserHistory from 'history/lib/createBrowserHistory'
<Router history={createBrowserHistory()}/>
```


## `children: node`

Normal react children

```js
<Router>
  <div/>
  <div/>
</Router>
```

## `children: func`

If you don't want to rely on `context` you can provide a function for
the children and get the location from there to pass around your app.

```js
<Router>
  {({ location }) => (
    <pre>{JSON.stringify(location, null, 2)}</pre>
  )}
</Router>
```

# `</Router>`
