# Configuration Components

- [`Route`](#Route)
- [`PlainRoute`](#PlainRoute)
- [`Redirect`](#Redirect)
- [`IndexRoute`](#IndexRoute)
- [`IndexRedirect`](#IndexRedirect)

## <a id='Route'></a>[`Route`](#Route)
A `Route` is used to declaratively map routes to your application's
component hierarchy.

#### Props
##### `path`
The path used in the URL.

It will concat with the parent route's path unless it starts with `/`,
making it an absolute path.

**Note**: Absolute paths may not be used in route config that is [dynamically loaded](../guides/advanced/DynamicRouting.md).

If left undefined, the router will try to match the child routes.

##### `component`
A single component to be rendered when the route matches the URL. It can
be rendered by the parent route component with `this.props.children`.

```js
const routes = (
  <Route component={App}>
    <Route path="groups" component={Groups}/>
    <Route path="users" component={Users}/>
  </Route>
)

class App extends React.Component {
  render () {
    return (
      <div>
        {/* this will be either <Users> or <Groups> */}
        {this.props.children}
      </div>
    )
  }
}
```

##### `components`
Routes can define multiple components as an object of `name:component`
pairs to be rendered when the path matches the URL. They can be rendered
by the parent route component with `this.props.children[name]`.

```js
// think of it outside the context of the router, if you had pluggable
// portions of your `render`, you might do it like this
<App children={{main: <Users/>, sidebar: <UsersSidebar/>}}/>

// So with the router it looks like this:
const routes = (
  <Route component={App}>
    <Route path="groups" components={{main: Groups, sidebar: GroupsSidebar}}/>
    <Route path="users" components={{main: Users, sidebar: UsersSidebar}}>
      <Route path="users/:userId" component={Profile}/>
    </Route>
  </Route>
)

class App extends React.Component {
  render () {
    const { main, sidebar } = this.props.children
    return (
      <div>
        <div className="Main">
          {main}
        </div>
        <div className="Sidebar">
          {sidebar}
        </div>
      </div>
    )
  }
}

class Users extends React.Component {
  render () {
    return (
      <div>
        {/* if at "/users/123" `children` will be <Profile> */}
        {/* UsersSidebar will also get <Profile> as this.props.children,
            so its a little weird, but you can decide which one wants
            to continue with the nesting */}
        {this.props.children}
      </div>
    )
  }
}
```
##### `getComponent(location, callback)`
Same as `component` but asynchronous, useful for
code-splitting.

###### `callback` signature
`cb(err, component)`

```js
<Route path="courses/:courseId" getComponent={(location, cb) => {
  // do asynchronous stuff to find the components
  cb(null, Course)
}}/>
```

##### <a id='getComponents'></a>`getComponents(location, callback)`
Same as `components` but asynchronous, useful for
code-splitting.

###### `callback` signature
`cb(err, components)`

```js
<Route path="courses/:courseId" getComponent={(location, cb) => {
  // do asynchronous stuff to find the components
  cb(null, {sidebar: CourseSidebar, content: Course})
}}/>
```

##### `children`
Routes can be nested, `this.props.children` will contain the element created from the child route component. Please refer to the [Route Configuration](../guides/basics/RouteConfiguration.md) since this is a very critical part of the router's design.

##### `onEnter(nextState, replaceState)`
Called when a route is about to be entered. It provides the next router state and a function to redirect to another path.

##### `onLeave()`
Called when a route is about to be exited.



## <a id='PlainRoute'></a>[`PlainRoute`](#PlainRoute)
A plain JavaScript object route definition. `Router` turns JSX `<Route>`s into these objects, but you can use them directly if you prefer. All of the props are the same as `<Route>` props, except those listed here.

#### Props
##### `childRoutes`
An array of child routes, same as `children` in JSX route configs.

##### <a id='getChildRoutes'></a>`getChildRoutes(location, callback)`
Same as `childRoutes` but asynchronous and receives the `location`. Useful for code-splitting and dynamic route matching (given some state or session data to return a different set of child routes).

###### `callback` signature
`cb(err, routesArray)`

```js
let myRoute = {
  path: 'course/:courseId',
  childRoutes: [
    announcementsRoute,
    gradesRoute,
    assignmentsRoute
  ]
}

// async child routes
let myRoute = {
  path: 'course/:courseId',
  getChildRoutes(location, cb) {
    // do asynchronous stuff to find the child routes
    cb(null, [ announcementsRoute, gradesRoute, assignmentsRoute ])
  }
}

// navigation dependent child routes
// can link with some state
<Link to="/picture/123" state={{ fromDashboard: true }}/>

let myRoute = {
  path: 'picture/:id',
  getChildRoutes(location, cb) {
    let { state } = location

    if (state && state.fromDashboard) {
      cb(null, [dashboardPictureRoute])
    } else {
      cb(null, [pictureRoute])
    }
  }
}
```



## <a id='Redirect'></a>[`Redirect`](#Redirect)
A `<Redirect>` sets up a redirect to another route in your application to maintain old URLs.

#### Props
##### `from`
The path you want to redirect from, including dynamic segments.

##### `to`
The path you want to redirect to.

##### `query`
By default, the query parameters will just pass through but you can specify them if you need to.

```js
// Say we want to change from `/profile/123` to `/about/123`
// and redirect `/get-in-touch` to `/contact`
<Route component={App}>
  <Route path="about/:userId" component={UserProfile}/>
  {/* /profile/123 -> /about/123 */}
  <Redirect from="profile/:userId" to="about/:userId" />
</Route>
```

Note that the `<Redirect>` can be placed anywhere in the route hierarchy, though [normal precedence](../guides/basics/RouteMatching.md#precedence) rules apply. If you'd prefer the redirects to be next to their respective routes, the `from` path will match the same as a regular route `path`.

```js
<Route path="course/:courseId">
  <Route path="dashboard" />
  {/* /course/123/home -> /course/123/dashboard */}
  <Redirect from="home" to="dashboard" />
</Route>
```



## <a id='IndexRoute'></a>[`IndexRoute`](#IndexRoute)
Index Routes allow you to provide a default "child" to a parent
route when visitor is at the URL of the parent, they provide convention
for `<IndexLink>` to work.

Please see the [Index Routes guide](../guides/basics/IndexRoutes.md).

#### Props
All the same props as [Route](#Route) except for `path`.



## <a id='IndexRedirect'></a>[`IndexRedirect`](#IndexRedirect)
Index Redirects allow you to redirect from the URL of a parent route to another
route. They can be used to allow a child route to serve as the default route
for its parent, while still keeping a distinct URL.

Please see the [Index Routes guide](../guides/basics/IndexRoutes.md).

#### Props
All the same props as [Redirect](#redirect.md) except for `from`.
