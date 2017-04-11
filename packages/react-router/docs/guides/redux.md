# Redux Integration

Redux is an important part of the React ecosystem. We want to make the integration of React Router and Redux as seamless as possible for people wanting to use both.

## Blocked Updates

Generally, React Router and Redux work just fine together. Occasionally though, an app can have a component that doesn't update when the location changes (child routes or active nav links don't update).

This happens if:

1. The component is connected to redux via `connect()(Comp)`.
2. The component is **not** a "route component", meaning it is not
   rendered like so: `<Route component={SomeConnectedThing}/>`

The problem is that Redux implements `shouldComponentUpdate` and there's no indication that anything has changed if it isn't receiving props from the router.  This is straightforward to fix. Find where you `connect` your component and wrap it in `withRouter`.

```js
// before
export default connect(mapStateToProps)(Something)

// after
import { withRouter } from 'react-router-dom'
export default withRouter(connect(mapStateToProps)(Something))
```

## Deep integration

Some folks want to:

- synchronize the routing data with, and accessed from, the store
- be able to navigate by dispatching actions
- have support for time travel debugging for route changes in the Redux
  devtools

All of this requires deeper integration. Please note you don't need this deep integration:

- Route changes are unlikely to matter for time travel debugging.
- Rather than dispatching actions to navigate you can pass the `history` object provided to route components to your actions and navigate with it there.
- Routing data is already a prop of most of your components that care about it, whether it comes from the store or the router doesn't change your component's code.

However, we know some people feel strongly about this and so we want to provide the best deep integration possible. As of version 4 of React Router, the React Router Redux package is a part of the project.  Please refer to it for deep integration.

[React Router Redux](https://github.com/reacttraining/react-router/tree/master/packages/react-router-redux)

