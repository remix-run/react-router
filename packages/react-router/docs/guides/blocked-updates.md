# Dealing with Update Blocking

React's `shouldComponentUpdate` lifecycle method optimizes rendering performance by blocking the re-rendering of components. Unfortunately, this means that React Router's location-aware components can become out of sync with the current location if their re-rendering was prevented. For example, a `<NavLink>` that is "active" for a location may continue to be styled as active after a location change, despite no longer matching the current URL, because it is not updated when the location changed.

### Example of the Problem

When the `<UpdateBlocker>` is mounting, any location-aware child components will use the current location and match information to render.

```js
// location = { pathname: '/about' }
<UpdateBlocker>
  <NavLink to='/about'>About</NavLink>
  // <a href='/about' class='active'>About</a>
  <NavLink to='/faq'>F.A.Q.</NavLink>
  // <a href='/faq'>F.A.Q.</a>
</UpdateBlocker>
```

When the location changes, the `<UpdateBlocker>`'s `shouldComponentUpdate` method will return `false`, and any children inside of it will not be re-rendered

```js
// location = { pathname: '/faq' }
<UpdateBlocker>
  // the links will not re-render, so they retain their previous attributes
  <NavLink to='/about'>About</NavLink>
  // <a href='/about' class='active'>About</a>
  <NavLink to='/faq'>F.A.Q.</NavLink>
  // <a href='/faq'>F.A.Q.</a>
</UpdateBlocker>
```

### Third-Party Code

You may run into issues of components not updating after a location change despite not calling `shouldComponentUpdate` yourself. This is most likely because `shouldComponentUpdate` is being called by third-party code, such as `react-redux`'s `connect` and `mobx-react`'s `observer`.

```js
// react-redux
const MyConnectedComponent = connect(mapStateToProps)(MyComponent)

// mobx-react
const MyObservedComponent = observer(MyComponent)
```

Both of those create components that do a shallow comparison of their current props and their next props in `shouldComponentUpdate`. Those components will only re-render when at least one prop has changed.


### The Solution

The key to getting around `shouldComponentUpdate` blocking re-renders after location changes is to pass the blocking component a prop that is different every time the location changes. The obvious choice for this is the `location` object.

```js
// location = { pathname: '/about' }
<UpdateBlocker location={location}>
  <NavLink to='/about'>About</NavLink>
  // <a href='/about' class='active'>About</a>
  <NavLink to='/faq'>F.A.Q.</NavLink>
  // <a href='/faq'>F.A.Q.</a>
</UpdateBlocker>

// location = { pathname: '/faq' }
<UpdateBlocker location={location}>
  <NavLink to='/about'>About</NavLink>
  // <a href='/about'>About</a>
  <NavLink to='/faq'>F.A.Q.</NavLink>
  // <a href='/faq' class='active'>F.A.Q.</a>
</UpdateBlocker>
```

#### Getting the location

In order to pass the `location` as a prop, you must have access to the current location. There are two approaches that you can consider for this:

1. Components rendered by a `<Route>` are passed the `history`, the route's `match`, and the current `location`. While `<Route>`s are typically used for matching a specific path, you can render a pathless `<Route>` which will always match.

```js
<Route render={({ location }) => (
  <UpdateBlocker location={location}>
    ...
  </UpdateBlocker>
)}/>
```

2. You can wrap a component with the `withRouter` higher-order component. That component will then have access to the current location as one of its props.

```js
class BlockAvoider extends React.Component {
  render() {
    return (
      <UpdateBlocker location={location}>
        ...
      </UpdateBlocker>
    )
  }
}

BlockAvoider = withRouter(BlockAvoider)
```
