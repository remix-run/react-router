# history

The term "history" and "`history` object" in this documentation refers to [the `history` package](https://github.com/ReactTraining/history), which is one of only 2 major dependencies of React Router (besides React itself), and which provides several different implementations for managing session history in JavaScript in various environments.

The following terms are also used:

- "browser history" - A DOM-specific implementation, useful in web browsers that support the HTML5 history API
- "hash history" - A DOM-specific implementation for legacy web browsers
- "memory history" - An in-memory history implementation, useful in testing and non-DOM environments like React Native

`history` objects typically have the following properties and methods:

- `length` - (number) The number of entries in the history stack
- `action` - (string) The current action (`PUSH`, `REPLACE`, or `POP`)
- `location` - (object) The current location. May have the following properties:
  - `pathname` - (string) The path of the URL
  - `search` - (string) The URL query string
  - `hash` - (string) The URL hash fragment
  - `state` - (object) location-specific state that was provided to e.g. `push(path, state)` when this location was pushed onto the stack. Only available in browser and memory history.
- `push(path, [state])` - (function) Pushes a new entry onto the history stack
- `replace(path, [state])` - (function) Replaces the current entry on the history stack
- `go(n)` - (function) Moves the pointer in the history stack by `n` entries
- `goBack()` - (function) Equivalent to `go(-1)`
- `goForward()` - (function) Equivalent to `go(1)`
- `block(prompt)` - (function) Prevents navigation (see [the history docs](https://github.com/ReactTraining/history#blocking-transitions))

## history is mutable

The history object is mutable. Therefore it is recommended to access the [`location`](./location.md) from the render props of [`<Route>`](./Route.md), not from `history.location`. This ensures your assumptions about React are correct in lifecycle hooks. For example:

```jsx
class Comp extends React.Component {
  componentWillReceiveProps(nextProps) {
    // will be true
    const locationChanged = nextProps.location !== this.props.location;

    // INCORRECT, will *always* be false because history is mutable.
    const locationChanged =
      nextProps.history.location !== this.props.history.location;
  }
}

<Route component={Comp} />;
```

Additional properties may also be present depending on the implementation you're using. Please refer to [the history documentation](https://github.com/ReactTraining/history#properties) for more details.
