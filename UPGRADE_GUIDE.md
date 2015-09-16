Upgrade Guide
=============

To see discussion around these API changes, please refer to the
[changelog](/CHANGELOG.md) and visit the commits and issues they
reference.

0.13.3 -> 1.0.0
---------------

Thanks for your patience :) Big changes. While on the surface a lot of
this just looks like shuffling around API, the entire codebase has been
rewritten to handle some really great use cases, like loading routes and
components on demand, session-based route matching, server rendering,
integration with libs like redux and relay, and lots more.

But for now, here's how to translate the old API to the new one.

### Rendering

```js
// v0.13.x
Router.run(routes, (Handler) => {
  React.render(<Handler/>, el);
})

// v1.0
React.render(<Router>{routes}</Router>, el)

// looks more like this:
React.render((
  <Router>
    <Route path="/" component={App}/>
  </Router>
), el);

// or if you'd rather
React.render(<Router routes={routes}/>, el)
```

### Locations

Locations are now called histories (that emit locations). You import
them from the `history` package, not react router.

```js
// v0.13.x
Router.run(routes, Router.BrowserHistory, (Handler) => {
  React.render(<Handler/>, el);
})

// v1.0
import createBrowserHistory from 'history/lib/createBrowserHistory'
let history = createBrowserHistory()
React.render(<Router history={history}>{routes}</Router>, el)
```

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
since its simple with a `*` path.

```js
// v0.13.x
<NotFoundRoute handler={NoMatch}/>

// v1.0
<Route path="*" component={NoMatch}/>
```

### Redirect route

- no more params
- must have absolute "from" (for now)

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
override with `activeClassName`, or provide `activeStyles`. Most links
don't need this and the check is (currently) expensive.

Links no longer add the "active" class by default, you opt-in by
providing one; if no `activeClassName` or `activeStyles` are provided,
the link will not check if it's active.

```js
// v0.13.x
<Link to="about">About</Link>

// v1.0
<Link to="/about" activeClassName="active">About</Link>
```

#### Linking to Default/Index routes

Because named routes are gone, a link to `/` with an index route at `/`
will always be active. So we've introduced `IndexLink` that is only
active when the index route is active.

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

### RouteHandler

`RouteHandler` is gone. `Router` now automatically populates
`this.props.children` of your components based on the active route.

```js
// v0.13.x
<RouteHandler/>
<RouteHandler someExtraProp={something}/>

// v1.0
{this.props.children}
{React.cloneElement(this.props.children, {someExtraProp: something })}
```

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
    this.props.history.isActive
  }
})

// if you're not a route component, you need to pass location down the
// tree or get the location from context. We will probably provide a
// higher order component that will do this for you but haven't yet.
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


| v0.13 (this)    | v1.0 (this.props)                  |
|-----------------|------------------------------------|
| `getPath()`     | `location.pathname+location.query` |
| `getPathname()` | `location.pathname`                |
| `getParams()`   | `params`                           |
| `getQuery()`    | `location.query`                            |
| `getRoutes()`   | `routes`                           |
| `isActive(to, params, query)` | `history.isActive(pathname, query, onlyActiveOnIndex)` |

### Scrolling

In 0.13.x we had a couple of implementations to restore scroll position,
we've realized that we can build a better implementation on top of the
router and will be doing that very soon, before the 1.0 final release,
but it doesn't need to be baked into routing like it was before.

### `willTransitionTo` and `willTransitionFrom`

Routes now define this behavior:

