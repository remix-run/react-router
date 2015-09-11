# Navigation Mixin

Mixes in the navigation methods of the router for convenient routing
from within components.

## Usage

```js
var ReactRouter = require('react-router')

var myComponent = React.createComponent({
	mixins : [ReactRouter.Navigation],
	goToStore : function() {
		// store is the route name, and storeId is hamilton
		// will change to /store/hamilton
		var city = 'hamilton';
		this.transitionTo('/store/' + city);
	},
	render : function() {
		return (<button onClick={this.goToStore}>Change Pages</button>)
	}
});
```

## Methods

### `transitionTo(pathname, query, state)`

Transitions to a new URL.

#### arguments

- `pathname` - the full url with or without the query.
- `query` - an object that will be stringified by the router.
- `state` - the location state.

#### Examples

```js
router.transitionTo('/users/123');
router.transitionTo('/users/123', {showGrades: true}); // -> /users/123?showGrades=true
router.transitionTo('/pictures/123', null, { fromDashboard: true });
```

### `replaceWith(pathname, query, state)`

Replaces the current URL with a new one, without affecting the length of
the history (like a redirect).

#### arguments

- `pathname` - the full url with or without the query.
- `query` - an object that will be stringified by the router.
- `state` - the location state.

#### Examples

```js
router.replaceWith('/users/123');
router.replaceWith('/users/123', {showGrades: true}); // -> /users/123?showGrades=true
router.replaceWith('/pictures/123', null, { fromDashboard: true });
```

### `go(n)`

Go forward or backward in the history by `n` or `-n`.

### `goBack()`

Go back one entry in the history.

### `goForward()`

Go forward one entry in the history.

### `createPath(pathname, query)`

Stringifies the query into the pathname, using the router's config.

### `createHref(pathname, query)`

Creates a URL, using the router's config. For example, it will add `#/` in
front of the `pathname` for `HashHistory`.

## Example

```js
import { Navigation } from 'react-router';

React.createClass({

  mixins: [ Navigation ],

  render() {
    return (
      <div>
        <div onClick={() => this.transitionTo('foo')}>Go to foo</div>
        <div onClick={() => this.replaceWith('bar')}>Go to bar without creating a new history entry</div>
        <div onClick={() => this.goBack()}>Go back</div>
     </div>
   )
 }
})
```

