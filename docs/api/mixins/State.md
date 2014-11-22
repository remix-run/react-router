API: `State` (mixin)
==========================

A mixin for components that need to know about the active params, query
and routes. Any handler on a route with dynamic segments will want to
use this.

Instance Methods
----------------

### `getParams()`

Returns a hash of the currently active URL params.

### `getQuery()`

Returns a hash of the currently active query params.

### `isActive(routeName, params, query)`

Returns `true` if a route, params, and query are active, `false`
otherwise.

### `getPath()`

Returns the current path.

### `getRoutes()`

Returns the active route tree.

Examples
--------

Usually you'll just want access to params and query:

```js
// route
<Route name="user" path="user/:name" handler={User} />

// handler
var User = React.createClass({
  mixins: [ Router.State ],

  render: function () {
    var name = this.getParams().name;
    return (
      <div>
        <h1>{name}</h1>
      </div>
    );
  }
});
```

Let's say you are using bootstrap and want to get `active` on those `li`
tags for the Tabs:

```js
var Link = require('react-router').Link;
var State = require('react-router').State;

var Tab = React.createClass({
  
  mixins: [ State ],

  render: function () {
    var isActive = this.isActive(this.props.to, this.props.params, this.props.query);
    var className = isActive ? 'active' : '';
    var link = Link(this.props);
    return <li className={className}>{link}</li>;
  }

});

// use it just like <Link/>, and you'll get an anchor wrapped in an `li`
// with an automatic `active` class on both.
<Tab to="foo">Foo</Tab>
```