```js
// v0.13.x
var Home = React.createClass({
  statics: {
    willTransitionTo (transition, params, query, callback) {
    }
    willTransitionFrom (component, transition, params, query, callback) {
    }
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
[Confirming Navigation](docs/advanced/ConfirmingNavigation.md) guide.

### We'll keep updating this

There's a lot of the old API we've missed, please give the [new
docs](/docs) a read and help us fill this guide in. Thanks!


0.13.2 -> 0.13.3
----------------

Like many others in the community, we misunderstood the "mixins are
going away" sentiment. Mixins, along with `React.createClass` are not
going away any time soon, and definitely not until ES6 classes have
better answers to replace what mixins do (like decorators).

So, don't access context, use the mixins, sorry for the churn, we know
it can be frustrating.

Upgrade path from `0.13.2` to `0.13.3` is to put your code back to how
it was in `0.12.x`. The context stuff will still work, so you can do it
incrementally.

0.12.x -> 0.13.2 (PLEASE SKIP THIS)
-----------------------------------

**SKIP THIS UPGRADE AND GO STRAIGHT TO 0.13.3**

`0.13.3` has the same API as `0.12.x`, so please upgrade to `0.13.3` and
skip the `0.13.0-0.13.2` stuff and leave your code alone :)

React introduced the ability to use ES6 classes for component
definitions, which has the side-effect of mixins not being "the thing"
anymore. Our mixins like `State` and `Navigation` just proxied calls to
some methods on an undocumented feature of React called `context`, that
in turn called methods on the router instance under the hood.

Without mixins we needed a way for you to get access to these methods.
We decided the simplest solution was to stop hiding the router instance
and just put the whole thing on context.

You can think about context as values that are floating around a render
tree that parent components (`Handler` in the `Router.run` callback) can
explicitly define and descendent components can explicitly ask for. The
stuff on context doesn't show up in a component unless you ask for it.

**Note:** You can still use our mixins, you'll just get a deprecation warning.

```js
// 0.12.x
var Foo = React.createClass({
  mixins: [ Router.State ],
  render: function () {
    var id = this.getParams().id;
    var searchTerm = this.getQuery().searchTerm;
    // etc. ...
  }
});

// 0.13.x w/o ES6 fanciness
var Foo = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  render: function () {
    var router = this.context.router;
    var id = router.getCurrentParams().id;
    var searchTerm = router.getCurrentQuery().searchTerm;
    // etc.
  }
});

// 0.13.x w/ ES6 fanciness
class Foo extends React.Component {
  render () {
    var { router } = this.context;
    var id = router.getCurrentParams().id;
    var searchTerm = router.getCurrentQuery().searchTerm;
    // etc.
  }
}

Foo.contextTypes = {
  router: React.PropTypes.func
};
```

Most of the time we prefer to just pass the state down the props tree
and not mess with context:

```js
Router.run(routes, (Handler, state) => {
  React.render(<Handler {...state}/>, document.body);
});

// and then when rendering route handlers, keep passing it down
<RouteHandler {...this.props}/>

// and then in your methods you have what you need on props
var id = this.props.params.id;
var searchTerm = this.props.query.searchTerm;
```

0.11.x -> 0.12.0
----------------

`transition.wait` was removed, you now use a callback instead:

```js
// 0.11.x
var SomeHandler = React.createClass({
  statics: {
    willTransitionTo (transition) {
      transition.wait(somePromise());
    }
  }
});

// 0.12.0
var SomeHandler = React.createClass({
  statics: {
    willTransitionTo (transition, params, query, callback) {
      somePromise().then(callback);
    }
  }
});
```

0.10.x -> 0.11.x
----------------

The router changed **a lot** in this release. While you won't have to
change too much of your app, you will have to change it in a lot of
places. The fundamental change is that you, rather than the router, get
to have control of your view instances.

If you find anything is missing from this list, please open an issue and
we will get it added here ASAP.

### React 0.12

You must upgrade to `0.12.x` before you can use version `0.11.x` of the
router.

### `<Routes/>` and starting the router

`<Routes/>` is gone, there is a new API that gives you complete control
of your views.

```js
// 0.10.x
var routes = (
  <Routes location="history">
    <Route handler={App}>
      <Route name="dashboard" handler={Dashboard}/>
    </Route>
  </Routes>
);

React.render(routes, el);

// 0.11.x
var routes = (
  <Route handler={App}>
    <Route name="dashboard" handler={Dashboard}/>
  </Route>
);

Router.run(routes, Router.HistoryLocation, function (Handler) {
  React.render(<Handler/>, el);
});

// or default to hash location
Router.run(routes, function (Handler) {
  React.render(<Handler/>, el);
});
```

### `this.props.activeRouteHandler()` -> `<RouteHandler/>`

```js
// 0.10.x
var Something = React.createClass({
  render: function () {
    return (
      <div>
        <this.props.activeRouteHandler />
      </div>
    );
  }
});

// 0.11.x
var RouteHandler = Router.RouteHandler;

