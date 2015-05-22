History components live at the top of the routed component tree. Their
role is to:

- listen to changes in the url
- pass the location down as a prop to a `Router`
- parse/stringify the url queries

All histories share the same api.

Props
-----

### `parseQuery(parser)`

Provides a way for you to specify a custom query string parser, defaults
to the `qs` dependency.

### `stringifyQuery(obj)`

Provides a way for you to specify a custom query string stringifyer (I
think I just coined this term), defaults to the `qs` dependency.

Example
-------

```js
<BrowserHistory
  parseQuery={(queryString) => customParser(queryString)}
  stringifyQuery={(obj) => customStringify(obj)}
/>
```

