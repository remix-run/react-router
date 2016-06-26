# `<Redirect>`

Rendering a `Redirect` will navigate to a new location and add the
previous location onto the next location state.

```js
<Match pattern="/" exactly render={() => (
  loggedIn ? (
    <Redirect to="/dashboard"/>
  ) : (
    <PublicHomePage/>
  )
)}/>
```


## `to: string`

The pathname to redirect to.

```js
<Redirect to="/somewhere/else" />
```

## `to: location`

A location descriptor to redirect to.

```js
<Redirect to={{
  pathname: '/login',
  query: { utm: 'your+face' },
  state: { referrer: currentLocation }
}}/>
```

## `history`

If you'd rather not use the history from context, you can pass it in.

```js
<Redirect to="/some/where" history={someHistory}/>
```

# `</Redirect>`