var Something = React.createClass({
  render: function () {
    return (
      <div>
        <RouteHandler />
      </div>
    );
  }
});
```

### `this.props.params` and `this.props.query`

They are no longer available on props, use the `State` mixin.

```js
// 0.10.x
var Something = React.createClass({
  render: function () {
    var name = this.props.params.name;
    var something = this.props.query.something;
    // ...
  }
});

// 0.11.x

// pass it down the view hierarchy to get the same lifecycle hooks to
// trigger as before
Router.run(routes, function (Handler, state) {
  React.render(<Handler params={state.params} query={state.query} />, el);
  // make sure to `<RouteHandler {...this.props}/>` to continue
  // passing it down the hierarchy
});

// or use the `State` mixin
var Something = React.createClass({
  mixins: [ Router.State ],
  render: function () {
    var name = this.getParams().name;
    var something = this.getQuery().something;
    // ...
  }
});

// Also, if you're using a flux-style app, you can trigger a "transition"
// action in the `run` callback with the params/query in the payload, then
// subscribe in your handlers to the store that grabs the data.
```

### `ActiveState` -> `State`, and methods too

This mixin's name has changed, and all of its methods that had the word
`active` in it, too. For example, `getActiveParams()` becomes `getParams()`.

```js
// v0.10.x
var Something = React.createClass({
  mixins: [ Router.ActiveState ],
  render: function () {
    var name = this.getActiveParams().name;
    // ...
  }
});

// v0.11.x
var Something = React.createClass({
  mixins: [ Router.State ]
  render: function () {
    var name = this.getParams().name;
    // ...
  }
});
```

### `CurrentPath` -> `State`

You can find `this.getPath()` on the `Router.State` mixin.

```js
// v0.10.x
var Something = React.createClass({
  mixins: [ Router.CurrentPath ],
  render: function () {
    var path = this.getCurrentPath();
    // ...
  }
});

// v0.11.x
var Something = React.createClass({
  mixins: [ Router.State ],
  render: function () {
    var path = this.getPath();
    // ...
  }
});
```

### Route `addHandlerKey` prop

This option has been removed, you will need to add handler keys
yourself:

```js
// 0.10.x
<Route handler={App}>
  <Route addHandlerKey={true}/>
</Route>

// 0.11.x
var App = React.createClass({
  mixins: [ Router.State ],

  getHandlerKey: function () {
    // this will all depend on your needs, but here's a typical
    // scenario that's pretty much what the old prop did
    var childDepth = 1; // have to know your depth
    var childName = this.getRoutes()[childDepth].name;
    var id = this.getParams().id;
    var key = childName+id;
    return key;
  },

  render: function () {
    return (
      <div>
        <RouteHandler key={this.getHandlerKey()} />
      </div>
    );
  }
});
```

### `<Routes onError={fn}/>`

`<Routes/>` is gone, instead create a router with your error handler as
an option:

```js
// 0.10.x
<Routes onError={fn}>
  // ...
</Routes>

// 0.11.x
var router = Router.create({
  onError: fn,
  // ...
});
router.run(callback);
```

### `Router.renderRoutesTo*`

These methods have been removed because you, not the router, are in
control of rendering.

```js
// v0.10.x
Router.renderRoutesToString(routes, path, function (html) {
 // do something with `html`
});

// v0.11.x
Router.run(routes, path, function (Handler) {
  var html = React.renderToString(<Handler/>);
});
```

### Route Props Passed to Handlers

In `0.10.x` you could add props to your route that would make their way
down to your handlers. While convenient, conflating routes with their
handlers was confusing to a lot of folks.

To get the same effect, you can either create your handlers with a
function and close over the information you need, or simply define those
properties on your handlers.

```js
// 0.10.x
<Route name="users" foo="bar" handler={Something}/>

var Something = React.createClass({
  render () {
    return <div>{this.props.name} {this.props.foo}</div>
  }
});

// 0.11.x

// close over technique
<Route name="users" handler={makeSomething("users", "bar")}/>

function makeSomething(name, foo) {
  return React.createClass({
    render () {
      return <div>{name} {foo}</div>
    }
  });
}

// handler definition technique
<Route name="users" handler={Something}/>

