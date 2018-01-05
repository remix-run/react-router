# Basic Components

There are three types of components in React Router: router components, route matching components, and navigation components.

All of the components that you use in a web application should be imported from `react-router-dom`.

```js
import { BrowserRouter, Route, Link } from 'react-router-dom'
```

## Routers

At the core of every React Router application should be a router component. For web projects, `react-router-dom` provides `<BrowserRouter>` and `<HashRouter>` routers. Both of these will create a specialized `history` object for you. Generally speaking, you should use a `<BrowserRouter>` if you have a server that responds to requests and a `<HashRouter>` if you are using a static file server.

```jsx
import { BrowserRouter } from 'react-router-dom'
ReactDOM.render((
  <BrowserRouter>
    <App/>
  </BrowserRouter>
), holder)
```

## Route Matching

There are two route matching components: `<Route>` and `<Switch>`.

```js
import { Route, Switch } from 'react-router-dom'
```

Route matching is done by comparing a `<Route>`'s `path` prop to the current location's `pathname`. When a `<Route>` matches it will render its content and when it does not match, it will render `null`. A `<Route>` with no path will always match.

```jsx
// when location = { pathname: '/about' }
<Route path='/about' component={About}/> // renders <About/>
<Route path='/contact' component={Contact}/> // renders null
<Route component={Always}/> // renders <Always/>
```

You can include a `<Route>` anywhere that you want to render content based on the location. It will often make sense to list a number of possible `<Route>`s next to each other. The `<Switch>` component is used to group `<Route>`s together.

```jsx
<Switch>
  <Route exact path='/' component={Home}/>
  <Route path='/about' component={About}/>
  <Route path='/contact' component={Contact}/>
</Switch>
```

The `<Switch>` is not required for grouping `<Route>`s, but it can be quite useful. A `<Switch>` will iterate over all of its children `<Route>` elements and only render the first one that matches the current location. This helps when multiple route's paths match the same pathname, when animating transitions between routes, and in identifying when no routes match the current location (so that you can render a "404" component).

```jsx
<Switch>
  <Route exact path='/' component={Home}/>
  <Route path='/about' component={About}/>
  <Route path='/contact' component={Contact}/>
  {/* when none of the above match, <NoMatch> will be rendered */}
  <Route component={NoMatch}/>
</Switch>
```

## Route Rendering Props

You have three prop choices for how you render a component for a given `<Route>`: `component`, `render`, and `children`. You can check the out the [`<Route>` documentation](../api/Route.md) for more information on each one, but here we'll focus on `component` and `render` because those are the two you will almost always use.

`component` should be used when you have an existing component (either a `React.Component` or a stateless functional component) that you want to render. `render`, which takes an inline function, should only be used when you have to pass in-scope variables to the component you want to render. You should **not** use the `component` prop with an inline function to pass in-scope variables because you will get undesired component unmounts/remounts.

```jsx
const Home = () => <div>Home</div>

const App = () => {
  const someVariable = true;
  
  return (
    <Switch>
      {/* these are good */}
      <Route exact path='/' component={Home} />
      <Route
        path='/about'
        render={(props) => <About {...props} extra={someVariable} />}
      />
      {/* do not do this */}
      <Route
        path='/contact'
        component={(props) => <Contact {...props} extra={someVariable} />}
      />  
    </Switch>
  )
}
```

## Navigation

React Router provides a `<Link>` component to create links in your application. Wherever you render a `<Link>`, an anchor (`<a>`) will be rendered in your application's HTML.

```jsx
<Link to='/'>Home</Link>
// <a href='/'>Home</a>
```

The `<NavLink>` is a special type of `<Link>` that can style itself as "active" when its `to` prop matches the current location.

```jsx
// location = { pathname: '/react' }
<NavLink to='/react' activeClassName='hurray'>React</NavLink>
// <a href='/react' className='hurray'>React</a>
```

Any time that you want to force navigation, you can render a `<Redirect>`. When a `<Redirect>` renders, it will navigate using its `to` prop.

```jsx
<Redirect to='/login'/>
```
