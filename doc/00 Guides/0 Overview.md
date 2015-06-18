To illustrate the problems React Router is going to solve for you, let’s build a
small application without it.

Without React Router
--------------------

```js
var About = React.createClass({/*...*/});
var Inbox = React.createClass({/*...*/});
var Home = React.createClass({/*...*/});

var App = React.createClass({
  getInitialState () {
    return {
      route: window.location.hash.substr(1)
    };
  },

  componentDidMount () {
    window.addEventListener('hashchange', () => {
      this.setState({
        route: window.location.hash.substr(1)
      });
    });
  },

  render () {
    var Child;
    switch (this.props.route) {
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

As the hash portion of the URL changes, `App` will render a different
`<Child/>` by branching on `this.state.route`. Pretty straightforward
stuff. But it gets complicated fast.

Imagine now that `Inbox` has some nested UI at different URLs, maybe
something like this master detail view:

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

And maybe stats page when not viewing a message:

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

We'd have to make our url parsing a lot more intelligent, and end up
with a lot of code to figure out which branch of nested components to be
rendered at any given url: `App -> About`, `App -> Inbox -> Messages ->
Message`, `App -> Inbox -> Messages -> Stats`, etc.

With React Router
-----------------

Nested URLs and nested component hierarchy are at the heart of React
Router's declarative API. Lots of people like to use JSX to define their
routes, but you can use plain objects if you want.

Let's refactor our app to use React Router.

```js
// first we import some components
import { Router, Route, Link } from 'react-router';
// the histories are imported separately for smaller builds
import HashHistory from 'react-router/lib/HashHistory';

// ...

// then we delete a bunch of code from `App` and add some `Link`
// components
var App = React.createClass({
  render () {
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

// Finally we render a `Router` component with some `Route`s, it'll do all
// the fancy routing stuff for us.
React.render((
  <Router history={HashHistory}>
    <Route path="/" component={App}>
      <Route path="about" component={About}/>
      <Route path="inbox" component={Inbox}/>
    </Route>
  </Router>
), document.body);
```

If you're not digging the JSX route config you can use plain objects:

```js
var routes = {
  path: '/',
  component: App,
  childRoutes: [
    { path: 'about', component: About },
    { path: 'inbox', component: Inbox },
  ]
};

React.render(<Router history={HashHistory} children={routes}/>, document.body):
```

Adding more UI
--------------

Alright, now we're ready to nest the inbox messages inside the inbox UI.

```js
// Make a new component to render inside of Inbox
var Message = React.createClass({
  render () {
    return <h3>Message</h3>;
  }
});

var Inbox = React.createClass({
  render () {
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
  <Router history={HashHistory}>
    <Route component={App}>
      <Route path="about" component={About}/>
      <Route path="inbox" component={Inbox}>
        {/* Add the route, nested where we want the UI to nest */}
        <Route path="messages/:id" component={Message}/>
      </Route>
    </Route>
  </Router>
), document.body);
```

Now visits to urls like `inbox/messages/Jkei3c32` will match the new
route and nest the UI branch of `App -> Inbox -> Message`.

Getting the url parameters
--------------------------

We're going to need to know something about the message in order to
fetch it from the server. Route components get some useful properties
injected into them when you render, particularly the parameters from the
dynamic segment of your path. In our case, `:id`.

```js
var Message = React.createClass({
  componentDidMount: function () {
    // from the path `/inbox/messages/:id`
    var id = this.props.params.id;
    fetchMessage(id, function (err, message) {
      this.setState({ message: message });
    })
  },
  // ...
});
```

That's the gist of React Router. Application UIs are boxes inside of
boxes inside of boxes; now you can keep those boxes in sync with the
URL.

