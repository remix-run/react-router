# withRouter

You can get access to the [`history`](history.md) object's properties and the closest [`<Route>`](Route.md)'s [`match`](match.md) via the `withRouter` higher-order component. `withRouter` will re-render its component every time the route changes with a single `router` prop.

```js
import React, { PropTypes } from 'react'
import { withRouter } from 'react-router'

// A simple component that shows the pathname of the current location
class ShowTheLocation extends React.Component {
  static propTypes = {
    router: PropTypes.object.isRequired
  }

  render() {
    const { router } = this.props

    return (
      <div>You are now at {router.location.pathname}</div>
    )
  }
}

// Create a new component that is "connected" (to borrow redux
// terminology) to the router. This component receives all of the
// router's properties as props.
const ShowTheLocationWithRouter = withRouter(ShowTheLocation)
```
