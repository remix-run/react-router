A `Route` is used to declaratively map routes to your application's
component hierarchy.

Props
-----

### `path`

The path used in the URL.

It will concat with the parent route's path unless it starts with `/`.
In which case you will need to use `childWillMatch` on the parent route
so the router knows to keep going down the route tree.

If left undefined, the router will try to match the child routes.

Please refer to the [Path Matching Guide][path-matching] to learn more
about supported path matching syntax.

### `component`

A single component to be rendered when the route matches the url. It can
be rendered by the parent route component with `this.props.children`.

#### Example

```js
const routes = (
  <Route component={App}>
    <Route path="groups" components={Groups}/>
    <Route path="users" components={Users}/>
  </Route>
);

const App = React.createClass({
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
pairs to be rendered when the path matches the url. They can be rendred
by the parent route component with `this.props[name]`.

#### Example

```js
const routes = (
  <Route component={App}>
    <Route path="groups" components={{main: Groups, sidebar: GroupsSidebar}}/>
    <Route path="users" components={{main: Users, sidebar: UsersSidebar}}>
      <Route path="users/:userId" components={Profile}/>
    </Route>
  </Route>
);

const App = React.createClass({
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

const Users = React.createClass({
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

### `getComponent(cb)`

Same as `component` but asynchronous, useful for code-splitting.

#### `callback` signature

`cb(err, component)`

#### Example

```js
<Route path="coures/:courseId" getComponents={(cb) => {
  // do asynchronous stuff to find the component
  cb(null, Course);
}}/>
```

### `children`

Routes can be nested. Please refer to the [overview][overview] since this
is a very critical part of the router's design.

### `childWillMatch`

A function to hint to the router to match the route even if the path
doesn't match the url. This is primarily useful for child routes that do
not want to concat their url with the parent or allowing two routes in
different parts of the tree to have the same url, but are matched based
on some sort of logic (first load, navigating from the dashboard, etc).

Check out the [instagram][instragram-example] example.

### `onEnter(history, nextState)`

A hook called from `Transitions` middleware when a route is about to
entered. It provides your [`history`][history] to cancel or redirect the
transition, and the router's state.

### `onLeave(history, nextState)`

A hook called from `Transitions` middleware when a route is about to be
left. It provides your [`history`][history] to cancel or redirect the
transition, and the router's state.

  [overview]:#TODO
  [path-matching]:#TODO
  [ignoreScrollBehavior]:#TODO
  [instragram-example]:#TODO
  [history]:#TODO

