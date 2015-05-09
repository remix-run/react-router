React Router Guide
==================

Nesting UI is at the core of React Router. Think about any user
interface you're accustomed to, there is likely some shared UI as you
navigate around the application.

Let's imagine a little app with a dashboard, inbox, and calendar.

```
+---------------------------------------------------------+
| +---------+ +-------+ +--------+                        |
| |Dashboard| | Inbox | |Calendar|      Logged in as Jane |
| +---------+ +-------+ +--------+                        |
+---------------------------------------------------------+
|                                                         |
|                        Dashboard                        |
|                                                         |
|                                                         |
|   +---------------------+    +----------------------+   |
|   |                     |    |                      |   |
|   | +              +    |    +--------->            |   |
|   | |              |    |    |                      |   |
|   | |   +          |    |    +------------->        |   |
|   | |   |    +     |    |    |                      |   |
|   | |   |    |     |    |    |                      |   |
|   +-+---+----+-----+----+    +----------------------+   |
|                                                         |
+---------------------------------------------------------+
```

We have three main screens here with the top section of UI being
persistent.

Without React Router
--------------------

Without this router, you'd share that UI by repeating render code across
your views, probably with a `<Header/>` element:

```js
var Header = React.createClass({
  render: function () {
    return (
      <header>
        <ul>
          <li><a href="/">Dashboard</a></li>
          <li><a href="/inbox">Inbox</a></li>
          <li><a href="/calendar">Calendar</a></li>
        </ul>
        Logged in as Jane
      </header>
    );
  }
});

var DashboardRoute = React.createClass({
  render: function () {
    return (
      <div>
        <Header/>
        <Dashboard/>
      </div>
    );
  }
});

var InboxRoute = React.createClass({
  render: function () {
    return (
      <div>
        <Header/>
        <Inbox/>
      </div>
    );
  }
});

var CalendarRoute = React.createClass({
  render: function () {
    return (
      <div>
        <Header/>
        <Calendar/>
      </div>
    );
  }
});

// Not React Router API
otherRouter.route('/', function () {
  React.render(<DashboardRoute/>, document.body);
});

otherRouter.route('/inbox', function () {
  React.render(<InboxRoute/>, document.body);
});

otherRouter.route('/calendar', function () {
  React.render(<CalendarRoute/>, document.body);
});
```

The three main views' render methods are nearly identical. While one
level of shared UI like this is pretty easy to handle, getting deeper
and deeper adds more complexity.

Other approaches might introduce a lot of `if/else` or `switch/case`
into your app if you pass the route information down through the app
hierarchy via props.

```js
var App = React.createClass({
  render: function () {
    var page;
    switch (this.props.page) {
      case 'dashboard': page = <Dashboard/>; break;
      case 'inbox': page = <InboxRoute/>; break;
      default: page = <Index/>; break;
    }
    return (
      <div>{page}</div>
    );
  }
});
```

React Router embraces the common pattern of shared UI among user
interfaces by nesting the views for you, decreasing boilerplate.

With React Router
-----------------

Here's how it works:

1. You declare your view hierarchy with nested `<Route/>`s and provide
   them with a React element to handle the route when it's active.

2. React Router will match the deepest route against the URL, and then
   activate the entire tree of routes on that branch, nesting all the
   UI.

3. You simply use the `<RouteHandler/>` component and it will render the
   active child route.

```js
var Router = require('react-router'); // or var Router = ReactRouter; in browsers

var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;

var App = React.createClass({
  render: function () {
    return (
      <div>
        <header>
          <ul>
            <li><Link to="app">Dashboard</Link></li>
            <li><Link to="inbox">Inbox</Link></li>
            <li><Link to="calendar">Calendar</Link></li>
          </ul>
          Logged in as Jane
        </header>

        {/* this is the important part */}
        <RouteHandler/>
      </div>
    );
  }
});

var routes = (
  <Route name="app" path="/" handler={App}>
    <Route name="inbox" handler={Inbox}/>
    <Route name="calendar" handler={Calendar}/>
    <DefaultRoute handler={Dashboard}/>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.body);
});

```

