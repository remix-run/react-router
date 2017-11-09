# location

Locations represent where the app is now, where you want it to go, or
even where it was. It looks like this:

```js
{
  key: 'ac3df4', // not with HashHistory!
  pathname: '/somewhere'
  search: '?some=search-string',
  hash: '#howdy',
  state: {
    [userDefined]: true
  }
}
```

The router will provide you with a location object in a few places:

- [Route component](./Route.md#component) as `this.props.location`
- [Route render](./Route.md#render-func) as `({ location }) => ()`
- [Route children](./Route.md#children-func) as `({ location }) => ()`
- [withRouter](./withRouter.md) as `this.props.location`

It is also found on `history.location` but you shouldn't use that because its mutable. You can read more about that in the [history](./history.md) doc.

A location object is never mutated so you can use it in the lifecycle hooks to determine when navigation happens, this is really useful for data fetching and animation.

```js
componentWillReceiveProps(nextProps) {
  if (nextProps.location !== this.props.location) {
    // navigated!
  }
}
```

You can provide locations instead of strings to the various places that navigate:

- Web [Link to](../../../react-router-dom/docs/api/Link.md#to)
- Native [Link to](../../../react-router-native/docs/api/Link.md#to)
- [Redirect to](./Redirect.md#to)
- [history.push](./history.md#push)
- [history.replace](./history.md#push)

Normally you just use a string, but if you need to add some "location state" that will be available whenever the app returns to that specific location, you can use a location object instead. This is useful if you want to branch UI based on navigation history instead of just paths (like modals).

```jsx
// usually all you need
<Link to="/somewhere"/>

// but you can use a location instead
const location = {
  pathname: '/somewhere',
  state: { fromDashboard: true }
}

<Link to={location}/>
<Redirect to={location}/>
history.push(location)
history.replace(location)
```

Finally, you can pass a location to the following components:

- [Route](./Route.md#location)
- [Switch](./Switch.md#location)

This will prevent them from using the actual location in the router's state. This is useful for animation and pending navigation, or any time you want to trick a component into rendering at a different location than the real one.

