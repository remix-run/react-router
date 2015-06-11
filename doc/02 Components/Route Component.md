A user-defined component given to a `Route` as the `component` prop. The
router will inject properties into your component when its rendered.

Injected Props
--------------

### `children`

The matched child route elements to be rendered.

#### Example

```js
React.render((
  <Router history={HashHistory}>
    <Route path="/" component={App}>
      <Route path="groups" components={Groups}}/>
      <Route path="users" components={Users}}/>
    </Route>
  </Router>
), element);

var App = React.createClass({
  render () {
    return (
      <div>
        {/* this will be either <Users> or <Groups> */}
        {this.props.children}
      </div>
    );
  }
});
```

### Named Components

When a route has multiple components, the elements are available by name
on props. All route components can participate in the nesting.

#### Example

```js
React.render((
  <Router history={HashHistory}>
    <Route path="/" component={App}>
      <Route path="groups" components={{main: Groups, sidebar: GroupsSidebar}}/>
      <Route path="users" components={{main: Users, sidebar: UsersSidebar}}>
        <Route path="users/:userId" components={Profile}/>
      </Route>
    </Route>
  </Router>
), element);

var App = React.createClass({
  render () {
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
  render () {
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

### `params`

The dynamic segments of the url.

### `routeParams`

Subset of the dynamic segments of the url that relate to the route the
component belongs to. For example, if the route path is `users/:userId`
and the url is `/users/123/portfolios/345` then `props.routeParams` will be
`{userId: '123'}`, and `route.params` will be `{userId: '123',
portfolioId: 345}`.

### `location`

The [location][location] matched.

### `route`

The matched [Route][Route] the component belongs to.

Examples
--------

```js
// given a route like this:
<Route path="/course/:courseId/students" component={Students}/>

// and a url like this:
"/course/123/students?sort=name"

var Students = React.createClass({
  render () {
    this.props.params.courseId; // "123"
    this.props.location.query.sort; // "name"
    // ...
  }
});
```

  [transition]:#TODO
  [Route]:#TODO
  [location]:#TODO

