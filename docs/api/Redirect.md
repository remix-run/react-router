# `<Redirect>`

Rendering a `Redirect` will navigate to a new location and add the
previous location onto the next location state.


## `to: string | location`

The location to redirect to, can be a string or a location descriptor.

```js
<Redirect to="/somewhere/else" />

<Redirect to={{
  pathname: '/login',
  state: { referrer: currentLocation }
}}/>
```

## `history`

If you'd rather not use the history from context, you can pass it in.

# `</Redirect>`
