# API Reference

* [Components](#components)
  - [Router](#router)
  - [Link](#link)
  - [IndexLink](#indexlink)
  - [RoutingContext](#routingcontext)  

* [Configuration Components](#configuration-components)
  - [Route](#route)
  - [PlainRoute](#plainroute)
  - [Redirect](#redirect)
  - [IndexRoute](#indexroute)  

* [Handler Components](#handler-components)

* [Mixins](#mixins)
  - [Lifecycle](#lifecycle-mixin)
  - [History](#history-mixin)
  - [RouteContext](#routecontext-mixin)  

* [Utilities](#utilities)
  * [useRoutes](#useroutescreatehistory)
  * [createRoutes](#createroutesroutes)
  * [PropTypes](#proptypes)


## Components

### Router
Primary component of React Router. It keeps your UI and the URL in sync.

#### Props
##### `children` (required)
One or many [`Routes`](#route) or [`PlainRoutes`](#plainroute). When the
history changes, `Router` will match a branch of its [`Routes`](#route),
and render their configured [components](#routecomponent), with child
route components nested inside the parents.

##### `routes`
Alias for `children`.

##### `history`
The history the router should listen to from the `history` package.

##### `createElement(Component, props)`
When the router is ready to render a branch of route components, it will
use this function to create the elements. You may want to take control
of creating the elements when you're using some sort of data abstraction, like setting up subscriptions to stores, or passing in some sort of application module to each component via props.

```js
<Router createElement={createElement}/>

// default behavior
function createElement(Component, props) {
  // make sure you pass all the props in!
  return <Component {...props}/>
}

// maybe you're using something like Relay
function createElement(Component, props) {
  // make sure you pass all the props in!
  return <RelayContainer Component={Component} routerProps={props}/>
}
```

##### `stringifyQuery(queryObject)`
A function used to convert an object from [`Link`](#link)s or calls to
[`transitionTo`](#transitiontopathname-query-state) to a URL query string.

##### `parseQueryString(queryString)`
A function used to convert a query string into an object that gets passed to route component props.

##### `onError(error)`
While the router is matching, errors may bubble up, here is your opportunity to catch and deal with them. Typically these will come from async features like [`route.getComponents`](#getcomponentscallback) and [`route.getChildRoutes`](#getchildrouteslocation-callback).

##### `onUpdate()`
Called whenever the router updates its state in response to URL changes.

#### Examples
Please see the [`examples/`](/examples) directory of the repository for extensive examples of using `Router`.



### Link
The primary way to allow users to navigate around your application.
`Link` will render a fully accessible anchor tag with the proper href.

A `Link` also knows when the route it links to is active and automatically
applies its `activeClassName` and/or `activeStyle` when it is.

#### Props
##### `to`
The path to link to, e.g., `/users/123`.

##### `query`
An object of key:value pairs to be stringified.

##### `state`
State to persist to the `location`.

##### `activeClassName`
The className a `Link` receives when its route is active. No active class by default.

##### `activeStyle`
The styles to apply to the link element when its route is active.

##### `onClick`
A custom handler for the click event. Works just like a handler on an `<a>`
tag - calling `e.preventDefault()` or returning `false` will prevent the
transition from firing, while `e.stopPropagation()` will prevent the event
from bubbling.

##### *others*
You can also pass props you'd like to be on the `<a>` such as a title, id, className, etc.

#### Example
Given a route like `<Route path="/users/:userId"/>`:

```js
<Link to={`/users/${user.id}`}>{user.name}</Link>
// becomes one of these depending on your History and if the route is
// active
<a href="/users/123" class="active">Michael</a>
<a href="#/users/123">Michael</a>

// change the activeClassName
<Link to={`/users/${user.id}`} activeClassName="current">{user.name}</Link>

// change style when link is active
<Link to="/users" style={{color: 'white'}} activeStyle={{color: 'red'}}>Users</Link>
```

### IndexLink
Docs coming so soon!

### RoutingContext
A `RoutingContext` renders the component tree for a given router state and sets the history object and the current location in context.



## Configuration Components

## Route
A `Route` is used to declaratively map routes to your application's
component hierarchy.

#### Props
##### `path`
The path used in the URL.

It will concat with the parent route's path unless it starts with `/`,
making it an absolute path.

**Note**: Absolute paths may not be used in route config that is [dynamically loaded](/docs/guides/advanced/DynamicRouting.md).

If left undefined, the router will try to match the child routes.

##### `component`
A single component to be rendered when the route matches the url. It can
be rendered by the parent route component with `this.props.children`.

```js
const routes = (
  <Route component={App}>
    <Route path="groups" component={Groups}/>
    <Route path="users" component={Users}/>
  </Route>
)

const App = React.createClass({
  render () {
    return (
      <div>
        {/* this will be either <Users> or <Groups> */}
        {this.props.children}
      </div>
    )
  }
})
```

##### `components`
Routes can define multiple components as an object of `name:component`
pairs to be rendered when the path matches the url. They can be rendered
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

const App = React.createClass({
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
})

const Users = React.createClass({
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
})
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

##### `getComponents(location, callback)`
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
Routes can be nested, `this.props.children` will contain the element created from the child route component. Please refer to the [Route Configuration](/docs/guides/basics/RouteConfiguration.md) since this is a very critical part of the router's design.

##### `onEnter(nextState, replaceState)`
Called when a route is about to be entered. It provides the next router state and a function to redirect to another path.

##### `onLeave()`
Called when a route is about to be exited.



## PlainRoute
A plain JavaScript object route definition. `Router` turns JSX
`<Route/>`s into these objects, but you can use them directly if you
prefer. All of the props are the same as `<Route/>` props, except
those listed here.

#### Props
##### `childRoutes`
An array of child routes, same as `children` in JSX route configs.

##### `getChildRoutes(location, callback)`
Same as `childRoutes` but asynchronous and receives the `location`.
Useful for code-splitting and dynamic route matching (given some state
or session data to return a different set of child routes).

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
  getChildRoutes (location, cb) {
    // do asynchronous stuff to find the child routes
    cb(null, [announcementsRoute, gradesRoute, assignmentsRoute])
  }
}

// navigation dependent child routes
// can link with some state
<Link to="/picture/123" state={{fromDashboard: true}}/>

let myRoute = {
  path: 'picture/:id',
  getChildRoutes (location, cb) {
    let { state } = location
    if (state && state.fromDashboard)
      cb(null, [dashboardPictureRoute])
    else
      cb(null, [pictureRoute])
  }
}
```



## Redirect
A `Redirect` sets up a redirect to another route in your application to
maintain old URLs.

#### Props
##### `from`
The path you want to redirect from, including dynamic segments.

##### `to`
The path you want to redirect to.

##### `query`
By default, the query parameters will just pass through but you can
specify them if you need to.

```js
// lets say we want to change from `/profile/123` to `/about/123`
// and redirect `/get-in-touch` to `/contact`
<Route component={App}>
  <Route path="about/:userId" component={UserProfile}/>

  {/* `/profile/123` -> `/about/123` */}
  <Redirect from="/profile/:userId" to="/about/:userId" />
</Route>
```

Note that the `<Redirect/>` can be placed anywhere in the route hierarchy, though [normal precedence](/docs/guides/basics/RouteMatching.md#precedence) rules apply. If you'd prefer the redirects to be next to their respective routes, the `from` path will match the same as a regular route `path`.  Currently, the `to` property of `<Redirect/>` needs to be an absolute path. Pull requests welcome to make them handle relative paths too!

```js
<Route path="course/:courseId">
  <Route path="dashboard"/>
  {/* /course/123/home -> /course/123/dashboard */}
  <Redirect from="home" to="/course/:courseId/dashboard" />
</Route>
```


## IndexRoute
Index Routes allow you to provide a default "child" to a parent
route when visitor is at the url of the parent, they provide convention
for `<IndexLink/>` to work.

Please see the [Index Routes guide](/docs/guides/basics/IndexRoutes.md)

#### Props
All the same props as [Route](#route) except for `path`.



## Handler Components
A route's handler component is rendered when that route matches the URL. The router will inject the following properties into your component when it's rendered:

#### `isTransitioning`
A boolean value that is `true` when the router is transitioning, `false` otherwise.

#### `location`
The current [location](https://github.com/rackt/history/blob/master/docs/Location.md).

#### `params`
The dynamic segments of the URL.

#### `route`
The route that rendered this component.

#### `routeParams`
A subset of `this.props.params` that were directly specified in this component's route. For example, if the route's path is `users/:userId` and the URL is `/users/123/portfolios/345` then `this.props.routeParams` will be `{userId: '123'}`, and `this.props.params` will be `{userId: '123', portfolioId: 345}`.

#### `children`
The matched child route elements to be rendered.

##### Example
```js
React.render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="groups" component={Groups} />
      <Route path="users" component={Users} />
    </Route>
  </Router>
), node)

const App = React.createClass({
  render() {
    return (
      <div>
        {/* this will be either <Users> or <Groups> */}
        {this.props.children}
      </div>
    )
  }
})
```

### Named Components
When a route has multiple components, the child elements are available by name on `this.props.children`. All route components can participate in the nesting.

#### Example
```js
React.render((
  <Router>
    <Route path="/" component={App}>
      <Route path="groups" components={{main: Groups, sidebar: GroupsSidebar}} />
      <Route path="users" components={{main: Users, sidebar: UsersSidebar}}>
        <Route path="users/:userId" component={Profile} />
      </Route>
    </Route>
  </Router>
), node)

const App = React.createClass({
  render() {
    // the matched child route components become props in the parent
    return (
      <div>
        <div className="Main">
          {/* this will either be <Groups> or <Users> */}
          {this.props.children.main}
        </div>
        <div className="Sidebar">
          {/* this will either be <GroupsSidebar> or <UsersSidebar> */}
          {this.props.children.sidebar}
        </div>
      </div>
    )
  }
})

const Users = React.createClass({
  render() {
    return (
      <div>
        {/* if at "/users/123" this will be <Profile> */}
        {/* UsersSidebar will also get <Profile> as this.props.children,
            you pick where it renders */}
        {this.props.children}
      </div>
    )
  }
})
```



## Mixins

## Lifecycle Mixin
Adds a hook to your component instance that is called when the router is
about to navigate away from the route the component is configured on,
with the opportunity to cancel the transition. Mostly useful for forms
that are partially filled out.

On standard transitions, `routerWillLeave` receives a single argument: the `location` we're transitioning to. To cancel the transition, return false.

To prompt the user for confirmation, return a prompt message (string). `routerWillLeave` does not receive a location object during the beforeunload event in web browsers (assuming you're using the `useBeforeUnload` history enhancer). In this case, it is not possible for us to know the location we're transitioning to so `routerWillLeave` must return a prompt message to prevent the user from closing the tab.

#### Lifecycle Methods
##### `routerWillLeave(nextLocation)`
Called when the router is attempting to transition away from the route
that rendered this component.

##### arguments
- `nextLocation` - the next location



## History Mixin
Adds the router's `history` object to your component instance.

**Note**: You do not need this mixin for route components, its already
available as `this.props.history`. This is for components deeper in the
render tree that need access to the router's history object.

#### Methods
##### `pushState(state, pathname, query)`
Transitions to a new URL.

###### arguments
- `state` - the location state.
- `pathname` - the full url with or without the query.
- `query` - an object that will be stringified by the router.

##### `replaceState(state, pathname, query)`
Replaces the current URL with a new one, without affecting the length of
the history (like a redirect).

###### arguments
- `state` - the location state.
- `pathname` - the full url with or without the query.
- `query` - an object that will be stringified by the router.

##### `go(n)`
Go forward or backward in the history by `n` or `-n`.

##### `goBack()`
Go back one entry in the history.

##### `goForward()`
Go forward one entry in the history.

##### `createPath(pathname, query)`
Stringifies the query into the pathname, using the router's config.

##### `createHref(pathname, query)`
Creates a URL, using the router's config. For example, it will add `#/` in
front of the `pathname` for hash history.

##### `isActive(pathname, query)`
Returns `true` or `false` depending on if the current path is active.
Will be true for every route in the route branch matched by the
`pathname` (child route is active, therefore parent is too).

###### arguments
- `pathname` - the full url with or without the query.
- `query` - an object that will be stringified by the router.

#### Examples
```js
import { History } from 'react-router'

React.createClass({

  mixins: [ History ],

  render() {
    return (
      <div>
        <div onClick={() => this.history.pushState(null, '/foo')}>Go to foo</div>
        <div onClick={() => this.history.replaceState(null, 'bar')}>Go to bar without creating a new history entry</div>
        <div onClick={() => this.history.goBack()}>Go back</div>
     </div>
   )
 }
})
```

Let's say you are using bootstrap and want to get `active` on those `li`
tags for the Tabs:

```js
import { Link, History } from 'react-router'

let Tab = React.createClass({

  mixins: [ History ],

  render() {
    let isActive = this.history.isActive(this.props.to, this.props.query)
    let className = isActive ? 'active' : ''
    return <li className={className}><Link {...this.props}/></li>
  }

})

// use it just like <Link/>, and you'll get an anchor wrapped in an `li`
// with an automatic `active` class on both.
<Tab href="foo">Foo</Tab>
```

#### But I’m using Classes
> Notice how we never told you to use ES6 classes? :)

https://twitter.com/soprano/status/610867662797807617

If you aren't happy using `createClass` for a handful of components in
your app for the sake of the `History` mixin, have a couple of options:

- Pass `this.props.history` from your route components down to the
  components that need it.

- Use context

```js
import PropTypes from 'react-router'
class MyComponent extends React.Component {
  doStuff () {
    this.context.history.pushState(null, '/some/path')
  }
}
MyComponent.contextTypes = { history: PropTypes.history }
```

- [Make your history a module](/docs/guides/advanced/NavigatingOutsideOfComponents.md)

- Create a higher order component, we might end up shipping with this
  and deprecating history, just haven't had the time to think it through
  all the way.

```js
function connectHistory (Component) {
  return React.createClass({
    mixins: [ History ],
    render () {
      return <Component {...this.props} history={this.history} />
    }
  })
}

// other file
import connectHistory from './connectHistory'

class MyComponent extends React.Component {
  doStuff () {
    this.props.history.pushState(null, '/some/where')
  }
}

export default connectHistory(MyComponent)
```



## RouteContext Mixin
The RouteContext mixin provides a convenient way for route components to set the route in context. This is needed for routes that render elements that want to use the [Lifecycle mixin](#lifecycle) to prevent transitions.

It simply adds `this.context.route` to your component.



## Utilities

## `useRoutes(createHistory)`
Returns a new createHistory function that may be used to create history objects that know about routing.

- isActive(pathname, query)
- registerRouteHook(route, (location) => {})
- unregisterRouteHook(route, (location) => {})
- match(location, (error, nextState, nextLocation) => {})
- listen((error, nextState) => {})



## `createRoutes(routes)`

Creates and returns an array of routes from the given object which may be a JSX route, a plain object route, or an array of either.

#### params
##### `routes`
One or many [`Routes`](#route) or [`PlainRoutes`](#plainRoute).


## PropTypes
Coming so soon!
