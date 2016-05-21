# API Reference

- [Components](#components)
  - [`<Router>`](#router)
  - [`<Link>`](#link)
  - [`<IndexLink>`](#indexlink)
  - [`withRouter`](#withroutercomponent)
  - [`<RouterContext>`](#routercontext)
    - [`context.router`](#contextrouter)
  - `<RoutingContext>` (deprecated, use `<RouterContext>`)

- [Configuration Components](#configuration-components)
  - [`<Route>`](#route)
  - [`PlainRoute`](#plainroute)
  - [`<Redirect>`](#redirect)
  - [`<IndexRoute>`](#indexroute-1)
  - [`<IndexRedirect>`](#indexredirect)

- [Route Components](#route-components)
  - [Injected Props](#injected-props)
  - [Named Components](#named-components)

- [Histories](#histories)
  - [`browserHistory`](#browserhistory)
  - [`hashHistory`](#hashhistory)
  - [`createMemoryHistory()`](#creatememoryhistoryoptions)
  - [`useRouterHistory()`](#userouterhistorycreatehistory)

- [Utilities](#utilities)
  - [`match()`](#match-routes-location-history-options--cb)
  - [`createRoutes()`](#createroutesroutes)
  - [`PropTypes`](#proptypes)
  - [`useRoutes()`](#useroutescreatehistory-deprecated) (deprecated)

- [Mixins](#mixins-deprecated) (deprecated)
  - `Lifecycle` (deprecated)
  - `History` (deprecated)
  - `RouteContext` (deprecated)


## Components

### `<Router>`
Primary component of React Router. It keeps your UI and the URL in sync.

#### Props
##### `children` (required)
One or many [`<Route>`](#route)s or [`PlainRoute`](#plainroute)s. When the history changes, `<Router>` will match a branch of its routes, and render their configured [components](#routecomponent), with child route components nested inside the parents.

##### `routes`
Alias for `children`.

##### `history`
The history the router should listen to. Typically `browserHistory` or `hashHistory`.

```js
import { browserHistory } from 'react-router'
ReactDOM.render(<Router history={browserHistory} />, el)
```

##### `createElement(Component, props)`
When the router is ready to render a branch of route components, it will use this function to create the elements. You may want to take control of creating the elements when you're using some sort of data abstraction, like setting up subscriptions to stores, or passing in some sort of application module to each component via props.

```js
<Router createElement={createElement} />

// default behavior
function createElement(Component, props) {
  // make sure you pass all the props in!
  return <Component {...props} />
}

// maybe you're using something like Relay
function createElement(Component, props) {
  // make sure you pass all the props in!
  return <RelayContainer Component={Component} routerProps={props} />
}
```

##### `stringifyQuery(queryObject)`
A function used to convert an object from [`<Link>`](#link)s or calls to
[`transitionTo`](#transitiontopathname-query-state) to a URL query string.

##### `parseQueryString(queryString)`
A function used to convert a query string into an object that gets passed to route component props.

##### `onError(error)`
While the router is matching, errors may bubble up, here is your opportunity to catch and deal with them. Typically these will come from async features like [`route.getComponents`](#getcomponentsnextstate-callback), [`route.getIndexRoute`](#getindexroutelocation-callback), and [`route.getChildRoutes`](#getchildrouteslocation-callback).

##### `onUpdate()`
Called whenever the router updates its state in response to URL changes.

##### `render(props)`
This is primarily for integrating with other libraries that need to participate in rendering before the route components are rendered. It defaults to `render={(props) => <RouterContext {...props} />}`.

Ensure that you render a `<RouterContext>` at the end of the line, passing all the props passed to `render`.


#### Examples
Please see the [`examples/`](/examples) directory of the repository for extensive examples of using `<Router>`.



### `<Link>`
The primary way to allow users to navigate around your application. `<Link>` will render a fully accessible anchor tag with the proper href.

A `<Link>` can know when the route it links to is active and automatically apply an `activeClassName` and/or `activeStyle` when given either prop. The `<Link>` will be active if the current route is either the linked route or any descendant of the linked route. To have the link be active only on the exact linked route, use [`<IndexLink>`](#indexlink) instead or set the `onlyActiveOnIndex` prop.

#### Props
##### `to`
A [location descriptor](https://github.com/mjackson/history/blob/master/docs/Glossary.md#locationdescriptor). Usually this is a string or an object, with the following semantics:

* If it's a string it represents the absolute path to link to, e.g. `/users/123` (relative paths are not supported).
* If it's an object it can have four keys:
  * `pathname`: A string representing the path to link to.
  * `query`: An object of key:value pairs to be stringified.
  * `hash`: A hash to put in the URL, e.g. `#a-hash`.
  * `state`: State to persist to the `location`.

##### `query` **([Deprecated](/upgrade-guides/v2.0.0.md#link-to-onenter-and-isactive-use-location-descriptors) see `to`)**
An object of key:value pairs to be stringified.

##### `hash` **([Deprecated](/upgrade-guides/v2.0.0.md#link-to-onenter-and-isactive-use-location-descriptors) see `to`)**
A hash to put in the URL, e.g. `#a-hash`.

_Note: React Router currently does not manage scroll position, and will not scroll to the element corresponding to the hash._

##### `state` **([Deprecated](/upgrade-guides/v2.0.0.md#link-to-onenter-and-isactive-use-location-descriptors) see `to`)**
State to persist to the `location`.

##### `activeClassName`
The className a `<Link>` receives when its route is active. No active class by default.

##### `activeStyle`
The styles to apply to the link element when its route is active.

##### `onClick(e)`
A custom handler for the click event. Works just like a handler on an `<a>` tag - calling `e.preventDefault()` will prevent the transition from firing, while `e.stopPropagation()` will prevent the event from bubbling.

##### `onlyActiveOnIndex`
If `true`, the `<Link>` will only be active when the current route exactly matches the linked route.

##### *others*
You can also pass props you'd like to be on the `<a>` such as a `title`, `id`, `className`, etc.

#### Example
Given a route like `<Route path="/users/:userId" />`:

```js
<Link to={`/users/${user.id}`} activeClassName="active">{user.name}</Link>
// becomes one of these depending on your History and if the route is
// active
<a href="/users/123" class="active">Michael</a>
<a href="#/users/123">Michael</a>

// change the activeClassName
<Link to={`/users/${user.id}`} activeClassName="current">{user.name}</Link>

// change style when link is active
<Link to="/users" style={{color: 'white'}} activeStyle={{color: 'red'}}>Users</Link>
```

### `<IndexLink>`
An `<IndexLink>` is like a [`<Link>`](#link), except it is only active when the current route is exactly the linked route. It is equivalent to `<Link>` with the `onlyActiveOnIndex` prop set.

### `withRouter(component)`
A HoC (higher-order component) that wraps another component to provide `this.props.router`. Pass in your component and it will return the wrapped component.

### `<RouterContext>`
A `<RouterContext>` renders the component tree for a given router state. Its used by `<Router>` but also useful for server rendering and integrating in brownfield development.

It also provides a `router` object on [context](https://facebook.github.io/react/docs/context.html).

#### `context.router`

Contains data and methods relevant to routing. Most useful for imperatively transitioning around the application.

##### `push(pathOrLoc)`
Transitions to a new URL, adding a new entry in the browser history.

```js
router.push('/users/12')

// or with a location descriptor object
router.push({
  pathname: '/users/12',
  query: { modal: true },
  state: { fromDashboard: true }
})
```

##### `replace(pathOrLoc)`
Identical to `push` except replaces the current history entry with a new one.

##### `go(n)`
Go forward or backward in the history by `n` or `-n`.

##### `goBack()`
Go back one entry in the history.

##### `goForward()`
Go forward one entry in the history.

##### `setRouteLeaveHook(route, hook)`
Registers the given hook function to run before leaving the given route.

During a normal transition, the hook function receives the next location as its only argument and can return either a prompt message (string) to show the user, to make sure they want to leave the page; or `false`, to prevent the transition. Any other return value will have no effect.

During the beforeunload event (in browsers) the hook receives no arguments.
In this case it must return a prompt message to prevent the transition.

Returns a function that may be used to unbind the listener.

You don't need to manually tear down the route leave hook in most cases. We automatically remove all attached route leave hooks after leaving the associated route.

##### `createPath(pathOrLoc, query)`
Stringifies the query into the pathname, using the router's config.

##### `createHref(pathOrLoc, query)`
Creates a URL, using the router's config. For example, it will add `#/` in front of the `pathname` for hash history.

##### `isActive(pathOrLoc, indexOnly)`
Returns `true` or `false` depending on if the `pathOrLoc` is active. Will be true for every route in the route branch matched (child route is active, therefore parent is too), unless `indexOnly` is specified, in which case it will only match the exact path.

A route is only considered active if all the URL parameters match, including optional parameters and their presence or absence.

However, only explicitly specified query parameters will be checked. That means that `isActive({ pathname: '/foo', query: { a: 'b' } })` will return `true` when the location is `/foo?a=b&c=d`. To require that a query parameter be absent, specify its value as an explicit `undefined`, e.g. `isActive({ pathname: '/foo', query: { a: 'b', c: undefined } })`, which would be `false` in this example.


## Configuration Components

### `<Route>`
A `<Route>` is used to declaratively map routes to your application's
component hierarchy.

#### Props
##### `path`
The path used in the URL.

It will concat with the parent route's path unless it starts with `/`,
making it an absolute path.

**Note**: Absolute paths may not be used in route config that is [dynamically loaded](/docs/guides/DynamicRouting.md).

If left undefined, the router will try to match the child routes.

##### `component`
A single component to be rendered when the route matches the URL. It can
be rendered by the parent route component with `this.props.children`.

```js
const routes = (
  <Route component={App}>
    <Route path="groups" component={Groups} />
    <Route path="users" component={Users} />
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
Routes can define one or more named components as an object of `[name]: component` pairs to be rendered when the path matches the URL. They can be rendered by the parent route component with `this.props[name]`.

```js
// Think of it outside the context of the router - if you had pluggable
// portions of your `render`, you might do it like this:
// <App main={<Users />} sidebar={<UsersSidebar />} />

const routes = (
  <Route component={App}>
    <Route path="groups" components={{main: Groups, sidebar: GroupsSidebar}} />
    <Route path="users" components={{main: Users, sidebar: UsersSidebar}}>
      <Route path=":userId" component={Profile} />
    </Route>
  </Route>
)

class App extends React.Component {
  render () {
    const { main, sidebar } = this.props
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

##### `getComponent(nextState, callback)`
Same as `component` but asynchronous, useful for
code-splitting.

###### `callback` signature
`cb(err, component)`

```js
<Route path="courses/:courseId" getComponent={(nextState, cb) => {
  // do asynchronous stuff to find the components
  cb(null, Course)
}} />
```

##### `getComponents(nextState, callback)`
Same as `components` but asynchronous, useful for
code-splitting.

###### `callback` signature
`cb(err, components)`

```js
<Route path="courses/:courseId" getComponents={(nextState, cb) => {
  // do asynchronous stuff to find the components
  cb(null, {sidebar: CourseSidebar, content: Course})
}} />
```

##### `children`
Routes can be nested, `this.props.children` will contain the element created from the child route component. Please refer to the [Route Configuration](/docs/guides/RouteConfiguration.md) since this is a very critical part of the router's design.

##### `onEnter(nextState, replace, callback?)`
Called when a route is about to be entered. It provides the next router state and a function to redirect to another path. `this` will be the route instance that triggered the hook.

If `callback` is listed as a 3rd argument, this hook will run asynchronously, and the transition will block until `callback` is called.

##### `onChange(prevState, nextState, replace, callback?)`
Called on routes when the location changes, but the route itself neither enters or leaves. For example, this will be called when a route's children change, or when the location query changes. It provides the previous router state, the next router state, and a function to redirect to another path. `this` will be the route instance that triggered the hook.

If `callback` is listed as a 4th argument, this hook will run asynchronously, and the transition will block until `callback` is called.

##### `onLeave()`
Called when a route is about to be exited.


### `PlainRoute`
A plain JavaScript object route definition. `<Router>` turns JSX `<Route>`s into these objects, but you can use them directly if you prefer. All of the props are the same as `<Route>` props, except those listed here.

#### Props
##### `childRoutes`
An array of child routes, same as `children` in JSX route configs.

##### `getChildRoutes(location, callback)`
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
<Link to="/picture/123" state={{ fromDashboard: true }} />

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

##### `indexRoute`
The [index route](/docs/guides/IndexRoutes.md). This is the same as specifying an `<IndexRoute>` child when using JSX route configs.

##### `getIndexRoute(location, callback)`

Same as `indexRoute`, but asynchronous and receives the `location`. As with `getChildRoutes`, this can be useful for code-splitting and dynamic route matching.

###### `callback` signature
`cb(err, route)`

```js
// For example:
let myIndexRoute = {
  component: MyIndex
}

let myRoute = {
  path: 'courses',
  indexRoute: myIndexRoute
}

// async index route
let myRoute = {
  path: 'courses',
  getIndexRoute(location, cb) {
    // do something async here
    cb(null, myIndexRoute)
  }
}
```



### `<Redirect>`
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
  <Route path="about/:userId" component={UserProfile} />
  {/* /profile/123 -> /about/123 */}
  <Redirect from="profile/:userId" to="about/:userId" />
</Route>
```

Note that the `<Redirect>` can be placed anywhere in the route hierarchy, though [normal precedence](/docs/guides/RouteMatching.md#precedence) rules apply. If you'd prefer the redirects to be next to their respective routes, the `from` path will match the same as a regular route `path`.

```js
<Route path="course/:courseId">
  <Route path="dashboard" />
  {/* /course/123/home -> /course/123/dashboard */}
  <Redirect from="home" to="dashboard" />
</Route>
```



### `<IndexRoute>`
An `<IndexRoute>` allows you to provide a default "child" to a parent route when visitor is at the URL of the parent.

Please see the [Index Routes guide](/docs/guides/IndexRoutes.md).

#### Props
All the same props as [Route](#route) except for `path`.



### `<IndexRedirect>`
An `<IndexRedirect>` allows you to redirect from the URL of a parent route to another route. They can be used to allow a child route to serve as the default route for its parent, while still keeping a distinct URL.

Please see the [Index Routes guide](/docs/guides/IndexRoutes.md).

#### Props
All the same props as [Redirect](#redirect) except for `from`.



## Route Components
A route's component is rendered when that route matches the URL. The router will inject the following properties into your component when it's rendered:

### Injected Props

#### `location`
The current [location](https://github.com/reactjs/history/blob/master/docs/Location.md).

#### `params`
The dynamic segments of the URL.

#### `route`
The route that rendered this component.

#### `routeParams`
A subset of `this.props.params` that were directly specified in this component's route. For example, if the route's path is `users/:userId` and the URL is `/users/123/portfolios/345` then `this.props.routeParams` will be `{userId: '123'}`, and `this.props.params` will be `{userId: '123', portfolioId: 345}`.

#### `children`
The matched child route element to be rendered. If the route has [named components](/docs/API.md#named-components) then this will be undefined, and the components will instead be available as direct properties on `this.props`.

##### Example
```js
render((
  <Router>
    <Route path="/" component={App}>
      <Route path="groups" component={Groups} />
      <Route path="users" component={Users} />
    </Route>
  </Router>
), node)

class App extends React.Component {
  render() {
    return (
      <div>
        {/* this will be either <Users> or <Groups> */}
        {this.props.children}
      </div>
    )
  }
}
```

#### `history` (deprecated)

### Named Components
When a route has one or more named components, the child elements are available by name on `this.props`. In this case `this.props.children` will be undefined. All route components can participate in the nesting.

#### Example
```js
render((
  <Router>
    <Route path="/" component={App}>
      <Route path="groups" components={{main: Groups, sidebar: GroupsSidebar}} />
      <Route path="users" components={{main: Users, sidebar: UsersSidebar}}>
        <Route path="users/:userId" component={Profile} />
      </Route>
    </Route>
  </Router>
), node)

class App extends React.Component {
  render() {
    // the matched child route components become props in the parent
    return (
      <div>
        <div className="Main">
          {/* this will either be <Groups> or <Users> */}
          {this.props.main}
        </div>
        <div className="Sidebar">
          {/* this will either be <GroupsSidebar> or <UsersSidebar> */}
          {this.props.sidebar}
        </div>
      </div>
    )
  }
}

class Users extends React.Component {
  render() {
    return (
      <div>
        {/* if at "/users/123" this will be <Profile> */}
        {/* UsersSidebar will also get <Profile> as this.props.children.
            You can pick where it renders */}
        {this.props.children}
      </div>
    )
  }
}
```



## Histories

For more details, please see the [histories guide](/docs/guides/Histories.md).

### `browserHistory`
`browserHistory` uses the HTML5 History API when available, and falls back to full refreshes otherwise. `browserHistory` requires additional configuration on the server side to serve up URLs, but is the generally preferred solution for modern web pages.


### `hashHistory`
`hashHistory` uses URL hashes, along with a query key to keep track of state. `hashHistory` requires no additional server configuration, but is generally less preferred than `browserHistory`.


### `createMemoryHistory(options)`
`createMemoryHistory` creates an in-memory `history` object that does not interact with the browser URL. This is useful when you need to customize the `history` used for server-side rendering, as well as for automated testing.


### `useRouterHistory(createHistory)`
`useRouterHistory` is a `history` enhancer that configures a given `createHistory` factory to work with React Router. This allows using custom histories in addition to the bundled singleton histories.

It also pre-enhances the history with the
[useQueries](https://github.com/mjackson/history/blob/master/docs/QuerySupport.md)
and
[useBasename](https://github.com/mjackson/history/blob/master/docs/BasenameSupport.md)
enhancers from `history`

#### Example
```js
import createHashHistory from 'history/lib/createHashHistory'
const history = useRouterHistory(createHashHistory)({ queryKey: false })
```



## Utilities

### `match({ routes, location, [history], ...options }, cb)`

This function is to be used for server-side rendering. It matches a set of routes to a location, without rendering, and calls a `callback(error, redirectLocation, renderProps)` when it's done.

The function will create a `history` for you, passing the additional `options` along to create it. These options can include `basename` to control the base name for URLs, as well as the pair of `parseQueryString` and `stringifyQuery` to control query string parsing and serializing. You can also pass in an already instantiated `history` object, which can be constructed however you like.

The three arguments to the callback function you pass to `match` are:
- `error`: A Javascript `Error` object if an error occurred, `undefined` otherwise.
- `redirectLocation`: A [Location](/docs/Glossary.md#location) object if the route is a redirect, `undefined` otherwise.
- `renderProps`: The props you should pass to the routing context if the route matched, `undefined` otherwise.

If all three parameters are `undefined`, this means that there was no route found matching the given location.

*Note: You probably don't want to use this in a browser unless you're doing server-side rendering of async routes.*


### `createRoutes(routes)`

Creates and returns an array of routes from the given object which may be a JSX route, a plain object route, or an array of either.

#### params
##### `routes`
One or many [`<Route>`](#route)s or [`PlainRoute`](#plainroute)s.


### `PropTypes`
The following prop types are exported at top level and from `react-router/lib/PropTypes`:
- `routerShape`: Shape for the `router` object on context
- `locationShape`: Shape for the `location` object on route component props

Previously, a number of prop types intended for internal use were also exported under `PropTypes`. These are deprecated and should not be used.


### `useRoutes(createHistory)` (deprecated)


## Mixins (deprecated)

Deprecated, please see the [upgrade guide](/upgrade-guides/v2.0.0.md#mixins-are-deprecated).
