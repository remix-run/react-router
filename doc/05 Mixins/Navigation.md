Mixes in the navigation methods of your [`history`][history] to the
component.

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

  [history]:#TODO


