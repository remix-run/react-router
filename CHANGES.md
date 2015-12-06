## [HEAD]

### Changes to context exports and Mixins

Only an object named `router` is added to context. Accessing `context.history`, `context.location`, and `context.route` are all deprecated.

Additionally, since `context` is now documented, all mixins are deprecated.

#### Accessing location

Access `location` from `this.props.location` of your route component. If
you'd like to get it deeper in the tree, you can use whatever
conventions your app has for getting props from high down low. One
option is to put it context yourself:

```js
// v1.0.x
const RouteComponent = React.createClass({
  childContextTypes: {
    location: React.PropTypes.object
  },

  getChildContext() {
    return { location: this.props.location }
  }
})
```

Though you may want to hide that in a mixin or higher order component,
it's up to you.

#### Navigating

In all cases where you once had a `history` for navigation, you now have a `router` to navigate instead.

```js
// v1.0.0
history.pushState(state, path, query)
history.replaceState(state, path, query)

// v1.1.0
router.push(path)
router.push({ path, query, state }) // new "location descriptor"

router.replace(path)
router.replace({ path, query, state }) // new "location descriptor"
```

#### Navigating in route components

```js
// v1.0.0
class RouteComponent extends React.Component {
  someHandler() {
    this.props.history.pushState(...)
  }
}

// v1.1.0
class RouteComponent extends React.Component {
  someHandler() {
    this.props.router.push(...)
  }
}
```

#### Navigating inside deeply nested components

```js
// v1.0.0
const DeepComponent = React.createClass({
  mixins: [ History ],

  someHandler() {
    this.history.pushState(...)
  }
}

// v1.1.0
// You have a couple options:
// Use context directly (recommended)
const DeepComponent = React.createClass({
  contextTypes: {
    router: object.isRequired
  },

  someHandler() {
    this.context.router.push(...)
  }
}

// create your own mixin:
const RouterMixin = {
  contextTypes: {
    router: object.isRequired
  },
  componentWillMount() {
    this.router = this.context.router
  }
}

const DeepComponent = React.createClass({
  mixins: [ RouterMixin ],
  someHandler() {
    this.history.pushState(...)
  }
}

// use the singleton history you are using when the router was rendered,
import { browserHistory } from 'react-router'

const DeepComponent = React.createClass({
  someHandler() {
    browserHistory.push(...)
  }
}
```

#### Lifecycle Mixin with route components

```js
// v1.0.0
const RouteComponent = React.createClass({
  mixins: [ Lifecycle ],
  routerWillLeave() {
    // ...
  }
})

// v1.1.0
const RouteComponent = React.createClass({
  componentDidMount() {
    const { router, route } = this.props
    router.addRouteLeaveHook(route, this.routerWillLeave)
  }
})

// or make your own mixin, check it out in the next section
```

#### Lifecycle Mixin with deep, non-route components

```js
// v1.0.0
const DeepComponent = React.createClass({
  mixins: [ Lifecycle ],
  routerWillLeave() {
    // do stuff
  }
})

// v1.1.0
// you have a couple of options
// first you can put the route on context in the route component
const RouteComponent = React.createClass({
  childContextTypes: {
    route: object
  },

  getChildContext() {
    return { route: this.props.route }
  }
})

// and then access it on your deep component
const DeepComponent = React.createClass({
  contextTypes: {
    route: object.isRequired,
    router: objec.isRequired
  },

  componentDidMount() {
    const { router, route } = this.context
    router.addRouteLeaveHook(route, this.routerWillLeave)
  }
})

// or make your own mixin that will work for both route components and
// deep components alike (as long as your route component puts `route`
// on context
const Lifecycle = {
  contextTypes: {
    route: object.isRequired,
    router: objec.isRequired
  },

  componentDidMount() {
    const router = this.context.router
    const route = this.props.route || this.context.route
    router.addRouteLeaveHook(route, this.routerWillLeave)
  }
}
```

### Router render prop

Just a stub so we don't forget to talk about it.


## [v1.0.1]
> Dec 5, 2015