var Something = React.createClass({
  foo: "bar",
  name: "users",
  render () {
    return <div>{this.name} {this.foo}</div>
  }
});
```

0.9.x -> 0.10.x
---------------

Nothing changed, this was simply React `0.12.0` compatibility. Note,
your code needs to use the React `0.11.x` API for things to work, there
will be lots of warnings in the console.

0.7.x -> 0.9.x
--------------

### `ActiveState` mixin `isActive`

`isActive` is now an instance method.

```js
// 0.7.x
var SomethingActive = React.createClass({
  mixins: [ActiveState],

  render: function () {
    var isActive = SomethingActive.isActive(...);
  }
});

// 0.9.x
var SomethingActive = React.createClass({
  mixins: [ActiveState],

  render: function () {
    var isActive = this.isActive(...);
  }
});
```

### `<Routes onActiveStateChange/>` -> `<Routes onChange />`

```js
// 0.7.x
<Routes onActiveStateChange={fn} />

function fn(nextState) {}

// 0.9.x
<Routes onChange={fn} />

function fn() {
  // no arguments
  // `this` is the routes instance
  // here are some useful methods to get at the data you probably need
  this.getCurrentPath();
  this.getActiveRoutes();
  this.getActiveParams();
  this.getActiveQuery();
}
```

### `.` in params support

`.` used to be a delimiter like `/`, but now it's a valid character in
your params.

### `transition.retry()`

`transition.retry()` used to use `transitionTo`, creating a new history
entry, it now uses `replaceWith`.

```js
// 0.7.x
React.createClass({
  login: function () {
    // ...
    transition.retry();
  }
});

// 0.9.x
React.createClass({
  mixins: [Navigation],
  login: function () {
    // ...
    this.transitionTo(transition.path);
  }
});
```

### Returning promises from transition hooks

Transition hooks are now sync, unless you opt-in to async with
`transition.wait(promise)`.

```js
// 0.7.x
React.createClass({
  statics: {
    willTransitionTo: function (transition) {
      return somePromise();
    }
  }
});

// 0.9.x
React.createClass({
  statics: {
    willTransitionTo: function (transition) {
      transition.wait(somePromise());
    }
  }
});
```

### `preserveScrollPosition` -> `scrollBehavior`

`preserveScrollPosition` was totally broken and should have been named
`perverseScrollPosition`.


There are now three scroll behaviors you can use:

- `'browser'`
- `'scrollToTop'`
- `'none'`

`browser` is the default, and imitates what browsers do in a typical
page reload scenario (preserves scroll positions when using the back
button, scrolls up when you come to a new page, etc.) Also, you can no
longer specify scroll behavior per `<Route/>` anymore, only `<Routes/>`

```
<Routes scrollBehavior="scrollToTop"/>
```

### RouteStore

This was not a public module, but we know some people were using it.
It's gone now. We have made getting at the current routes incredibly
convenient now with additions to the `ActiveState` mixin.

### `Router.transitionTo, replaceWith, goBack`

These methods have been moved to mixins.

```js
var Router = require('react-router');

// 0.7.x
React.createClass({
  whenever: function () {
    Router.transitionTo('something');
    Router.replaceWith('something');
    Router.goBack();
  }
});

// 0.9.x
var Navigation = Router.Navigation;

React.createClass({
  mixins: [Navigation],
  whenever: function () {
    this.transitionTo('something');
    this.replaceWith('something');
    this.goBack();
  }
});
```

### `<Routes onTransitionError onAbortedTransition/>`

These were removed, there is no upgrade path in `0.9.0` but we will have
something soon. These weren't intended to be used.

### `ActiveState` lifecycle method `updateActiveState` removed

We didn't actually need this. Just use `this.isActive(to, params,
query)`.

### `AsyncState` mixin removed

There is no upgrade path. Just use `comoponentDidMount` to request
state. This was some groundwork for server-side rendering but we are
going a different direction now (using props passed in to route
handlers) so we've removed it.

0.7.x -> 0.8.x
--------------

Please don't upgrade to `0.8.0`, just skip to `0.9.x`.

`0.8.0` had some transient mixins we didn't intend to document, but had
some miscommunication :(. If you were one of three people who used some
of these mixins and need help upgrading from `0.8.0 -> 0.9.x` find us on
freenode in `#rackt` or open a ticket. Thanks!

