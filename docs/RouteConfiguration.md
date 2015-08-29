## Route Configuration

Let's start with the simple app from [the introduction](Introduction.md).

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

### Adding an Index

Imagine we'd like to render another component inside of `App` when the URL is `/`. Currently, `this.props.children` is `undefined` in this case. We can use an `<IndexRoute>` for that.

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

Now, `this.props.children` will be a `<Dashboard>` element inside `App`'s `render` method! This functionality is similar to Apache's [`DirectoryIndex`](http://httpd.apache.org/docs/2.4/mod/mod_dir.html#directoryindex) or nginx's [`index`](http://nginx.org/en/docs/http/ngx_http_index_module.html#index) directive.

Our sitemap now looks like this:

URL                     | Components
------------------------|-----------
`/`                     | `App -> Dashboard`
`/about`                | `App -> About`
`/inbox`                | `App -> Inbox`
`/inbox/messages/:id`   | `App -> Inbox -> Message`

### Decoupling the UI from the URL

It would be nice if we could remove the `/inbox` segment from the `/inbox/messages/:id` URL, but still render `Message` nested inside the `App -> Inbox` UI. We can use an absolute path for that.

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

We can now render the following URLs:

URL                     | Components
------------------------|-----------
`/`                     | `App -> Dashboard`
`/about`                | `App -> About`
`/inbox`                | `App -> Inbox`
`/messages/:id`         | `App -> Inbox -> Message`

The ability to use absolute paths in deeply nested routes gives us complete control over what the URL looks like! We don't have to add more segments to the URL just to get nested UI.

### Preserving URLs

But wait just a minute ... we just changed a URL! [That's not cool](http://www.w3.org/Provider/Style/URI.html). Now everyone who had a link to `/inbox/messages/5` has a **broken link**. :(

Not to worry. Redirects to the rescue!

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

Now when someone clicks on that link to `/inbox/messages/5` they'll automatically be redirected to `/messages/5`. We don't hate our users anymore! :highfive:
