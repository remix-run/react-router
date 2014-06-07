React Router
============

Declarative routing with automatic UI nesting for React.

Thanks, Ember
-------------

This library is highly inspired by the Ember.js routing API. Huge thanks to
the Ember team.

WIP
---

This is a huge work in progress. Don't use it yet.

Usage Example
-------------

```js
Router(
  <Route handler={App}>
    <Route name="about" path="about" handler={About}/>
    <Route name="users" path="users" handler={Users}>
      <Route name="user" path="user/:userId" handler={User}/>
    </Route>
  </Route>
).renderComponent(document.body);
```

The rest of the app ...

```js
var App = React.createClass({
  render: function() {
    return (
      <div className="App">
        <h1>App</h1>
        <ul>
          <li><Link to="about">About</Link></li>
          <li><Link to="users">Users</Link></li>
          <li><Link to="user" userId="123">User 123</Link></li>
        </ul>
        {this.props.activeRoute}
      </div>
    );
  }
});

var About = React.createClass({
  render: function() {
    return <h2>About</h2>;
  }
});

var Users = React.createClass({
  render: function() {
    return (
      <div className="Users">
        <h2>Users</h2>
        {this.props.activeRoute}
      </div>
    );
  }
});

var User = React.createClass({
  render: function() {
    return <div>{this.props.params.userId}</div>
  }
});
```

API
---

### Router (Constructor)

Router config constructor. Has two signatures.

#### Signature: `Router(routes)`

```jsx
Router(
  <Route handler={App}>
    <Route path="/users" name="userList" handler={UserList}>
      <Route path="/users/:id" name="user" handler={User}/>
    </Route>
  </Route>
);
```

#### Signature: `Router(path, name, handler, children])`

```jsx
Router('/', App, function (route) {
  route('/users', 'userList', UserList, function(route) {
    route('/users/:id', 'user', User);
  });
});
```

#### Methods

**renderComponent(Node)** - Renders the top level handler into `Node`.

```js
var router = Router(routes);
router.renderComponent(document.body):
```

#### Constructor Methods

**useHistory()** - Uses the browser's history API instead of hashes.

```js
Router.useHistory();
```

**transitionTo(routeName, [params[, query]])** - Programatically transition to a new route.

```js
Router.transitionTo('user', {id: 10}, {showAge: true});
Router.transitionTo('about');
```

**replaceWith(routeName, [params[, query]])** - Programatically replace current route with a new route. Does not add an entry into the browser history.

```js
Router.replaceWith('user', {id: 10}, {showAge: true});
Router.replaceWith('about');
```

### Route (Component)

Configuration component to declare your application's routes and view hierarchy.

#### Properties

**name** - The name of the route, used in the `Link` component and the
router's transition methods.

**path** - The path used in the URL, supporting dynamic segments. If
left undefined, the path will be defined by the `name`.

**handler** - The component to be rendered when the route matches.

#### Children

Routes can be nested. When a child route matches, the parent route's
handler will have an instance of the child route's handler available on
`this.props.activeRoute`.

#### Examples

```xml
<Route handler={App}>
  <!-- path automitically assigned to the name since it is omitted -->
  <Route name="about" handler={About} />
  <Route name="users" handler={Users}>
    <!-- note the dynamic segment in the path -->
    <Route name="user" handler={User} path="/user/:id" />
  </Route>
</Route>
```

Or w/o JSX:

```js
Route({handler: App},
  Route({name: 'about', handler: About}),
  Route({name: 'users', handler: Users},
    Route({name: 'user', handler: User, path: '/user/:id'})
  )
);
```

#### Note

Paths are not inherited from parent routes.


### Link (Component)

Creates an anchor tag that links to a route in the application. Also
gets the `active` class automatically when the route matches. If you
change the path of your route, you don't have to change your links.

#### Properties

**to** - The name of the route to link to.

**[param]** - Any parameters the route defines are passed by name
through the link's properties.

#### Example

Given a route like `<Route name="user" path="/users/:userId"/>`:

```xml
<Link to="user" userId={user.id}>{user.name}</Link>
<!-- becomes one of these depending on your router and if the route is
active -->
<a href="/users/123" class="active">Michael</a>
<a href="#/users/123">Michael</a>
```

Benefits of This Approach
-------------------------

1. **Incredible screen-creation productivity** - There is only one
   use-case when a user visits a route: render something. Every user
   interface has layers (or nesting) whether its a simple navbar or
   multiple levels of master-detail. Coupling nested routes to these
   nested views gets rid of a ton of work for the developer to wire all
   of it together when the user switches routes. Adding new screens
   could not get faster.

2. **Immediate understanding of application structure** - When routes
   are declared in one place, developers can easily construct a mental
   image of the application. It's essentially a sitemap. There's not a
   better way to get so much information about your app this quickly.

3. **Code tractability** - When a developer gets a ticket to fix a bug
   at as specific url they simply 1) look at the route config, then 2)
   go find the handler for that route. Every entry point into your
   application is represented by these routes.

4. **URLs are your first thought, not an after-thought** - Seriously,
   don't break the web. Friends don't let friends route alone. With
   ReactRouter, you don't get UI on the page without configuring a url
   first. Fortunately, its wildly productive this way, too.

