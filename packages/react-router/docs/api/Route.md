# &lt;Route>

The Route component is perhaps the most important component in React
Router to understand and learn to use well. Its most basic
responsibility is to render some UI when a [location](./location.md)
matches the route's `path`.

Consider the following code:

```js
import { BrowserRouter as Router, Route } from 'react-router-dom'

<Router>
  <div>
    <Route exact path="/" component={Home}/>
    <Route path="/news" component={NewsFeed}/>
  </div>
</Router>
```

If the location of the app is `/` then the UI hierarchy will be something like:

```html
<div>
  <Home/>
  <!-- react-empty: 2 -->
</div>
```

And if the location of the app is `/news` then the UI hierarchy will be:

```html
<div>
  <!-- react-empty: 1 -->
  <NewsFeed/>
</div>
```

The "react-empty" comments are just implementation details of React's `null` rendering. But for our purposes, it is instructive. A Route is always technically "rendered" even though its rendering `null`. As soon as the app location matches the route's path, your component will be rendered.

## Route render methods

There are 3 ways to render something with a `<Route>`:

- [`<Route component>`](#component)
- [`<Route render>`](#render-func)
- [`<Route children>`](#children-func)

Each is useful in different circumstances. You should use only one of these props on a given `<Route>`. See their explanations below to understand why you have 3 options. Most of the time you'll use `component`.

## Route props

All three [render methods](#route-render-methods) will be passed the same three route props

- [match](./match.md)
- [location](./location.md)
- [history](./history.md)

## component

A React component to render only when the location matches. It will be
rendered with [route props](#route-props).

```js
<Route path="/user/:username" component={User}/>

const User = ({ match }) => {
  return <h1>Hello {match.params.username}!</h1>
}
```

When you use `component` (instead of `render` or `children`, below) the router uses [`React.createElement`](https://facebook.github.io/react/docs/react-api.html#createelement) to create a new [React element](https://facebook.github.io/react/docs/rendering-elements.html) from the given component. That means if you provide an inline function to the `component` prop, you would create a new component every render. This results in the existing component unmounting and the new component mounting instead of just updating the existing component. When using an inline function for inline rendering, use the `render` or the `children` prop (below).

## render: func

This allows for convenient inline rendering and wrapping without the undesired remounting explained above.

Instead of having a new [React element](https://facebook.github.io/react/docs/rendering-elements.html) created for you using the [`component`](#component) prop, you can pass in a function to be called when the location matches. The `render` prop receives all the same [route props](#route-props) as the `component` render prop.

```js
// convenient inline rendering
<Route path="/home" render={() => <div>Home</div>}/>

// wrapping/composing
const FadingRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={props => (
    <FadeIn>
      <Component {...props}/>
    </FadeIn>
  )}/>
)

<FadingRoute path="/cool" component={Something}/>
```

**Warning:** `<Route component>` takes precedence over `<Route render>` so don't use both in the same `<Route>`.

## children: func

Sometimes you need to render whether the path matches the location or not. In these cases, you can use the function `children` prop. It works exactly like `render` except that it gets called whether there is a match or not.

The `children` render prop receives all the same [route props](#route-props) as the `component` and `render` methods, except when a route fails to match the URL, then `match` is `null`. This allows you to dynamically adjust your UI based on whether or not the route matches. Here we're adding an `active` class if the route matches

```js
<ul>
  <ListItemLink to="/somewhere"/>
  <ListItemLink to="/somewhere-else"/>
</ul>

const ListItemLink = ({ to, ...rest }) => (
  <Route path={to} children={({ match }) => (
    <li className={match ? 'active' : ''}>
      <Link to={to} {...rest}/>
    </li>
  )}/>
)
```

This could also be useful for animations:

```js
<Route children={({ match, ...rest }) => (
  {/* Animate will always render, so you can use lifecycles
      to animate its child in and out */}
  <Animate>
    {match && <Something {...rest}/>}
  </Animate>
)}/>
```

**Warning:** Both `<Route component>` and `<Route render>` take precendence over `<Route children>` so don't use more than one in the same `<Route>`.

## path: string

Any valid URL path that [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp) understands.

```js
<Route path="/users/:id" component={User}/>
```

Routes without a `path` _always_ match.

## exact: bool

When `true`, will only match if the path matches the `location.pathname` _exactly_.

```js
<Route exact path="/one" component={About}/>
```

| path | location.pathname | exact | matches? |
| --- | --- | --- | --- |
| `/one`  | `/one/two`  | `true` | no |
| `/one`  | `/one/two`  | `false` | yes |

## strict: bool

When `true`, a `path` that has a trailing slash will only match a `location.pathname` with a trailing slash. This has no effect when there are additional URL segments in the `location.pathname`.

```js
<Route strict path="/one/" component={About}/>
```

| path | location.pathname | matches? |
| --- | --- | --- |
| `/one/` | `/one` | no |
| `/one/` | `/one/` | yes |
| `/one/` | `/one/two` | yes |

**Warning:** `strict` can be used to enforce that a `location.pathname` has no trailing slash, but in order to do this both `strict` and `exact` must be `true`.

```js
<Route exact strict path="/one" component={About}/>
```

| path | location.pathname | matches? |
| --- | --- | --- |
| `/one` | `/one` | yes |
| `/one` | `/one/` | no |
| `/one` | `/one/two` | no |

## location: object

A `<Route>` element tries to match its `path` to the current history location (usually the current browser URL).
However, a [`location`](location.md) with a different `pathname` can also be passed for matching.

This is useful in cases when you need to match a `<Route>` to a location other than the current history location, as shown in the [Animated Transitions](https://reacttraining.com/react-router/web/example/animated-transitions) example.

If a `<Route>` element is wrapped in a `<Switch>` and matches the location passed to the `<Switch>` (or the current history location), then the `location` prop passed to `<Route>` will be overridden by the one used by the `<Switch>` (given [here](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/modules/Switch.js#L51)).
