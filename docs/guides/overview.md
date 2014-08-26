React Router Guide
==================

Nesting UI is at the core of React Router. Think about any user
interface you're accustomed to, there is likely some shared UI as you
navigate around the application.

Let's imagine a little app with a dashboard, inbox, and calendar.

```
+---------------------------------------------------------+
| +---------+ +-------+ +--------+                        |
| |Dashboard| | Inbox | |Calendar|      Logged in as Joe  |
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
your views, probably with a `<Header/>` component:

```js
var Header = React.createClass({
  render: function() {
    return (
      <header>
        <ul>
          <li><a href="/">Dashboard</a></li>
          <li><a href="/inbox">Inbox</a></li>
          <li><a href="/calendar">Calendar</a></li>
        </ul>
        Logged in as Joe
      </header>
    );
  }
});

var DashboardRoute = React.createClass({
  render: function() {
    return (
      <div>
        <Header/>
        <Dashboard/>
      </div>
    );
  }
});

var InboxRoute = React.createClass({
  render: function() {
    return (
      <div>
        <Header/>
        <Inbox/>
      </div>
    );
  }
});

var CalendarRoute = React.createClass({
  render: function() {
    return (
      <div>
        <Header/>
        <Calendar/>
      </div>
    );
  }
});

// Not React Router API
otherRouter.route('/', function() {
  React.renderComponent(<DashboardRoute/>, document.body);
});

otherRouter.route('/inbox', function() {
  React.renderComponent(<InboxRoute/>, document.body);
});

otherRouter.route('/calendar', function() {
  React.renderComponent(<CalendarRoute/>, document.body);
});

```

The three main view's render methods are nearly identical. While one
level of shared UI like this is pretty easy to handle, getting deeper
and deeper adds more complexity, along with lots of `switch` branching,
etc.

React Router embraces this common pattern among user interfaces by
nesting the views for you. 

With React Router
-----------------

Here's how it works:

1. You declare your view hierarchy with nested `<Route/>`s and provide
   them with a React component to handle the route when its active.

2. React Router will match the deepest route against the URL, and then
   activate the entire tree of routes on that branch, nesting all the
   UI.

3. You access the active route handler in the props of the parent route.

```js
var App = React.createClass({
  render: function() {
    return (
      <div>
        <header>
          <ul>
            <li><Link to="app">Dashboard</Link></li>
            <li><Link to="inbox">Inbox</Link></li>
            <li><Link to="calendar">Calendar</Link></li>
          </ul>
          Logged in as Joe
        </header>

        {/* this is the important part */}
        <this.props.activeRouteHandler/>
      </div>
    );
  }
});

var routes = (
  <Routes location="history">
    <Route name="app" path="/" handler={App}>
      <Route name="inbox" path="/inbox" handler={Inbox}/>
      <Route name="calendar" path="/calendar" handler={Calendar}/>
      <DefaultRoute handler={Dashboard}/>
    </Route>
  </Routes>
);

React.renderComponent(routes, document.body);
```

When the user lands at `/inbox`, the route named `inbox` gets matched so
its parent route will render the `App` component, and since `inbox` is
active, you get `Inbox` as `this.props.activeRouteHandler`. This is
nearly identical to `{{outlet}}` from Ember or `<div ng-view/>` from
angular.

When the user navigates to `/calendar`, the same thing happens except
now `Calendar` is the `activeRouteHandler` in `App`'s render method.

Finally, when the user navigates to the path `/`, `App` is active, and
notices that it has a `DefaultRoute`, so it receives `Dashboard` as the
`activeRouteHandler`. If a `DefaultRoute` is defined, it will be active
when the parent's route is matched exactly.

Note that we don't need the `<Header/>` component since we don't have to
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
| |Dashboard| | Inbox | |Calendar|                   Logged in as Joe |
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
  render: function() {
    return (
      <div>
        <Toolbar/>
        <Messages/>
        <this.props.activeRouteHandler/>
      </div>
    );
  }
});

var routes = (
  <Routes location="history">
    <Route path="/" handler={App}>

      <Route name="inbox" path="/inbox" handler={Inbox}>
        <Route name="message" path="/inbox/:messageId" handler={Message}/>
        <DefaultRoute handler={InboxStats}/>
      </Route>

      <Route name="calendar" path="/calendar" handler={Calendar}/>
      <DefaultRoute handler={Dashboard}/>

    </Route>
  </Routes>
);
```

- Inbox now has `this.props.activeRouteHandler` in its render method,
  exactly like its parent.
- We added a child routes to `inbox`; messages or the stats page can now
  render into it.

Nesting a new level of UI does not increase the complexity of your code.
You simply nest some routes and render them with `activeRouteHandler`.

**Note**: the paths are not inherited from parent to child. This gives
you the flexibility to have any url you need. Were the paths to be
inherited, you'd be forced to couple your urls to your route hierarchy.
For example, we may want `/inbox` and `/messages/123` instead of `/inbox`
and `/inbox/123`. We can just change the path on the `message` route and
still get view nesting even though the urls are not nested.

Dynamic Segments
----------------

When we added the `message` route, we introduced a "dynamic segment" to
the URL. These segements get parsed from the url and passed into your
route handler on `this.props.params`.

Remember our message route looks like this:

```xml
<Route name="message" path="/inbox/:messageId" handler={Message}/>
```

Lets look at accessing the `messageId` in `Message`.

```js
var Message = React.createClass({
  render: function() {
    return (
      <div>{this.props.params.messageId}</div>
    );
  }
});
```

Assuming the user navigates to `/inbox/123`, `this.props.messageId` is
going to be `'123'`. Check out the [AsyncState][AsyncState] mixin to see
how you can turn this parameter into state on your component. Or for a
more basic approach, make an ajax call in `componentDidMount` with the
value.

Important Note About Dynamic Segments
-------------------------------------

If you have dynamic segments in your URL, a transition from `/users/123`
to `/users/456` does not call `getInitialState`, `componentWillMount` or
`componentWillUnmount`. If you are using those lifecycle hooks to fetch
data and set state, you will also need to implement
`componentWillReceiveProps` on your handler, just like any other
component whose props are changing. This way you can leverage the
performance of the React DOM diff algorithm. Look at the `Contact`
handler in the `master-detail` example.

If you'd rather be lazy, you can use the `addHandlerKey` option and set
it to `true` on your route to opt-out of the performance. See also
[Route][Route].

Links
-----

The `<Link/>` component allows you to conveniently navigate users around
the application with accessible anchor tags that don't break normal link
functionality like control/command clicking to open in a new tab. Also,
when the route a link references is active, you get the `active` css
class to easily style your UI.

API Documentation
-----------------

That's the gist of what this router is all about, but there's a lot more
it has to offer. Check out the [API Docs][API] to learn about
redirecting transitions, query parameters and more.

  [AsyncState]:../api/mixins/AsyncState.md
  [Route]:../api/components/Route.md
  [API]:../api/

