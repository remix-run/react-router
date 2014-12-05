API: `Link` (component)
=========================

Creates an anchor tag that links to a route in the application. Also
gets the `active` class automatically when the route matches. If you
change the path of your route, you don't have to change your links.

Props
-----

### `to`

The name of the route to link to, or a full URL.

### `params`

Object, the parameters to fill in the dynamic segments of your route.

#### Example

```js
// given a route config like this
<Route name="user" path="/users/:userId"/>

// create a link with this
<Link to="user" params={{userId: "123"}}/>

// though, if your user properties match up to the dynamic segements:
<Link to="user" params={user}/>
```

### `query`

Object, Query parameters to add to the link. Access query parameters in
your route handler with `this.props.query`.

### `activeClassName`

The className a `Link` receives when it's route is active. Defaults to
`active`.

### `onClick`

A custom handler for the click event. Works just like a handler on an `<a>`
tag - calling `e.preventDefault()` or returning `false` will prevent the
transition from firing, while `e.stopPropagation()` will prevent the event
from bubbling.

### *others*

You can also pass props you'd like to be on the `<a>` such as a title, id, or className.

Example
-------

Given a route like `<Route name="user" path="/users/:userId"/>`:

```xml
<Link to="user" params={{userId: user.id}} query={{foo: bar}}>{user.name}</Link>
<!-- becomes one of these depending on your router and if the route is
active -->
<a href="/users/123?foo=bar" class="active">Michael</a>
<a href="#/users/123?foo=bar">Michael</a>

<!-- or if you have the full url already, you can just pass that in -->
<Link to="/users/123?foo=bar">{user.name}</Link>

<!-- change the activeClassName -->
<Link activeClassName="current" to="user" params={{userId: user.id}}>{user.name}</Link>
```

