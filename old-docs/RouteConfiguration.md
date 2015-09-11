# Route Configuration

A [route configuration](Glossary.md#routeconfig) is basically a set of instructions that tell a router how to try to [match the URL](RouteMatching.md) and what code to run when it does. To illustrate some of the features available in your route config, let's expand on the simple app from [the introduction](Introduction.md).

```js
import React from 'react';
import { Router, Route } from 'react-router';

var App = React.createClass({
  render() {
    return (
      <div>
        <h1>App</h1>
        <ul>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/inbox">Inbox</Link></li>
        </ul>
        {this.props.children}
      </div>
    )
  }
});

var About = React.createClass({
  render() {
    return <h3>About</h3>;
  }
});

var Inbox = React.createClass({
  render() {
    return (
      <div>
        <h2>Inbox</h2>
        {this.props.children || "Welcome to your Inbox"}
      </div>
    );
  }
});

var Message = React.createClass({
  render() {
    return <h3>Message {this.props.params.id}</h3>;
  }
});

React.render((
  <Router>
    <Route path="/" component={App}>
      <Route path="about" component={About} />
      <Route path="inbox" component={Inbox}>
        <Route path="messages/:id" component={Message} />
      </Route>
    </Route>
  </Router>
), document.body);
```

As configured, this app knows how to render the following 4 URLs:

URL                     | Components
------------------------|-----------
`/`                     | `App`
`/about`                | `App -> About`
`/inbox`                | `App -> Inbox`
`/inbox/messages/:id`   | `App -> Inbox -> Message`

## Adding an Index

Imagine we'd like to render another component inside of `App` when the URL is `/`. Currently, `this.props.children` inside of `App`'s `render` method is `undefined` in this case. We can use an `<IndexRoute>` to specify a "default" page.

```js
import { IndexRoute } from 'react-router';

var Dashboard = React.createClass({
  render() {
    return <div>Welcome to the app!</div>;
  }
});

React.render((
  <Router>
    <Route path="/" component={App}>
      {/* Show the dashboard at / */}
      <IndexRoute component={Dashboard} />
      <Route path="about" component={About} />
      <Route path="inbox" component={Inbox}>
        <Route path="messages/:id" component={Message} />
      </Route>
    </Route>
  </Router>
), document.body);
```

Now, inside `App`'s `render` method `this.props.children` will be a `<Dashboard>` element! This functionality is similar to Apache's [`DirectoryIndex`](http://httpd.apache.org/docs/2.4/mod/mod_dir.html#directoryindex) or nginx's [`index`](http://nginx.org/en/docs/http/ngx_http_index_module.html#index) directive, both of which allow you to specify a file such as `index.html` when the request URL matches a directory path.

Our sitemap now looks like this:

URL                     | Components
------------------------|-----------
`/`                     | `App -> Dashboard`
`/about`                | `App -> About`
`/inbox`                | `App -> Inbox`
`/inbox/messages/:id`   | `App -> Inbox -> Message`

## Decoupling the UI from the URL

It would be nice if we could remove the `/inbox` segment from the `/inbox/messages/:id` URL pattern, but still render `Message` nested inside the `App -> Inbox` UI. Absolute `path`s let us do exactly that.

```js
React.render((
  <Router>
    <Route path="/" component={App}>
      <IndexRoute component={Dashboard} />
      <Route path="about" component={About} />
      <Route path="inbox" component={Inbox}>
        {/* Use /messages/:id instead of messages/:id */}
        <Route path="/messages/:id" component={Message} />
      </Route>
    </Route>
  </Router>
), document.body);
```

The ability to use absolute paths in deeply nested routes gives us complete control over what the URL looks like! We don't have to add more segments to the URL just to get nested UI.

We can now render the following URLs:

URL                     | Components
------------------------|-----------
`/`                     | `App -> Dashboard`
`/about`                | `App -> About`
`/inbox`                | `App -> Inbox`
`/messages/:id`         | `App -> Inbox -> Message`

**Note**: Absolute paths may not be used in route config that is [dynamically loaded](DynamicRouting.md).

## Preserving URLs

Wait a minute ... we just changed a URL! [That's not cool](http://www.w3.org/Provider/Style/URI.html). Now everyone who had a link to `/inbox/messages/5` has a **broken link**. :(

Not to worry. We can use a `<Redirect>` to make sure that URL still works!

```js
import { Redirect } from 'react-router';

React.render((
  <Router>
    <Route path="/" component={App}>
      <IndexRoute component={Dashboard} />
      <Route path="about" component={About} />
      <Route path="inbox" component={Inbox}>
        <Route path="/messages/:id" component={Message} />

        {/* Redirect /inbox/messages/:id to /messages/:id */}
        <Redirect from="messages/:id" to="/messages/:id" />
      </Route>
    </Route>
  </Router>
), document.body);
```

Now when someone clicks on that link to `/inbox/messages/5` they'll automatically be redirected to `/messages/5`. :highfive:

## Enter and Leave Hooks

[Route](Glossary.md#route)s may also define [`onEnter`](Glossary.md#enterhook) and [`onLeave`](Glossary.md#leavehook) hooks that are invoked once a transition has been [confirmed](ConfirmingNavigation.md). These hooks are useful for various things like [requiring auth](https://github.com/rackt/react-router/tree/master/examples/auth-flow) when a route is entered and saving stuff to persistent storage before a route unmounts.

During a transition, [`onLeave` hooks](Glossary.md#leavehook) run first on all routes we are leaving, starting with the leaf route on up to the first common ancestor route. Next, [`onEnter` hooks](Glossary.md#enterhook) run starting with the first parent route we're entering down to the leaf route.

Continuing with our example above, if a user clicked on a link to `/about` from `/messages/5`, the following hooks would run in this order:

  - `onLeave` on the `/messages/:id` route
  - `onLeave` on the `/inbox` route
  - `onEnter` on the `/about` route

## Alternate Configuration

Since [route](Glossary.md#route)s are usually nested, it's useful to use a concise nested syntax like [JSX](https://facebook.github.io/jsx/) to describe their relationship to one another. However, you may also use an array of plain [route](Glossary.md#route) objects if you prefer to avoid using JSX.

The route config we've discussed up to this point could also be specified like this:

```js
var routeConfig = [
  { path: '/',
    component: App,
    indexRoute: { component: Dashboard },
    childRoutes: [
      { path: 'about', component: About },
      { path: 'inbox',
        component: Inbox,
        childRoutes: [
          { path: '/messages/:id', component: Message },
          { path: 'messages/:id',
            onEnter: function (nextState, replaceState) {
              replaceState(null, '/messages/' + nextState.params.id);
            }
          }
        ]
      }
    ]
  }
];

React.render(<Router routes={routeConfig} />, document.body);
```
