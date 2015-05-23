History components live at the top of the [middleware][Middleware] stack. Their
role is to:

- listen to changes in the URL
- pass the location down as a prop to a `Router`
- parse/stringify URL query strings
- provide context for the [`Navigation`][Navigation] mixin to work

All histories share the same API.

Props
-----

### `parseQueryString`

A function that is used to parse the URL query string. Defaults to using
`qs.parse`.

### `stringifyQuery`

A function that is used to create new query strings from a query object.
Defaults to using `qs.stringify` with `{ arrayFormat: 'brackets' }`.

### Example

```js
<BrowserHistory
  parseQueryString={(queryString) => customParser(queryString)}
  stringifyQuery={(obj) => customStringify(obj)}
/>
```

Child Props
-----------

### `location`

And object with location information on it.

#### path

The URL path, without the query string.

#### query

The parsed query object (see `<History parseQueryString>`).

#### navigationType

One of `PUSH`, `REPLACE`, or `POP` depending on what type of navigation
triggered the change in location.

Context
-------

### `history`

A `History` object puts itself in context for descendants that need to
navigate around the app and create hrefs. The following methods are useful
for these tasks:

#### `push(path [, query])`

Programmatically transition to a new route.

```js
this.context.history.push('about');
this.context.history.push('/users/10', { showGrades: true });
```

#### `replace(path [, query])`

Programmatically replace current route with a new route. Does not add an
entry into the browser history.

```js
this.context.history.replace('about');
this.context.history.replace('/users/10', { showGrades: true });
```

#### `go(n)`

Programmatically navigate back/forward `n` entries in the history. Analogous
to web browsers' `window.history.go(n)`.

```js
this.context.history.go(-2);
```

#### `back()`

Programmatically go back to the last route in the history. Shorthand for
`go(-1)`.

#### `forward()`

Programmatically go forward to the next route in the history. Shorthand
for `go(1)`.

#### `makePath(path [, query])`

Creates and returns a full URL path with the given `query`.

```js
this.context.history.makePath('/users/10', { showGrades: true });
```

Note: This method does not make any attempt to preserve any query string
that may already exist in `path`. Instead, use the `query` argument.

#### `makeHref(path [, query])`

Creates an `href` to a route. Use this along with `State` when you
need to build components similar to `Link`.

  [Middleware]:#TODO
  [Navigation]:#TODO

