# Miss

When no `Match` components match the current location, then a sibling
`Miss` will render.

```js
const App = () => (
  <Router>
    <Match pattern="/foo"/>
    <Match pattern="/bar"/>
    <Miss component={NoMatch}/>
  </Router>
)

const NoMatch = ({ location }) => (
  <div>Nothing matched {location.pathname}.</div>
)
```

## component _Miss_

Same as `component` in `Match`, except the only prop passed is
`location`.

```js
<Miss component={NoMatch}/>
```

## render: func _Miss_

Same as `render` in `Match`, except the only prop passed is `location`.

```js
<Miss render={({ location }) => (
  <div>Nothing matched {location.pathname}.</div>
)}/>
```
