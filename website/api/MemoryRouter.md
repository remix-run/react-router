# MemoryRouter

A router that keeps the history of your "URL" in memory (does not read or write to the address bar). Useful in non-browser environments like React Native.

```js
<MemoryRouter>
  <App/>
</MemoryRouter>
```

## getUserConfirmation _MemoryRouter_

A function to use to confirm navigation. TODO: Provide an example here.

## initialEntries _MemoryRouter_

An array of `location`s in the history stack.

## initialIndex _MemoryRouter_

The initial location's index in the array of `initialEntries`.

## keyLength _MemoryRouter_

The length to use keys that are generated for `location.key`. Defaults to 6.
