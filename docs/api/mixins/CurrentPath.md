API: `CurrentPath` (mixin)
==========================

A mixin for components that need to know the current URL path.

Instance Methods
----------------

### `getCurrentPath()`

Returns the current URL path.

Example
-------

```js
var CurrentPath = require('react-router').CurrentPath;

var ShowThePath = React.createClass({
  mixins: [ CurrentPath ],
  render: function () {
    return (
      <div>The current path is: {this.getCurrentPath()}</div>
    );
  }
});
```
