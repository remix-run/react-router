A user-defined component given to a `Route` as the `component` prop. The
router will inject properties into your component when its rendered.

Injected Props
--------------

### `children`

The matched child route elements to be rendered.

#### Example

```js
const routes = (
  <Route component={App}>
    <Route path="groups" components={Groups}}/>
    <Route path="users" components={Users}}/>
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

### Named Children

When a route has multiple components, the elements are available by name
on props. All route components can participate in the nesting.

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

### `params`

The dynamic segments of the url.

### `query`

The query parameters of the url.

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
    this.props.query.sort; // "name"
    this.props.location; // { path: "/course/123/students?sort=name" }
    // ...
  }
});
```

  [transition]:#TODO
  [Route]:#TODO
  [location]:#TODO
