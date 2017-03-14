# withRouter

You can get access to the [`history`](history.md) object's properties and the closest [`<Route>`](Route.md)'s [`match`](match.md) via the `withRouter` higher-order component. `withRouter` will re-render its component every time the route changes with the same props as [`<Route>`](./Route.md) render props: `{ match, location, history }`.

```js
import React, { PropTypes } from 'react'
import { withRouter } from 'react-router'

// A simple component that shows the pathname of the current location
class ShowTheLocation extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  }

  render() {
    const { match, location, history } = this.props

    return (
      <div>You are now at {location.pathname}</div>
    )
  }
}

// Create a new component that is "connected" (to borrow redux
// terminology) to the router.
const ShowTheLocationWithRouter = withRouter(ShowTheLocation)
```

**IMPORTANT NOTE:** If you are using `withRouter` to prevent `shouldComponentUpdate` blocks, it is important that `withRouter` wraps the component that implements `shouldComponentUpate`. For example, when using Redux: 

```js
// This gets around shouldComponentUpdate
withRouter(connect(...)(MyComponent)
// This does not
connect(...)(withRouter(MyComponent))
```

See [this post](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/guides/blocked-updates.md) for more information.
