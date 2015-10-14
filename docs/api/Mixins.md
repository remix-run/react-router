# Mixins

- [`Lifecycle`](#Lifecycle)
- [`History`](#History)
- [`RouteContext`](#RouteContext)

## <a id='Lifecycle'></a>[`Lifecycle`](#Lifecycle)
Adds a hook to your component instance that is called when the router is about to navigate away from the route the component is configured on, with the opportunity to cancel the transition. Mostly useful for forms that are partially filled out.

On standard transitions, `routerWillLeave` receives a single argument: the `location` we're transitioning to. To cancel the transition, return false.

To prompt the user for confirmation, return a prompt message (string). `routerWillLeave` does not receive a location object during the beforeunload event in web browsers (assuming you're using the `useBeforeUnload` history enhancer). In this case, it is not possible for us to know the location we're transitioning to so `routerWillLeave` must return a prompt message to prevent the user from closing the tab.

#### Lifecycle Methods
##### <a id='routerWillLeave'></a>`routerWillLeave(nextLocation)`
Called when the router is attempting to transition away from the route that rendered this component.

##### arguments
- `nextLocation` - the next location



## <a id='History'></a>[`History`](#History)
Adds the router's `history` object to your component instance.

> **Note**: You do not need this mixin for route components, it's already available as `this.props.history`. This is for components deeper in the render tree that need access to the router's `history` object.

#### Methods
##### `pushState(state, pathname, query)`
Transitions to a new URL.

###### arguments
- `state` - the location state.
- `pathname` - the full URL with or without the query.
- `query` - an object that will be stringified by the router.

##### `replaceState(state, pathname, query)`
Replaces the current URL with a new one, without affecting the length of the history (like a redirect).

###### arguments
- `state` - the location state.
- `pathname` - the full URL with or without the query.
- `query` - an object that will be stringified by the router.

##### `go(n)`
Go forward or backward in the history by `n` or `-n`.

##### `goBack()`
Go back one entry in the history.

##### `goForward()`
Go forward one entry in the history.

##### `createPath(pathname, query)`
Stringifies the query into the pathname, using the router's config.

##### `createHref(pathname, query)`
Creates a URL, using the router's config. For example, it will add `#/` in front of the `pathname` for hash history.

##### `isActive(pathname, query, indexOnly)`
Returns `true` or `false` depending on if the current path is active. Will be true for every route in the route branch matched by the `pathname` (child route is active, therefore parent is too).

###### arguments
- `pathname` - the full URL with or without the query.
- `query` - an object that will be stringified by the router.
- `indexOnly` - a boolean (default: `false`).

#### Examples
```js
import { History } from 'react-router'

React.createClass({
  mixins: [ History ],
  render() {
    return (
      <div>
        <div onClick={() => this.history.pushState(null, '/foo')}>Go to foo</div>
        <div onClick={() => this.history.replaceState(null, 'bar')}>Go to bar without creating a new history entry</div>
        <div onClick={() => this.history.goBack()}>Go back</div>
     </div>
   )
 }
})
```

Let's say you are using bootstrap and want to get `active` on those `li` tags for the Tabs:

```js
import { Link, History } from 'react-router'

const Tab = React.createClass({
  mixins: [ History ],
  render() {
    let isActive = this.history.isActive(this.props.to, this.props.query)
    let className = isActive ? 'active' : ''
    return <li className={className}><Link {...this.props}/></li>
  }
})

// use it just like <Link/>, and you'll get an anchor wrapped in an `li`
// with an automatic `active` class on both.
<Tab href="foo">Foo</Tab>
```

#### But I’m using Classes
> Notice how we never told you to use ES6 classes? :)

https://twitter.com/soprano/status/610867662797807617

If you aren't happy using `createClass` for a handful of components in your app for the sake of the `History` mixin, have a couple of options:

- Pass `this.props.history` from your route components down to the components that need it.
- Use context

```js
import { PropTypes } from 'react-router'

class MyComponent extends React.Component {
  doStuff() {
    this.context.history.pushState(null, '/some/path')
  }
}

MyComponent.contextTypes = { history: PropTypes.history }
```

- [Make your history a module](../guides/advanced/NavigatingOutsideOfComponents.md)
- Create a higher order component, we might end up shipping with this and deprecating history, just haven't had the time to think it through all the way.

```js
function connectHistory(Component) {
  return React.createClass({
    mixins: [ History ],
    render() {
      return <Component {...this.props} history={this.history} />
    }
  })
}

// other file
import connectHistory from './connectHistory'

class MyComponent extends React.Component {
  doStuff() {
    this.props.history.pushState(null, '/some/where')
  }
}

export default connectHistory(MyComponent)
```



## <a id='RouteContext'></a>[`RouteContext`](#RouteContext)
The RouteContext mixin provides a convenient way for route components to set the route in context. This is needed for routes that render elements that want to use the [Lifecycle mixin](#Lifecycle) to prevent transitions.

It simply adds `this.context.route` to your component.
