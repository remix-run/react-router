# &lt;MemoryRouter>

A [`<Router>`](Router.md) that keeps the history of your "URL" in memory (does not read or write to the address bar). Useful in tests and non-browser environments like [React Native](https://facebook.github.io/react-native/).

```jsx
<MemoryRouter
  initialEntries={optionalArray}
  initialIndex={optionalNumber}
  getUserConfirmation={optionalFunc}
  keyLength={optionalNumber}
>
  <App />
</MemoryRouter>
```

## initialEntries: array

An array of `location`s in the history stack. These may be full-blown location objects with `{ pathname, search, hash, state }` or simple string URLs.

```jsx
<MemoryRouter
  initialEntries={["/one", "/two", { pathname: "/three" }]}
  initialIndex={1}
>
  <App />
</MemoryRouter>
```

## initialIndex: number

The initial location's index in the array of `initialEntries`.

## getUserConfirmation: func

A function to use to confirm navigation. You must use this option when using `<MemoryRouter>` directly with a `<Prompt>`.

## keyLength: number

The length of `location.key`. Defaults to 6.

```jsx
<MemoryRouter keyLength={12} />
```

## children: node

The child elements to render.

Note: On React &lt; 16 you must use a [single child element](https://facebook.github.io/react/docs/react-api.html#reactchildrenonly) since a render method cannot return more than one element. If you need more than one element, you might try wrapping them in an extra `<div>`.
