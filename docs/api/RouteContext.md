# RouteContext

The RouteContext mixin provides a convenient way for route components to set the route in context. This is needed for routes that render elements that want to use the [Lifecycle mixin](/docs/api/Lifecycle.md) to prevent transitions.

It simply adds `this.context.route` to your component.

