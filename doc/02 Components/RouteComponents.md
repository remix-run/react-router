## Route Components

A route's component is rendered when that route matches the URL. The router will inject the following properties into your component when it's rendered:

#### `isTransitioning`

A boolean value that is `true` when the router is transitioning, `false` otherwise.

#### `location`

The current [location](http://rackt.github.io/history/docs/Location.html).

#### `params`

The dynamic segments of the URL.

#### `route`

The route that rendered this component.

#### `routeParams`

A subset of `this.props.params` that were directly specified in this component's route. For example, if the route's path is `users/:userId` and the URL is `/users/123/portfolios/345` then `this.props.routeParams` will be `{userId: '123'}`, and `this.props.params` will be `{userId: '123', portfolioId: 345}`.

#### `children`

The matched child route elements to be rendered.

#### Example

```js
React.render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="groups" components={Groups} />
      <Route path="users" components={Users} />
    </Route>
  </Router>
), node);

var App = React.createClass({
  render() {
    return (
      <div>
        {/* this will be either <Users> or <Groups> */}
        {this.props.children}
      </div>
    );
  }
});
```

### Named Child Components

When a route has multiple components, the child elements are available by name on `this.props`. All route components can participate in the nesting.

#### Example

```js
React.render((
  <Router history={HashHistory}>
    <Route path="/" component={App}>
      <Route path="groups" components={{main: Groups, sidebar: GroupsSidebar}} />
      <Route path="users" components={{main: Users, sidebar: UsersSidebar}}>
        <Route path="users/:userId" components={Profile} />
      </Route>
    </Route>
  </Router>
), node);

var App = React.createClass({
  render() {
    // the matched child route components become props in the parent
    return (
      <div>
        <div className="Main">
          {/* this will either be <Groups> or <Users> */}
          {this.props.main}
        </div>
        <div className="Sidebar">
          {/* this will either be <GroupsSidebar> or <UsersSidebar> */}
          {this.props.sidebar}
        </div>
      </div>
    );
  }
});

var Users = React.createClass({
  render() {
    return (
      <div>
        {/* if at "/users/123" this will be <Profile> */}
        {/* UsersSidebar will also get <Profile> as this.props.children,
            you pick where it renders */}
        {this.props.children}
      </div>
    );
  }
});
```
