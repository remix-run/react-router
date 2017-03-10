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

**IMPORTANT NOTE:** The withRouter function manipulates React's ```shouldComponentUpdate``` lifecycle, and will collide with other programs using the method, **especially Redux**. If your code looks like the below example, your component will **not** update when the router changes.

```js
import React, { PropTypes } from 'react'
import { connect } from 'redux'
import { withRouter } from 'react-router'

class ShowTheLocation extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  }

  render() {
    const { match, location, history, work } = this.props

    return (<div>
      <div>You are now at {location.pathname}</div>
      <div> This isn't going to { work } </div>
    </div>)
  }
}

function mapStateToProps(state) {
    return { work: state.work};
}

//Here's the issue. Connect + withRouter won't work together.
const ShowTheLocationWithRouter = connect(mapStateToProps)(withRouter(ShowTheLocation))
```

To fix this issue, create a wrapper component that uses the connected component. This workaround allows the two components
to be linked with redux, or react-router, but not both at the same time.

```js
import React, { PropTypes } from 'react'
import { connect } from 'redux'
import { withRouter } from 'react-router'

class ShowTheLocation extends React.Component {
  render() {
    const { match, location, history, works } = this.props

    return (<div>
      <div>You are now at {location.pathname}</div>
      <div>And stateful! {works}</div>
    </div>)
  }
}

function mapStateToProps(state) {
    return { works: state.works}; // Some state mapping should go here.
}

const ConnectedShowTheLocation = connect(mapStateToProps)(ShowTheLocation);

// This component will pass along the props linked using the withRouterMethod to the connected component.
class WrappedShowTheLocation extends React.Component {
    render() {
        <ConnectedShowTheLocation {...props} /> 
    }
}

const ShowTheLocationWithRouter = withRouter(WrappedShowTheLocation)
```

See [this post](https://github.com/ReactTraining/react-router/blob/v4.0.0-beta.8/packages/react-router/docs/guides/blocked-updates.md) for more information.
