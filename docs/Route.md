# Route

A `Route` is used to declaratively map routes to your application's
component hierarchy.

## Props

### `path`

The path used in the URL.

It will concat with the parent route's path unless it starts with `/`,
making it an absolute path.

**Note**: Absolute paths may not be used in route config that is [dynamically loaded](DynamicRouting.md).

If left undefined, the router will try to match the child routes.

### `component`

A single component to be rendered when the route matches the url. It can
be rendered by the parent route component with `this.props.children`.

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

Routes can define multiple components as an object of `name:component`
pairs to be rendered when the path matches the url. They can be rendered
by the parent route component with `this.props.children[name]`.

#### Example

```js
// think of it outside the context of the router, if you had pluggable
// portions of your `render`, you might do it like this
<App children={{main: <Users/>, sidebar: <UsersSidebar/>}}/>

// So with the router it looks like this:
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
    var { main, sidebar } = this.props.children;
    return (
      <div>
        <div className="Main">
          {main}
        </div>
        <div className="Sidebar">
          {sidebar}
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

### `getComponent(callback)`

Same as `component` but asynchronous, useful for
code-splitting.

#### `callback` signature

`cb(err, component)`

#### Example

```js
<Route path="coures/:courseId" getComponent={(cb) => {
  // do asynchronous stuff to find the components
  cb(null, Course);
}}/>
```

### `getComponents(callback)`

Same as `components` but asynchronous, useful for
code-splitting.

#### `callback` signature

`cb(err, components)`

#### Example

```js
<Route path="coures/:courseId" getComponent={(cb) => {
  // do asynchronous stuff to find the components
  cb(null, {sidebar: CourseSidebar, content: Course});
}}/>
```

### `children`

Routes can be nested, `this.props.children` will contain the element created from the child route component. Please refer to the [Route Configuration][RouteConfiguration.md] since this is a very critical part of the router's design.

### `onEnter(nextState, redirectTo)`

Called when a route is about to be entered. It provides the next router state and a function to redirect to another path.

### `onLeave()`

Called when a route is about to be exited.

