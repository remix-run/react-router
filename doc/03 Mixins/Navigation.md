Mixes in the navigation methods of the router for convenient routing
from within components.

Methods
-------

### makePath

See [router.makePath][router.makePath]

### makeHref

See [router.makeHref][router.makeHref]

### transitionTo

See [router.transitionTo][router.transitionTo]

### replaceWith

See [router.replaceWith][router.replaceWith]

### go

See [router.go][router.go]

### goBack

See [router.goBack][router.goBack]

### goForward

See [router.goForward][router.goForward]

Example
-------

```js
import { Navigation } from 'react-router';

React.createClass({

 mixins: [ Navigation ],

 render() {
   return (
     <div onClick={() => this.transitionTo('foo')}>Go to foo</div>
     <div onClick={() => this.replaceWith('bar')}>Go to bar without creating a new history entry</div>
     <div onClick={() => this.goBack()}>Go back</div>
   );
 }
});
```

  [history]:#TODO
  [router.makePath]:#TODO
  [router.makeHref]:#TODO
  [router.transitionTo]:#TODO
  [router.replaceWith]:#TODO
  [router.go]:#TODO
  [router.goBack]:#TODO
  [router.goForward]:#TODO

