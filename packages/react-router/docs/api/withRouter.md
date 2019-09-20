# withRouter

You can get access to the [`history`](./history.md) object's properties and the closest [`<Route>`](./Route.md)'s [`match`](./match.md) via the `withRouter` higher-order component. `withRouter` will pass updated `match`, `location`, and `history` props to the wrapped component whenever it renders.

```jsx
import React from "react"
import PropTypes from "prop-types"
import { withRouter } from "react-router"

// A simple component that shows the pathname of the current location
class ShowTheLocation extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  }

  render() {
    const { match, location, history } = this.props

    return <div>You are now at {location.pathname}</div>
  }
}

// Create a new component that is "connected" (to borrow redux
// terminology) to the router.
const ShowTheLocationWithRouter = withRouter(ShowTheLocation)
```

#### Important Note

`withRouter` does not subscribe to location changes like React Redux's `connect` does for state changes. Instead, re-renders after location changes propagate out from the `<Router>` component. This means that `withRouter` does _not_ re-render on route transitions unless its parent component re-renders.

#### Static Methods and Properties

All non-react specific static methods and properties of the wrapped component are automatically copied to the
"connected" component.

## Component.WrappedComponent

The wrapped component is exposed as the static property `WrappedComponent` on the returned component, which can be used
for testing the component in isolation, among other things.

```jsx
// MyComponent.js
export default withRouter(MyComponent)

// MyComponent.test.js
import MyComponent from './MyComponent'
render(<MyComponent.WrappedComponent location={{...}} ... />)
```

## wrappedComponentRef: func

A function that will be passed as the `ref` prop to the wrapped component.

```jsx
class Container extends React.Component {
  componentDidMount() {
    this.component.doSomething()
  }

  render() {
    return <MyComponent wrappedComponentRef={c => (this.component = c)} />
  }
}
```
