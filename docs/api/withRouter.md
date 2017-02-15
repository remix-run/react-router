# withRouter

You can get access to the [`router`](context.router.md)'s properties via the `withRouter` higher-order component. This is the recommended way to access the `router` object. `withRouter` will re-render its component every time the route changes.

```js
import React, { PropTypes } from 'react'
import { withRouter } from 'react-router'

// A simple component that shows the pathname of the current location
class ShowTheLocation extends React.Component {
  static propTypes = {
    location: PropTypes.object.isRequired
  }

  render() {
    return (
      <div>You are now at {this.props.location.pathname}</div>
    )
  }
}

// Create a new component that is "connected" (to borrow redux
// terminology) to the router. This component receives all of the
// router's properties as props.
const ShowTheLocationWithRouter = withRouter(ShowTheLocation)
```
