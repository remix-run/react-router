Available path configurations:

```js
<Router ...>
  <Route path='/home' component={ Comp }> {/* mounts to /home */}
    <Route path='inside-home' /> {/* mounts to /home/inside-home */}
    <Route path='/also-in-root' component={ Comp } /> {/* mounts to /also-in-root */}
    <Route path=':param' /> {/* mounts to /home/<param>. you can access your params in the props */}
    <Route path='something-before-:param' /> {/* it works too */}
    <Route path=':required(/:optional)' /> {/* required and optional path matching */}
  </Route>
</Router>
```

### Inside parent
TODO

### Direct to root path
TODO

### Parameters
URL Parameters, in the form of `http://server/{PARAM_NAME}` are declared in the form of `:paramName`. a colon and then the parameter name.

Example:

```js
class User extends React.Component {
  render() {
    return (
      <div>
        access the user id: { this.props.params.userId }
      </div>
    )
  }
}

React.render(
  <Router ...>
    <Route path=':userId' component={ User } />
  </Router>,
  document.getElementById('app')
)
```

### Optional parameters
TODO
