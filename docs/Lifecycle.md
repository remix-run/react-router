# Lifecycle Mixin

Adds a hook to your component instance that is called when the router is
about to navigate away from the route the component is configured on,
with the opportunity to cancel the transition. Mostly useful for forms
that are partially filled out.

Lifecycle Methods
-----------------

### `routerWillLeave(nextLocation)`

Called when the router is attempting to transition away from the route
that rendered this component.

### arguments

- `nextLocation` - the next location

