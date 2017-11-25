# React Router Config

Static route configuration helpers for React Router.

This is alpha software, it needs:

1. Realistic server rendering example with data preloading
2. Pending navigation example

## Installation

Using [npm](https://www.npmjs.com/):

    $ npm install --save react-router-config

Then with a module bundler like [webpack](https://webpack.github.io/), use as you would anything else:

```js
// using an ES6 transpiler, like babel
import { matchRoutes, renderRoutes } from 'react-router-config'

// not using an ES6 transpiler
var matchRoutes = require('react-router-config').matchRoutes
```

The UMD build is also available on [unpkg](https://unpkg.com):

```html
<script src="https://unpkg.com/react-router-config/umd/react-router-config.min.js"></script>
```

You can find the library on `window.ReactRouterConfig`

## Motivation

With the introduction of React Router v4, there is no longer a centralized route configuration. There are some use-cases where it is valuable to know about all the app's potential routes such as:

- Loading data on the server or in the lifecycle before rendering the next screen
- Linking to routes by name
- Static analysis

This project seeks to define a shared format for others to build patterns on top of.

## Route Configuration Shape

Routes are objects with the same properties as a `<Route>` with a couple differences:

- the only render prop it accepts is `component` (no `render` or `children`)
- introduces the `routes` key for sub routes
- Consumers are free to add any additional props they'd like to a route, you can access `props.route` inside the `component`, this object is a reference to the object used to render and match.
- accepts `key` prop to prevent remounting component when transition was made from route with the same component and same `key` prop

```js
const routes = [
  { component: Root,
    routes: [
      { path: '/',
        exact: true,
        component: Home
      },
      { path: '/child/:id',
        component: Child,
        routes: [
          { path: '/child/:id/grand-child',
            component: GrandChild
          }
        ]
      }
    ]
  }
]
```

**Note**: Just like `<Route>`, relative paths are not (yet) supported. When it is supported there, it will be supported here.

## API

### `matchRoutes(routes, pathname)`

Returns an array of matched routes.

#### Parameters
- routes - the route configuration
- pathname - the [pathname](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/pathname) component of the url. This must be a decoded string representing the path.

```js
import { matchRoutes } from 'react-router-config'
const branch = matchRoutes(routes, '/child/23')
// using the routes shown earlier, this returns
// [
//   routes[0],
//   routes[0].routes[1]
// ]
```

Each item in the array contains two properties: `routes` and `match`.

- `routes`: A reference to the routes array used to match
- `match`: The match object that also gets passed to `<Route>` render methods.

```js
branch[0].match.url
branch[0].match.isExact
// etc.
```

You can use this branch of routes to figure out what is going to be rendered before it actually is rendered. You could do something like this on the server before rendering, or in a lifecycle hook of a component that wraps your entire app

```js
const loadBranchData = (location) => {
  const branch = matchRoutes(routes, location.pathname)

  const promises = branch.map(({ route, match }) => {
    return route.loadData
      ? route.loadData(match)
      : Promise.resolve(null)
  })

  return Promise.all(promises)
}

// useful on the server for preloading data
loadBranchData(req.url).then(data => {
  putTheDataSomewhereTheClientCanFindIt(data)
})

// also useful on the client for "pending navigation" where you
// load up all the data before rendering the next page when
// the url changes

// THIS IS JUST SOME THEORETICAL PSEUDO CODE :)
class PendingNavDataLoader extends Component {
  state = {
    previousLocation: null
  }

  componentWillReceiveProps(nextProps) {
    const navigated = nextProps.location !== this.props.location
    const { routes } = this.props

    if (navigated) {
      // save the location so we can render the old screen
      this.setState({
        previousLocation: this.props.location
      })

      // load data while the old screen remains
      loadNextData(routes, nextProps.location).then((data) => {
        putTheDataSomewhereRoutesCanFindIt(data)
        // clear previousLocation so the next screen renders
        this.setState({
          previousLocation: null
        })
      })
    }
  }

  render() {
    const { children, location } = this.props
    const { previousLocation } = this.state

    // use a controlled <Route> to trick all descendants into
    // rendering the old location
    return (
      <Route
        location={previousLocation || location}
        render={() => children}
      />
    )
  }
}

// wrap in withRouter
export default withRouter(PendingNavDataLoader)

/////////////
// somewhere at the top of your app
import routes from './routes'

<BrowserRouter>
  <PendingNavDataLoader routes={routes}>
    {renderRoutes(routes)}
  </PendingNavDataLoader>
</BrowserRouter>
```

Again, that's all pseudo-code. There are a lot of ways to do server rendering with data and pending navigation and we haven't settled on one. The point here is that `matchRoutes` gives you a chance to match statically outside of the render lifecycle. We'd like to make a demo app of this approach eventually.

### `renderRoutes(routes, extraProps = {}, switchProps = {})`

In order to ensure that matching outside of render with `matchRoutes` and inside of render result in the same branch, you must use `renderRoutes` instead of `<Route>` inside your components. You can render a `<Route>` still, but know that it will not be accounted for in `matchRoutes` outside of render.

```js
import { renderRoutes } from 'react-router-config'

const routes = [
  { component: Root,
    routes: [
      { path: '/',
        exact: true,
        component: Home
      },
      { path: '/child/:id',
        component: Child,
        routes: [
          { path: '/child/:id/grand-child',
            component: GrandChild
          }
        ]
      }
    ]
  }
]

const Root = ({ route }) => (
  <div>
    <h1>Root</h1>
    {/* child routes won't render without this */}
    {renderRoutes(route.routes)}
  </div>
)

const Home = ({ route }) => (
  <div>
    <h2>Home</h2>
  </div>
)

const Child = ({ route }) => (
  <div>
    <h2>Child</h2>
    {/* child routes won't render without this */}
    {renderRoutes(route.routes, { someProp: 'these extra props are optional' })}
  </div>
)

const GrandChild = ({ someProp }) => (
  <div>
    <h3>Grand Child</h3>
    <div>{someProp}</div>
  </div>
)


ReactDOM.render((
  <BrowserRouter>
    {/* kick it all off with the root route */}
    {renderRoutes(routes)}
  </BrowserRouter>
), document.getElementById('root'))

```