- Support IE8 ([#2540])
- Add ES2015 module build ([#2530])

[HEAD]: https://github.com/rackt/react-router/compare/latest...HEAD
[#2530]: https://github.com/rackt/react-router/pull/2530
[#2540]: https://github.com/rackt/react-router/pull/2540

## [v1.0.0]
> Nov 9, 2015

Thanks for your patience :) Big changes from v0.13.x to 1.0. While on
the surface a lot of this just looks like shuffling around API, the
entire codebase has been rewritten to handle some really great use
cases, like loading routes and components on demand, session-based route
matching, server rendering, integration with libs like redux and relay,
and lots more.

But for now, here's how to translate the old API to the new one.

### Importing

The new `Router` component is a property of the top-level module.

```js
// v0.13.x
var Router = require('react-router');
var Route = Router.Route;

// v1.0
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;

// or using ES Modules
import { Router, Route } from 'react-router';
```

### Rendering

```js
// v0.13.x
Router.run(routes, (Handler) => {
  render(<Handler/>, el);
})

// v1.0
render(<Router>{routes}</Router>, el)

// looks more like this:
render((
  <Router>
    <Route path="/" component={App}/>
  </Router>
), el);

// or if you'd rather
render(<Router routes={routes}/>, el)
```

### Locations

Locations are now called histories (that emit locations). You import
them from the [`history` package](https://github.com/rackt/history), not react router.

```js
// v0.13.x
Router.run(routes, Router.BrowserHistory, (Handler) => {
  render(<Handler/>, el);
})

// v1.0
import createBrowserHistory from 'history/lib/createBrowserHistory'
let history = createBrowserHistory()
render(<Router history={history}>{routes}</Router>, el)
```

If you do not specify a history type (as in the example above) then you will notice some unusual behaviour after updating to 1.0.0. With the default hash based routing a querystring entry not defined by yourself will start appearing in your URLs called `_k`. An example of how it looks is this: `?_k=umhx1s`

This is intended and part of [createHashHistory](https://github.com/rackt/react-router/blob/master/docs/guides/basics/Histories.md#createhashhistory) (which is the default history approach used if one is not specified). You can read more about the feature [here](https://github.com/rackt/react-router/blob/master/docs/guides/basics/Histories.md#what-is-that-_kckuvup-junk-in-the-url) and how to opt out [here](https://rackt.github.io/history/stable/HashHistoryCaveats.html).

### Route Config

You can still nest your routes as before, paths are inherited from
parents just like before but prop names have changed.

```js
// v0.13.x
<Route name="about" handler={About}/>

// v1.0
<Route path="about" component={About}/>
```

Named routes are gone (for now, [see discussion](https://github.com/rackt/react-router/issues/1840))

### NotFound route

Not found really confused people, mistaking not finding resources
from your API for not matching a route. We've removed it completely
since it's simple with a `*` path.

```js
// v0.13.x
<NotFoundRoute handler={NoMatch}/>

// v1.0
<Route path="*" component={NoMatch}/>
```

### Redirect route

```js
// v0.13.x
<Redirect from="some/where/:id" to="somewhere/else/:id" params={{id: 2}}/>

// v1.0
// Works the same as before, except no params, just put them in the path
<Redirect from="/some/where/:id" to="/somewhere/else/2"/>
```

### Links

#### path / params

```js
// v0.13.x
<Link to="user" params={{userId: user.id}}>Mateusz</Link>

// v1.0
// because named routes are gone, link to full paths, you no longer need
// to know the names of the parameters, and string templates are quite
// nice. Note that `query` has not changed.
<Link to={`/users/${user.id}`}>Mateusz</Link>
```

#### "active" class

In 0.13.x links added the "active" class by default which you could
override with `activeClassName`, or provide `activeStyle`s. It's usually
just a handful of navigation links that need this behavior.

Links no longer add the "active" class by default (its expensive and
usually not necessary), you opt-in by providing one; if no
`activeClassName` or `activeStyle`s are provided, the link will not
check if it's active.

```js
// v0.13.x
<Link to="about">About</Link>

// v1.0
<Link to="/about" activeClassName="active">About</Link>
```

#### Linking to Index routes

Because named routes are gone, a link to `/` with an index route at `/`
will always be active. So we've introduced `IndexLink` that is only
active when on exactly that path.

```js
// v0.13.x
// with this route config
<Route path="/" handler={App}>
  <DefaultRoute name="home" handler={Home}/>
  <Route name="about" handler={About}/>
</Route>

// will be active only when home is active, not when about is active
<Link to="home">Home</Link>

// v1.0
<Route path="/" component={App}>
  <IndexRoute component={Home}/>
  <Route path="about" component={About}/>
</Route>

// will be active only when home is active, not when about is active
<IndexLink to="/">Home</IndexLink>
```

This gives you more granular control of what causes a link to be active
or not when there is an index route involved.

#### onClick handler

For consistency with React v0.14, returning `false` from a `Link`'s `onClick`
handler no longer prevents the transition. To prevent the transition, call
`e.preventDefault()` instead.

### RouteHandler

`RouteHandler` is gone. `Router` now automatically populates
`this.props.children` of your components based on the active route.

```js
// v0.13.x
<RouteHandler/>
<RouteHandler someExtraProp={something}/>

// v1.0
{this.props.children}
{React.cloneElement(this.props.children, {someExtraProp: something})}
```

There's a small semantic change with this approach. React validates `propTypes`
on elements when those elements are created, rather than when they're about to
render. This means that any props with `isRequired` will fail validation when
those props are supplied via this approach. In these cases, you should not
specify `isRequired` for those props. For more details, see
[facebook/react#4494](https://github.com/facebook/react/issues/4494#issuecomment-125068868).

### Navigation Mixin

If you were using the `Navigation` mixin, use the `History` mixin instead.

```js
// v0.13.x
var Assignment = React.createClass({
  mixins: [ Navigation ],
  navigateAfterSomethingHappened () {
    this.transitionTo('/users', { userId: user.id }, query);
    // this.replaceWith('/users', { userId: user.id }, query);
  }
})

// v1.0
var Assignment = React.createClass({
  mixins: [ History ],
  navigateAfterSomethingHappened () {
    // the router is now built on rackt/history, and it is a first class
    // API in the router for navigating
    this.history.pushState(null, `/users/${user.id}`, query);
    // this.history.replaceState(null, `/users/${user.id}`, query);
  }
})
```

The following `Navigation` methods are now also found on the history
object, main difference again is there are no params or route names,
just pathnames.

| v0.13                                | v1.0                          |
|--------------------------------------|-------------------------------|
| `go(n)`                              | `go(n)`                       |
| `goBack()`                           | `goBack()`                    |
| `goForward()`                        | `goForward()`                 |
| `makeHref(routeName, params, query)` | `createHref(pathname, query)` |
| `makePath(routeName, params, query)` | `createPath(pathname, query)` |

### State mixin

```js
// v0.13.x
var Assignment = React.createClass({
  mixins: [ State ],
  foo () {
    this.getPath()
    this.getParams()
    // etc...
  }
})

// v1.0
// if you are a route component...
<Route component={Assignment} />

var Assignment = React.createClass({
  foo () {
    this.props.location // contains path information
    this.props.params // contains params
    this.props.history.isActive('/pathToAssignment')
  }
})

// if you're not a route component, you need to pass location down the
// tree or get the location from context. We will probably provide a
// higher order component that will do this for you but haven't yet.
// see further down for more information on what can be passed down
// via context
var Assignment = React.createClass({
  contextTypes: {
    location: React.PropTypes.object
  },
  foo () {
    this.context.location
  }
})
```

Here's a table of where you used to get stuff with the `State` mixin,
and where you get it now if you're a route component (`this.props`)


| v0.13 (this)      | v1.0 (this.props)                  |
|-------------------|------------------------------------|
| `getPath()`       | `location.pathname+location.search`|
| `getPathname()`   | `location.pathname`                |
| `getParams()`     | `params`                           |
| `getQuery()`      | `location.search`                  |
| `getQueryParams()`| `location.query`                   |
| `getRoutes()`     | `routes`                           |
| `isActive(to, params, query)` | `history.isActive(pathname, query, onlyActiveOnIndex)` |

Here is another table of properties you used to get via the `State` and
where you can get it now if you are **not** a route component
(`this.context`).

| v0.13 (this)      | v1.0 (this.context)                |
|-------------------|------------------------------------|
| `getPath()`       | `location.pathname+location.search`|
| `getPathname()`   | `location.pathname`                |
| `getQuery()`      | `location.query`                   |
| `isActive(to, params, query)` | `history.isActive(pathname, query, indexOnly)` |

Note not all `State` functionality can be accessed via context in v1.0.
For example, `params` is not available via context.

### Scrolling

We're developing scroll behaviors separately in the
[`scroll-behavior`](https://github.com/rackt/scroll-behavior)
library until we have a stable, robust implementation that we're happy with.
Currently, scroll behaviors are exposed there as history enhancers: 

```js
import createHistory from 'history/lib/createBrowserHistory'
import useScroll from 'scroll-behavior/lib/useStandardScroll'

const history = useScroll(createHistory)()
```

### `willTransitionTo` and `willTransitionFrom`

Routes now define this behavior:

```js
// v0.13.x
var Home = React.createClass({
  statics: {
    willTransitionTo (transition, params, query, callback) { }
    willTransitionFrom (component, transition, params, query, callback) { }
  }
})

// v1.0
<Route
  component={Home}
  onEnter={(location, replaceWith) => {}}
  onLeave={() => {}}
/>
```

To cancel a "transition from", please refer to the
[Confirming Navigation](docs/guides/advanced/ConfirmingNavigation.md) guide.

### We'll keep updating this

There's a lot of the old API we've missed, please give the [new
docs](/docs) a read and help us fill this guide in. Thanks!

[v1.0.0]: https://github.com/rackt/react-router/compare/v0.13.5...v1.0.0
