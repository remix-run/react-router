# Introduction

React Router is a powerful routing library built on top of [React](http://facebook.github.io/react/) that helps you add new screens and flows to your application incredibly quickly, all while keeping the URL in sync with what's being displayed on the page. The project benefits from several years of combined experience working with the legendary Ember.js router.

* [Motivation](Motivation.md)
* [Principles](Principles.md)

===

To illustrate the problems React Router is going to solve for you, let's build a small application without it.

### Without React Router

```js
import React from 'react';

var About = React.createClass({/*...*/});
var Inbox = React.createClass({/*...*/});
var Home = React.createClass({/*...*/});

var App = React.createClass({
  getInitialState() {
    return {
      route: window.location.hash.substr(1)
    };
  },

  componentDidMount() {
    window.addEventListener('hashchange', () => {
      this.setState({
        route: window.location.hash.substr(1)
      });
    });
  },

  render() {
    var Child;
    switch (this.state.route) {
      case '/about': Child = About; break;
      case '/inbox': Child = Inbox; break;
      default:      Child = Home;
    }

    return (
      <div>
        <h1>App</h1>
        <ul>
          <li><a href="#/about">About</a></li>
          <li><a href="#/inbox">Inbox</a></li>
        </ul>
        <Child/>
      </div>
    )
  }
});

React.render(<App />, document.body);
```

As the hash portion of the URL changes, `<App>` will render a different `<Child>` by branching on `this.state.route`. Pretty straightforward stuff. But it gets complicated fast.

Imagine now that `Inbox` has some nested UI at different URLs, maybe something like this master detail view:

```
path: /inbox/messages/1234

+---------+------------+------------------------+
| About   |    Inbox   |                        |
+---------+            +------------------------+
| Compose    Reply    Reply All    Archive      |
+-----------------------------------------------+
|Movie tomorrow|                                |
+--------------+   Subject: TPS Report          |
|TPS Report        From:    boss@big.co         |
+--------------+                                |
|New Pull Reque|   So ...                       |
+--------------+                                |
|...           |                                |
+--------------+--------------------------------+
```

And maybe a stats page when not viewing a message:

```
path: /inbox

+---------+------------+------------------------+
| About   |    Inbox   |                        |
+---------+            +------------------------+
| Compose    Reply    Reply All    Archive      |
+-----------------------------------------------+
|Movie tomorrow|                                |
+--------------+   10 Unread Messages           |
|TPS Report    |   22 drafts                    |
+--------------+                                |
|New Pull Reque|                                |
+--------------+                                |
|...           |                                |
+--------------+--------------------------------+
```

We'd have to make our URL parsing a lot smarter, and we would end up with a lot of code to figure out which branch of nested components to be rendered at any given URL: `App -> About`, `App -> Inbox -> Messages -> Message`, `App -> Inbox -> Messages -> Stats`, etc.

### With React Router

Let's refactor our app to use React Router.

```js
import React from 'react';

// First we import some components...
import { Router, Route, Link } from 'react-router';

// Then we delete a bunch of code from App and
// add some <Link> elements...
var App = React.createClass({
  render() {
    return (
      <div>
        <h1>App</h1>
        {/* change the <a>s to <Links>s */}
        <ul>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/inbox">Inbox</Link></li>
        </ul>

        {/*
          next we replace `<Child>` with `this.props.children`
          the router will figure out the children for us
        */}
        {this.props.children}
      </div>
    )
  }
});

// Finally, we render a <Router> with some <Route>s.
// It does all the fancy routing stuff for us.
React.render((
  <Router>
    <Route path="/" component={App}>
      <Route path="about" component={About} />
      <Route path="inbox" component={Inbox} />
    </Route>
  </Router>
), document.body);
```

React Router knows how to build nested UI for us, so we don't have to manually figure out which `<Child>` component to render. Internally, the router converts your `<Route>` element hierarchy to a [route config](/docs/Glossary.md#routeconfig). But if you're not digging the JSX you can use plain objects instead:

```js
var routes = {
  path: '/',
  component: App,
  childRoutes: [
    { path: 'about', component: About },
    { path: 'inbox', component: Inbox },
  ]
};

React.render(<Router routes={routes} />, document.body);
```

## Adding More UI

Alright, now we're ready to nest the inbox messages inside the inbox UI.

```js
// Make a new component to render inside of Inbox
var Message = React.createClass({
  render() {
    return <h3>Message</h3>;
  }
});

var Inbox = React.createClass({
  render() {
    return (
      <div>
        <h2>Inbox</h2>
        {/* Render the child route component */}
        {this.props.children || "Welcome to your Inbox"}
      </div>
    );
  }
});

React.render((
  <Router>
    <Route path="/" component={App}>
      <Route path="about" component={About} />
      <Route path="inbox" component={Inbox}>
        {/* Add the route, nested where we want the UI to nest */}
        <Route path="messages/:id" component={Message} />
      </Route>
    </Route>
  </Router>
), document.body);
```

Now visits to URLs like `inbox/messages/Jkei3c32` will match the new route and nest the UI branch of `App -> Inbox -> Message`.

### Getting URL Parameters

We're going to need to know something about the message in order to fetch it from the server. Route components get some useful properties injected into them when you render, particularly the parameters from the dynamic segment of your path. In our case, `:id`.

```js
var Message = React.createClass({

  componentDidMount() {
    // from the path `/inbox/messages/:id`
    var id = this.props.params.id;

    fetchMessage(id, function (err, message) {
      this.setState({ message: message });
    });
  },

  // ...

});
```

That's the gist of React Router. Application UIs are boxes inside of boxes inside of boxes; now you can keep those boxes in sync with the URL and link to them easily.

The docs about [route configuration](/docs/basics/RouteConfiguration.md) describe more of the router's features in depth.
