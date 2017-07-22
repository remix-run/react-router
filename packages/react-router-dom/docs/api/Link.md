# &lt;Link>

Provides declarative, accessible navigation around your application.

```js
import { Link } from 'react-router-dom'

<Link to="/about">About</Link>
```

## to: string

The pathname or location to link to.

```js
<Link to="/courses"/>
```

## to: object

The location to link to.

```js
<Link to={{
  pathname: '/courses',
  search: '?sort=name',
  hash: '#the-hash',
  state: { fromDashboard: true }
}}/>
```

## replace: bool

When `true`, clicking the link will replace the current entry in the history stack instead of adding a new one.

```js
<Link to="/courses" replace />
```

## innerRef: function

Allows access to the underlying `ref` of the component

```js

const refCallback = node => {
  // `node` refers to the mounted DOM element or null when unmounted
}

<Link to="/" innerRef={refCallback} />
```
