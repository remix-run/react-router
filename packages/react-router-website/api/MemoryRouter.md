# &lt;MemoryRouter>

A [`<Router>`](#router) that keeps the history of your "URL" in memory (does not read or write to the address bar). Useful in tests and non-browser environments like [React Native](https://facebook.github.io/react-native/).

```js
<MemoryRouter>
  <App/>
</MemoryRouter>
```

## initialEntries: array _`<MemoryRouter>`_

An array of `location`s in the history stack. These may be full-blown location objects with `{ pathname, search, hash, state }` or simple string URLs.

```js
<MemoryRouter
  initialEntries={[ '/one', '/two', { pathname: '/three' } ]}
  initialIndex={1}
>
  <App/>
</MemoryRouter>
```

## initialIndex: array _`<MemoryRouter>`_

The initial location's index in the array of `initialEntries`.

## getUserConfirmation: func _`<MemoryRouter>`_

A function to use to confirm navigation. You must use this option when using `<MemoryRouter>` directly with a `<Prompt>`.

## keyLength: number _`<MemoryRouter>`_

The length of `location.key`. Defaults to 6.

```js
<MemoryRouter keyLength={12}/>
```

## children: node _`<MemoryRouter>`_

A [single child element](https://facebook.github.io/react/docs/react-api.html#react.children.only) to render.
