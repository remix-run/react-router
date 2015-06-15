The primary way to allow users to navigate around your application.
`Link` will render a fully accesible anchor tag with the proper href.

A `Link` also knows when the route it links to is active and automatically
applies its `activeClassName` and/or `activeStyle` when it is.

Props
-----

### `to`

The path to link to, ie `/users/123`.

### `query`

An object of key:value pairs to be stingified.

### `activeClassName`

The className a `Link` receives when its route is active. Defaults to `active`.

### `activeStyle`

The styles to apply to the link element when its route is active.

### `onClick`

A custom handler for the click event. Works just like a handler on an `<a>`
tag - calling `e.preventDefault()` or returning `false` will prevent the
transition from firing, while `e.stopPropagation()` will prevent the event
from bubbling.

### *others*

You can also pass props you'd like to be on the `<a>` such as a title, id, className, etc.

Example
-------

Given a route like `<Route path="/users/:userId"/>`:

```js
<Link to={`/users/${user.id}`}>{user.name}</Link>
// becomes one of these depending on your History and if the route is
// active
<a href="/users/123" class="active">Michael</a>
<a href="#/users/123">Michael</a>

// change the activeClassName
<Link to={`/users/${user.id}`} activeClassName="current">{user.name}</Link>

// change style when link is active
<Link to="/users" style={{color: 'white'}} activeStyle={{color: 'red'}}>Users</Link>
```

