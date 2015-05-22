Adds a hook to your component instance that is called when the router is
about to navigate away from the route the component is rendered in, with
the opportunity to cancel the transition. Mosty useful for forms that
are partially filled out, or kicking off an action somewhere to persist
state.

Lifecycle Methods
-----------------

### `routerWillLeave(cancelTransition, location)`

Called when the router is attempting to transition away from the route
that rendered this component.

Example
-------

```js
import { TransitionHook } from 'react-router';

var SignupForm = React.createClass({
  mixins: [ TransitionHook ],

  routerWillLeave (cancelTransition, location) {
    if (this.formIsHalfFilledOut())
      if (!prompt("You sure you want to leave?"))
        cancelTransition();
  },

  // ...
});
```

