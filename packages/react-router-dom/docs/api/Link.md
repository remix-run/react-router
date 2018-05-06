# &lt;Link>

Provides declarative, accessible navigation around your application.

```jsx
import { Link } from 'react-router-dom'

<Link to="/about">About</Link>
```

## to: string

A string representation of the location to link to, created by concatenating the location's pathname, search, and hash properties.

```jsx
<Link to='/courses?sort=name'/>
```

## to: object

An object that can have any of the following properties:
  * `pathname`: A string representing the path to link to.
  * `search`: A string representation of query parameters.
  * `hash`: A hash to put in the URL, e.g. `#a-hash`.
  * `state`: State to persist to the `location`.

```jsx
<Link to={{
  pathname: '/courses',
  search: '?sort=name',
  hash: '#the-hash',
  state: { fromDashboard: true }
}}/>
```

## replace: bool

When `true`, clicking the link will replace the current entry in the history stack instead of adding a new one.

```jsx
<Link to="/courses" replace />
```

## innerRef: function

Allows access to the underlying `ref` of the component

```jsx
const refCallback = node => {
  // `node` refers to the mounted DOM element or null when unmounted
}

<Link to="/" innerRef={refCallback} />
```

## others

You can also pass props you'd like to be on the `<a>` such as a `title`, `id`, `className`, etc.

