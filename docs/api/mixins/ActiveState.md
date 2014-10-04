API: `ActiveState` (mixin)
==========================

A mixin for components that need to know about the routes, params, and
query that are currently active (like links).

Instance Methods
----------------

### `isActive(routeName, params, query)`

Returns `true` if a route, params, and query are active, `false`
otherwise.

Lifecycle Methods
-----------------

### `updateActiveState`

Called when the active state changes.

Example
-------

Let's say you are using bootstrap and want to get `active` on those `li`
tags for the Tabs:

```js
var Link = require('react-router/Link');
var ActiveState = require('react-router/ActiveState');

var Tab = React.createClass({
  
  mixins: [ ActiveState ],

  getInitialState: function () {
    return { isActive: false };
  },

  updateActiveState: function () {
    this.setState({
      isActive: this.isActive(this.props.to, this.props.params, this.props.query)
    })
  },

  render: function() {
    var className = this.state.isActive ? 'active' : '';
    var link = Link(this.props);
    return <li className={className}>{link}</li>;
  }

});

// use it just like <Link/>, and you'll get an anchor wrapped in an `li`
// with an automatic `active` class on both.
<Tab to="foo">Foo</Tab>
```

