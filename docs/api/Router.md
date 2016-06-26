# `<Router>`

Rendering a router makes all of the other components in this library
work.

```js
<Router>
  <Link to="/">Home</Link>
  <Link to="/movies">Movies</Link>
  <Match pattern="/" exactly component={Index}/>
  <Match pattern="/movies" component={MovieGrid}/>
</Router>
```

## `history`

The history to listen to for location changes.

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

## context values

`Router` provides both the `history` and the current `location` on
context.

# `</Router>`
