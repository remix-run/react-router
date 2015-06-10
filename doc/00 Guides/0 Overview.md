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
      case 'about': Child = About; break;
      case 'inbox': Child = Inbox; break;
      default:      Child = Home;
    }

    return (
      <div>
        <h1>App</h1>
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

Imagine now that `Inbox` has some nested UI at a path like
`inbox/messages/:id` and `inbox/unread`, etc. We'll need to make our url
parsing much more intelligent to be able to pass the right information
to `App`, and then to `Inbox` in order for it to know which URL-mapped
child component it should render. We'd then have a branch of components
that should be rendered at any given URL. Add a few more of these
branches and we'll end up with a lot of code to keep the URL and our
application's component hierarchy in sync.

With React Router
-----------------

Nested URLs and nested component hierarchy are at the heart of React
Router. It brings a declarative API to your routes. Lots of people like
to use JSX to define their routes, but you can use plain objects if you
want.

Let's refactor our app to use React Router.

```js
// first we import some components
import { Router, Route } from 'react-router';
import HashHistory from 'react-router/lib/HashHistory';

// ...

// then we delete a bunch of code from `App`
var App = React.createClass({
  render () {
    return (
      <div>
        <h1>App</h1>
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
  childRoute: [
    { path: 'about', component: About },
    { path: 'inbox', component: Inbox },
  ]
};

React.render(<Router children={routes}/>, document.body):
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

