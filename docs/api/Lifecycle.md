# Lifecycle Mixin

Adds a hook to your component instance that is called when the router is
about to navigate away from the route the component is configured on,
with the opportunity to cancel the transition. Mostly useful for forms
that are partially filled out.

On standard transitions, `routerWillLeave` receives a single argument: the `location` we're transitioning to. To cancel the transition, return false.

To prompt the user for confirmation, return a prompt message (string). `routerWillLeave` does not receive a location object during the beforeunload event in web browsers (assuming you're using the `useBeforeUnload` history enhancer). In this case, it is not possible for us to know the location we're transitioning to so `routerWillLeave` must return a prompt message to prevent the user from closing the tab.

### Lifecycle Methods

#### `routerWillLeave(nextLocation)`

Called when the router is attempting to transition away from the route
that rendered this component.

#### arguments

- `nextLocation` - the next location