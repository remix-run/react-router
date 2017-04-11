# Dealing with Update Blocking

React Router has a number of location-aware components that use the current `location` object to determine what they render. By default, the current `location` is passed implicitly to components using React's context model. When the location changes, those components should re-render using the new `location` object from the context.

React provides two approaches to optimize the rendering performance of applications: the `shouldComponentUpdate` lifecycle method and the `PureComponent`. Both block the re-rendering of components unless the right conditions are met. Unfortunately, this means that React Router's location-aware components can become out of sync with the current location if their re-rendering was prevented.

### Example of the Problem

We start out with a component that prevents updates.

```js
class UpdateBlocker extends React.PureComponent {
  render() {
    return this.props.children
  }
}
```

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

When the location changes, the `<UpdateBlocker>` does not detect any prop or state changes, so its child components will not be re-rendered.

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

In order to pass the current `location` object as a prop to a component, you must have access to it. The primary way that a component can get access to the `location` is via a `<Route>` component. When a `<Route>` matches (or always if you are using the `children` prop), it passes the current `location` to the child element it renders.

```js
<Route path='/here' component={Here}/>
const Here = (props) => {
  // props.location = { pathname: '/here', ... }
  return <div>You are here</div>
}

<Route path='/there' render={(props) => {
  // props.location = { pathname: '/there', ... }
  return <div>You are there</div>
}}/>

<Route path='/everywhere' children={(props) => {
  // props.location = { pathname: '/everywhere', ... }
  return <div>You are everywhere</div>
}}/>
```

This means that given a component that blocks updates, you can easily pass it the `location` as a prop in the following ways:

```js
// the Blocker is a "pure" component, so it will only
// update when it receives new props
class Blocker extends React.PureComponent {
  render() {
    <div>
      <NavLink to='/oz'>Oz</NavLink>
      <NavLink to='/kansas'>Kansas</NavLink>
    </div>
  }
}
```

1. A component rendered directly by a `<Route>` does not have to worry about blocked updates because it has the `location` injected as a prop.

```js
// The <Blocker>'s location prop will change whenever
// the location changes
<Route path='/:place' component={Blocker}/>
```

2. A component rendered directly by a `<Route>` can pass that location prop to any child elements it creates.

```js
<Route path='/parent' component={Parent} />

const Parent = (props) => {
  // <Parent> receives the location as a prop. Any child
  // element is creates can be passed the location.
  return (
    <SomeComponent>
      <Blocker location={props.location} />
    </SomeComponent>
  )
}
```

What happens when the component isn't being rendered by a `<Route>` and the component rendering it does not have the `location` in its variable scope? There are two approaches that you can take to automatically inject the `location` as a prop of your component.

1. Render a pathless `<Route>`. While `<Route>`s are typically used for matching a specific path, a pathless `<Route>` will always match, so it will always render its component.

```js
// pathless <Route> = <Blocker> will always be rendered
const MyComponent= () => (
  <SomeComponent>
    <Route component={Blocker} />
  </SomeComponent>
)
```

2. You can wrap a component with the `withRouter` higher-order component and it will be given the current `location` as one of its props.

```js
// internally, withRouter just renders a pathless <Route>
const BlockAvoider = withRouter(Blocker)

const MyComponent = () => (
  <SomeComponent>
    <BlockerAvoider />
  </SomeComponent>
)
```
