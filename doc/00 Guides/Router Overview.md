To illustrate the problems React Router is going to solve for you, let’s build a
small application without it.

Without React Router
--------------------

```js
var About = React.createClass({
  render: function () {
    return <h2>About</h2>;
  }
});

var Inbox = React.createClass({
  render: function () {
    return <h2>Inbox</h2>;
  }
});

var Home = React.createClass({
  render: function () {
    return <h2>Home</h2>;
  }
});

var App = React.createClass({
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

function render () {
  var route = window.location.hash.substr(1);
  React.render(<App route={route} />, document.body);
}

window.addEventListener('hashchange', render);
render(); // render initially
```

As the hash portion of the URL changes, `App` will render a different
`<Child/>` by branching on `this.props.route`. Pretty straightforward
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
Router. Lets make our routing for our little app declarative. We use JSX
for route configuration because we want to define a view hierarchy with
properties, so its a pefect fit.

```js
var Router = require('react-router');
var Route = Router.Route;

// declare our routes and their hierarchy
var routes = (
  <Route handler={App}>
    <Route path="about" handler={About}/>
    <Route path="inbox" handler={Inbox}/>
  </Route>
);
```

Next we need to delete some code from `App`. We'll replace `<Child/>`
with `<RouteHandler/>` that functions as the old `switch` block from
before.

```js
var RouteHandler = Router.RouteHandler;

var App = React.createClass({
  render () {
    return (
      <div>
        <h1>App</h1>
        <RouteHandler/>
      </div>
    )
  }
});
```

Finally we need to listen to the url and render the application.

```js
Router.run(routes, Router.HashLocation, (Root) => {
  React.render(<Root/>, document.body);
});
```

`Root` is a component that bakes in the matched component hierarchy
making `RouteHandler` know what to render.

Note that `<Route/>` components are not ever rendered, they are just
configuration objects that the router uses to create an internal tree of
routes.

Adding more UI
--------------

Alright, now we're ready to nest the inbox messages inside the inbox UI.
First we'll make a new `Message` component and then we'll add the route
under `inbox` so that the UI will nest.

```js
var Message = React.createClass({
  render () {
    return <h3>Message</h3>;
  }
});

var routes = (
  <Route handler={App}>
    <Route path="about" handler={About}/>
    <Route path="inbox" handler={Inbox}>
      <Route path="messages/:id" handler={Message}/>
    </Route>
  </Route>
);
```

Now visits to urls like `inbox/messages/Jkei3c32` will match the new
route and nest the UI branch of `App -> Inbox -> Message`.

Getting the url parameters
--------------------------

We're going to need to know something about the message in order to
fetch it from the server. We call the component you hand to a `<Route/>`
a `RouteHandler`. `RouteHandler` instances get some useful properties
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

Nested UI and Nested URLs need not be coupled
---------------------------------------------

With React Router, you don't need to nest your UI in order to get a
nested URL. Inversely, to get nested UI, you don't need to have nested
URLs either.

Lets make a new url at `/about/company`, but without nesting the UI
inside of the `About` component.

```js
var routes = (
  <Route handler={App}>
    <Route path="about" handler={About}/>
    <Route path="about/company" handler={Company}/>
  </Route>
);
```

Though our url is nested, the UI of `About` and `Company` are siblings.

Now lets go the other way and add the url `/archive/messages/:id` and
have it nested under our inbox UI even though the URL is not nested. We
have to do three things for this to work:

1. Start the path with `/` to signal that its an absolute path. This
   won’t “inherit” the parent path the way `inbox/messages/:id` gets
   inherited.
2. Nest the `<Route/>` under the `inbox` route to cause the UI to nest.
3. Ensure you have all the necessary dynamic segments, we only have
   `:id` so its pretty easy.

```js
var routes = (
  <Route handler={App}>
    <Route path="inbox" handler={Inbox}>
      <Route path="messages/:id" handler={Message}/>
      <Route path="/archive/messages/:id" handler={Message}/>
    </Route>
  </Route>
);
```

That's the gist of React Router. Application UIs are boxes inside of
boxes inside of boxes; now you can keep those boxes in sync with the
URL.

