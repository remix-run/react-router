The primary way to allow users to navigate around your application.
`Link` will render a fully accessible anchor tag with the proper href.

A `Link` also knows when the route it links to is active and automatically
applies its `activeClassName` and/or `activeStyle` when it is.

Props
-----

### `to`

The name of the route to link to, or a full URL.

### `params`

An object of the names/values that correspond with dynamic segments in your route path.

### `query`

An object of the names/values that will become the query parameters in
the path.

#### Example

```js
// given a route config like this
<Route name="user" path="/users/:userId"/>

// create a link with this
<Link to="user" params={{userId: "123"}}/>

// though, if your user properties match up to the dynamic segments:
<Link to="user" params={user}/>
```

### `query`

The query string parameters as a JavaScript object.

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

<!-- change style when link is active -->
<Link style={{color: 'white'}} activeStyle={{color: 'red'}} to="user" params={{userId: user.id}} query={{foo: bar}}>{user.name}</Link>
```
