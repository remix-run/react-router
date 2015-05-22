Mixes in the navigation methods of your router's `history` to the
component for convenient navigation and path string creation.

Instance Methods
----------------

### `transitionTo(path [, query])`

Programmatically transition to a new route.

#### Examples

```js
this.transitionTo('about');
this.transitionTo('/users/10', { showGrades: true });
```

### `replaceWith(path [, query])`

Programmatically replace current route with a new route. Does not add an
entry into the browser history.

#### Examples

```js
this.replaceWith('about');
this.replaceWith('/users/10', { showGrades: true });
```

### `goBack()`

Programmatically go back to the last route and remove the most recent
entry from the browser history.

#### Example

```js
this.goBack();
```

### `makePath(path, query)`

Creates a URL path to a route.

### `makeHref(path, query)`

Creates an `href` to a route. Use this along with `State` when you
need to build components similar to `Link`.

Example
-------

```js
import { Navigation } from 'react-router';

React.createClass({
 mixins: [Navigation],

 render: function() {
   return (
     <div onClick={() => this.transitionTo('foo')}>Go to foo</div>
     <div onClick={() => this.replaceWith('bar')}>Go to bar without creating a new history entry</div>
     <div onClick={() => this.goBack()}>Go back</div>
   );
 }
});
```