When the user lands at `/inbox`, the route named `inbox` gets matched so
its parent route, `app`, is also matched. The `run` callback receives
`Handler`, that has all of this match information wrapped up in it.

Rendering `Handler` is really just rendering `App` since it's the highest
matched route handler. Since `inbox` is the active child route,
rendering `<RouteHandler/>` in `App` renders the `Inbox` element.
`<RouteHandler/>` is nearly identical to `{{outlet}}` from Ember or
`<div ng-view/>` from Angular.

When the user navigates to `/calendar`, the same thing happens except
now `Calendar` is the `<RouteHandler/>` in `App`'s render method.

Finally, when the user navigates to the path `/`, `App` is active, and
notices that it has a `DefaultRoute`, so `Dashboard` becomes the new
`<RouteHandler/>`. If a `DefaultRoute` is defined, it will be active
when the parent's route is matched exactly.

Note that we don't need the `<Header/>` element since we don't have to
repeat it anymore. React Router shares that UI for us from one place.

More Nesting
------------

Nesting arbitarily deep UI is not a problem. Consider the `Inbox`
screen: it has a master list of messages on the left, a detail view of
the message on the right, and a toolbar over the top. The toolbar and
list are persistent, meanwhile the message view changes as the user
navigates through the messages.

```
+---------------------------------------------------------------------+
| +---------+ +-------+ +--------+                                    |
| |Dashboard| | Inbox | |Calendar|                  Logged in as Jane |
| +---------+ +-------+ +--------+                                    |
+---------------------------------------------------------------------+
| +---------+ +-------+                              +--------------+ |
| | Compose | | Reply |                              |Inbox Settings| |
| +---------+ +-------+                              +--------------+ |
+-------------------+-------------------------------------------------+
| David Brown       |                                                 |
| Hey, we need to...|                                                 |
|                   |                                                 |
|           12:30pm |                                                 |
+-------------------+                32 Unread Messages               |
| Mary Sweeney      |                                                 |
| I followed up w...|               456 Total Messages                |
|                   |                                                 |
|           12:10pm |                 3 Draft Messages                |
+-------------------+                                                 |
| DeMarcus Jones    |                                                 |
| check this out ...|                                                 |
|                   |                                                 |
|           11:25am |                                                 |
+-------------------+-------------------------------------------------+
```

Let's see how React Router handles this:

```js
var Inbox = React.createClass({
  render: function () {
    return (
      <div>
        <Toolbar/>
        <Messages/>
        <RouteHandler/>
      </div>
    );
  }
});

var routes = (
  <Route handler={App}>

    <Route name="inbox" handler={Inbox}>
      <Route name="message" path=":messageId" handler={Message}/>
      <DefaultRoute handler={InboxStats}/>
    </Route>

    <Route name="calendar" handler={Calendar}/>
    <DefaultRoute handler={Dashboard}/>

  </Route>
);
```

- Inbox now has a `<RouteHandler/>` in its render method,
  exactly like its parent.
- We added child routes to `inbox`; the messages or stats page can now
  render into it.

Nesting a new level of UI does not increase the complexity of your code.
You simply nest some routes and render them with `<RouteHandler/>`.

Dynamic Segments
----------------

When we added the `message` route, we introduced a "dynamic segment" to
the URL. These segments get parsed from the url and are available in
the `run` callback, or from `this.context.router` in a route handler.
Let's see how we can access the params.

Remember our message route looks like this:

```xml
<Route name="message" path=":messageId" handler={Message}/>
```

Lets look at accessing the `messageId` in `Message`.

```js
var Message = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  render: function () {
    return (
      <div>{this.context.router.getCurrentParams().messageId}</div>
    );
  }
});
```

