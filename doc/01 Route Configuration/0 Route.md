A `Route` is used to declaratively map routes to your application's
component hierarchy.

Props
-----

### `path`

The path used in the URL.

It will concat with the parent route's path unless it starts with `/`.
In which case you will need to use `absoluteChildPaths` on the parent
route so the router knows to keep going down the route tree even though
the parent path doesn't match the url.

If left undefined, the router will try to match the child routes.

Please refer to the [Path Matching Guide][path-matching] to learn more
about supported path matching syntax.

### `component`

A single component to be rendered when the route matches the url. It can
be rendered by the parent route component with `this.props.children`.

#### Example

```js
var routes = (
  <Route component={App}>
    <Route path="groups" component={Groups}/>
    <Route path="users" component={Users}/>
  </Route>
);

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

### `components`

Routes can define multiple components as an object of name:component
pairs to be rendered when the path matches the url. They can be rendered
by the parent route component with `this.props[name]`.

#### Example

```js
// think of it outside the context of the router, if you had pluggable
// portions of your `render`, you might do it like this
<App main={<Users/>} sidebar={<UsersSidebar/>}/>
<App main={<Groups/>} sidebar={<GroupsSidebar/>}/>

// So with the router its looks like this:
var routes = (
  <Route component={App}>
    <Route path="groups" components={{main: Groups, sidebar: GroupsSidebar}}/>
    <Route path="users" components={{main: Users, sidebar: UsersSidebar}}>
      <Route path="users/:userId" components={Profile}/>
    </Route>
  </Route>
);

var App = React.createClass({
  render () {
    // the matched child route components become props in the parent
    return (
      <div>
        <div className="Main">
          {this.props.main}
        </div>
        <div className="Sidebar">
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
        {/* UsersSidebar will also get <Profile> as this.props.children */}
        {this.props.children}
      </div>
    );
  }
});

```

### `getComponents(state, cb)`

Same as `components` but asynchronous, useful for code-splitting and
returning different routes given some transition `state`.

#### `callback` signature

`cb(err, component)`

#### Example

```js
<Route path="coures/:courseId" getComponents={(cb) => {
  // do asynchronous stuff to find the components
  cb(null, [Course]);
}}/>
```

### `children`

Routes can be nested, `this.props.children` will contain the element
created from the child route component. Please refer to the
[overview][overview] since this is a very critical part of the router's
design.

### `onEnter(nextState, router)`

Called when a route is about to be entered. It provides the next router
state and the router instance for cancelling/redirecting the transition.

### `onLeave(nextState, router)`

Called when a route is about to be exited. It provides the next router
state and the router instance for cancelling/redirecting the transition.

  [overview]:#TODO
  [path-matching]:#TODO
  [ignoreScrollBehavior]:#TODO
  [instragram-example]:#TODO
  [history]:#TODO

