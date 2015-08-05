Adds a hook to your component instance that is called when the router is
about to navigate away from the route the component is rendered in, with
the opportunity to cancel the transition. Mosty useful for forms that
are partially filled out, or kicking off an action somewhere to persist
state.

Lifecycle Methods
-----------------

### `routerWillLeave(nextState, router)`

Called when the router is attempting to transition away from the route
that rendered this component.

### arguments

- `nextState` - the next router state
- `transition` - the [`Transition`][Transition] instance

Example
-------

```js
import { TransitionHook } from 'react-router';

var SignupForm = React.createClass({
  mixins: [ TransitionHook ],

  routerWillLeave (nextState, transition) {
    if (this.formIsHalfFilledOut())
      if (!prompt("You sure you want to leave?"))
        transition.abort();
  },

  // ...
});
```

  [Router]:#TODO

