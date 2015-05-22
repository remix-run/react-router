History components live at the top of the [middleware][Middleware] stack. Their
role is to:

- listen to changes in the url
- pass the location down as a prop to a `Router`
- parse/stringify the url queries
- provide context for the [`Navigation`][Navigation] mixin to work

All histories share the same api.

Props
-----

### `parseQuery(parser)`

Provides a way for you to specify a custom query string parser, defaults
to the `qs` dependency.

### `stringifyQuery(obj)`

Provides a way for you to specify a custom query string stringifyer (I
think I just coined this term), defaults to the `qs` dependency.

### Example

```js
<BrowserHistory
  parseQuery={(queryString) => customParser(queryString)}
  stringifyQuery={(obj) => customStringify(obj)}
/>
```

Middleware Props Passed
-----------------------

### `location`

And object with location information on it.

#### properties

##### path

The full url path.

##### action

One of `POP`, `PUSH`, or `REPLACE`, depending on what the action was.

Middleware Context Set
----------------------

### `history`

An object with some methods useful for navigating around the app and
creating hrefs.

#### methods

##### `transitionTo(path [, query])`

Programmatically transition to a new route.

```js
this.transitionTo('about');
this.transitionTo('/users/10', { showGrades: true });
```

##### `replaceWith(path [, query])`

Programmatically replace current route with a new route. Does not add an
entry into the browser history.

```js
this.replaceWith('about');
this.replaceWith('/users/10', { showGrades: true });
```
##### `goBack()`

Programmatically go back to the last route and remove the most recent
entry from the browser history.

##### `makeHref()`

Creates an `href` to a route. Use this along with `State` when you
need to build components similar to `Link`.

  [Middleware]:#TODO
  [Navigation]:#TODO


