# Dealing with Update Blocking

React Router has a number of location-aware components that use the current `location` object to determine what they render. By default, the current `location` is passed implicitly to components using React's context model. When the location changes, those components should re-render using the new `location` object from the context.

React provides two approaches to optimize the rendering performance of applications: the `shouldComponentUpdate` lifecycle method and the `PureComponent`. Both block the re-rendering of components unless the right conditions are met. Unfortunately, this means that React Router's location-aware components can become out of sync with the current location if their re-rendering was prevented.

### Example of the Problem

When the `<UpdateBlocker>` is mounting, any location-aware child components will use the current `location` and `match` objects to render.

```js
// location = { pathname: '/about' }
<UpdateBlocker>
  <NavLink to='/about'>About</NavLink>
  // <a href='/about' class='active'>About</a>
  <NavLink to='/faq'>F.A.Q.</NavLink>
  // <a href='/faq'>F.A.Q.</a>
</UpdateBlocker>
```

When the location changes, the `<UpdateBlocker>`'s `shouldComponentUpdate` method will return `false`, and its child components will not be re-rendered.

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

### `shouldComponentUpdate`

In order for a component that implements `shouldComponentUpdate` to know that it _should_ update when the location changes, its `shouldComponentUpdate` method needs to be able to detect location changes.

If you are implementing `shouldComponentUpdate` yourself, you _could_ compare the location from the current and next `context.router` objects. However, as a user, you should not have to use context directly. Instead, it would be ideal if you could compare the current and next `location` without touching the context.

#### Third-Party Code

You may run into issues with components not updating after a location change despite not calling `shouldComponentUpdate` yourself. This is most likely because `shouldComponentUpdate` is being called by third-party code, such as `react-redux`'s `connect` and `mobx-react`'s `observer`.

```js
// react-redux
const MyConnectedComponent = connect(mapStateToProps)(MyComponent)

// mobx-react
const MyObservedComponent = observer(MyComponent)
```

With third-party code, you likely cannot even control the implementation of `shouldComponentUpdate`. Instead, you will have to structure your code to make location changes obvious to those methods.

Both `connect` and `observer` create components whose `shouldComponentUpdate` methods do a shallow comparison of their current `props` and their next `props`. Those components will only re-render when at least one prop has changed. This means that in order to ensure they update when the location changes, they will need to be given a prop that changes when the location changes.

### `PureComponent`

React's `PureComponent` does not implement `shouldComponentUpdate`, but it takes a similar approach to preventing updates. When a "pure" component updates, it will do a shallow comparison of its current `props` and `state` to the next `props` and `state`. If the comparison does not detect any differences, the component will not update. Like with `shouldComponentUpdate`, that means that in order to force a "pure" component to update when the location changes, it needs to have a prop or state that has changed.

### The Solution

The key to avoiding blocked re-renders after location changes is to pass the blocking component the `location` object as a prop. This will be different whenever the location changes, so comparisons will detect that the current and next location are different.

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

In order to pass the current `location` object as a prop, you must have access to it. There are two approaches that you should consider for this:

1.
Render a pathless `<Route>`. While `<Route>`s are typically used for matching a specific path, a pathless `<Route>` will always match, so it will always render its component. The current `location` object is one of the props that a `<Route>` passes to the component it renders.

```js
<Route render={({ location }) => (
  <UpdateBlocker location={location}>
    ...
  </UpdateBlocker>
)}/>
```

2.
You can wrap a component with the `withRouter` higher-order component and it will be given the current `location` as one of its props.

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