0.6.x -> 0.7.x
--------------

The package root modules were removed. Please import modules from the
`Router` default export.

```js
// 0.6.x
var Link = require('react-router/Link');

// 0.7.x
var Router = require('react-router');
var Link = Router.Link;
```

0.5.x -> 0.6.x
--------------

### Path Matching

Paths that start with `/` are absolute and work exactly as they used to.
Paths that don't start with `/` are now relative, meaning they extend
their parent route.

Simply add `/` in front of all your paths to keep things working.

```xml
<!-- 0.5.x -->
<Route path="/foo">
  <Route path="bar"/>
</Route>

<!-- 0.6.x -->
<Route path="/foo">
  <Route path="/bar"/>
</Route>
```

Though you may want to embrace this new feature:

```xml
<!-- 0.5.x -->
<Route path="/course/:courseId">
  <Route path="/course/:courseId/assignments"/>
  <Route path="/course/:courseId/announcements"/>
</Route>

<!-- 0.6.x -->
<Route path="/course/:courseId">
  <Route path="assignments"/>
  <Route path="announcements"/>
</Route>
```

Also `.` is no longer matched in dynamic segments.

```xml
<!-- 0.5.x -->
<Route path="/file/:filename" />

<!-- 0.6.x -->
<Route path="/file/:filename.?:ext?" />

<!--
  or for a looser match to allow for multiple `.` note that the data
  will be available on `this.props.params.splat` instead of
  `this.props.params.filename`
-->
<Route path="/file/*" />
```

### Link params

Links should now pass their params in the `params` property, though the
old behavior will still work, you should update your code soon because
it will be removed by `v1.0`

```js
// 0.5.x
<Link to="user" userId="123"/>

// 0.6.x
<Link to="user" params={{userId: "123"}}/>
```

### Dynamic Segments, keys, and lifecycle methods

If you have dynamic segments and are depending on `getInitialState`,
`componentWillMount`, or `componentDidMount` to fire between transitions
to the same route--like `users/123` and `users/456`--then you have two
options:

- add `addHandlerKey={true}` to your route and keep the previous
  behavior (but lose out on performance), or
- implement `componentWillReceiveProps`.

```js
// 0.5.x
<Route handler={User} path="/user/:userId"/>

// 0.6.x
<Route handler={User} path="/user/:userId" addHandlerKey={true} />

// 0.5.x
var User = React.createClass({
  getInitialState: function () {
    return {
      user: getUser(this.props.params.userId);
    }
  }
});

// 0.6.x
var User = React.createClass({
  getInitialState: function () {
    return this.getState();
  },

  componentWillReceiveProps: function (newProps) {
    this.setState(this.getState(newProps));
  },

  getState: function (props) {
    props = props || this.props;
    return {
      user: getUser(props.params.userId)
    };
  }
});
```

0.4.x -> 0.5.x
--------------

We brought back `<Routes/>`.

```js
// 0.4.x
var routes = (
  <Route handler={App} location="history">
    <Route name="about" handler="about"/>
  </Route>
);

// 0.5.x
var routes = (
  <Routes location="history">
    <Route handler={App}>
      <Route name="about" handler="about"/>
    </Route>
  </Routes>
);
```

0.3.x -> 0.4.x
--------------

NPM users should point their apps to `react-router` instead of
`react-nested-router`. Make sure to `npm prune`!

0.2.x -> 0.3.x
--------------

- React `0.11.x` is now required.
- `this.props.activeRoute` became `this.props.activeRouteHandler()`

```js
// 0.2.x

var App = React.createClass({
  render: function () {
    return (
      <div>
        {this.props.activeRoute}
      </div>
    );
  }
});

// 0.3.x
var App = React.createClass({
  render: function () {
    // now you can send extra props to the active route handler
    // and use the new jsx syntax
    // <this.props.activeRouteHandler extraProp={something}/>
    return (
      <div>
        {this.props.activeRouteHandler()}
      </div>
    );
  }
});
```

0.1.x -> 0.2.x
--------------

The `Router` function was removed.

```js
// 0.1.x
var router = Router(routes);
router.renderComponent(element);

// 0.2.x
React.renderComponent(routes, element);
```