Assuming the user navigates to `/inbox/123`, `this.context.router.getCurrentParams().messageId` is
going to be `'123'`.

Alternatively, you can pass the param data down through the view
hierarchy from the `run` callback and access the params with
`this.props.params`.

```js
Router.run(routes, function (Handler, state) {
  var params = state.params;
  React.render(<Handler params={params}/>, document.body);
});

// and then pass the params down to every use of `<RouteHandler/>`
<RouteHandler {...this.props}/>

// Inbox ends up looking like this
var Inbox = React.createClass({
  render: function () {
    return (
      <div>
        <Toolbar/>
        <Messages/>
        <RouteHandler {...this.props}/>
      </div>
    );
  }
});

// and Message changes to:
var Message = React.createClass({
  render: function () {
    return (
      <div>{this.props.params.messageId}</div>
    );
  }
});
```

Important Note About Dynamic Segments
-------------------------------------

If you have dynamic segments in your URL, a transition from `/users/123`
to `/users/456` does not call `getInitialState`, `componentWillMount`, `componentWillUnmount` or `componentDidMount`. If you are using those lifecycle hooks to fetch
data and set state, you will also need to implement
`componentWillReceiveProps` on your handler and its stateful children, just like any other
component whose props are changing. This way you can leverage the
performance of the React DOM diff algorithm. Look at the `Contact`
handler [in the `master-detail` example](https://github.com/rackt/react-router/blob/master/examples/master-detail/app.js).

If you would rather force route handlers to re-mount when transitioning between dynamic segments, you can assign a unique key to your route handler component to bypass this optimization:

```js
var App = React.createClass({
   contextTypes: {
    router: React.PropTypes.func
  },

  getHandlerKey: function () {
    var childDepth = 1; // assuming App is top-level route
    var { router } = this.context;
    var key = router.getRoutes()[childDepth].name;
    var id = router.getParams().id;
    if (id) { key += id; }
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

Scrolling
---------

By default, the router will manage the scroll position between route
transitions. When a user clicks "back" or "forward", it will restore
their scroll position. If they visit a new route, it will automatically
scroll the window to the top. You can configure this option with
[Router.create][create].

Bells and Whistles
------------------

### `<Link/>`

The `<Link/>` element allows you to conveniently navigate users around
the application with accessible anchor tags that don't break normal link
functionality like control/command clicking to open in a new tab. Also,
when the route a link references is active, you get the `active` css
class to easily style your UI.

### `<NotFoundRoute/>`

At any level of your UI nesting, you can render a handler if the url
beyond what was matched isn't recognized.

```xml
<Route path="/" handler={App}>
  <Route name="inbox" path="/inbox" handler={Inbox}>
    <!--
      will render inside the `Inbox` UI for any paths not recognized
      after the parent route's path `/inbox/*`
    -->
    <NotFoundRoute handler={InboxNotFound}/>
    <Route name="message" path="/inbox/:messageId" handler={Message}/>
    <DefaultRoute handler={InboxStats}/>
  </Route>
  <Route name="calendar" path="/calendar" handler={Calendar}/>
  <DefaultRoute handler={Dashboard}/>
</Route>
<!-- will catch any route that isn't recognized at all -->
<NotFoundRoute handler={NotFound}/>
```

### `<Redirect/>`

URLs in an app change, so we made it easy to not break the old ones.

```xml
<Route name="message" path="/inbox/:messageId" handler={Message} />
<Redirect from="/messages/:messageId" to="message" />
```

Path Matching
-------------

There's a lot more to be said about path matching, check out the [Path
Matching Guide](path-matching.md).

API Documentation
-----------------

That's the gist of what this router is all about, but there's a lot more
it has to offer. Check out the [API Docs](http://rackt.github.io/react-router/) to learn about
redirecting transitions, query parameters and more.

CommonJS Guide
--------------

In order for the above examples to work in a CommonJS environment you'll need to `require` the following:

```
var Router = require('react-router');
var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;
```
