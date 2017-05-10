# Code Splitting

One great feature of the web is that we don't have to make our visitors
download the entire app before they can use it. You can think of code splitting as incrementally downloading the app. While there are other tools for the job, we'll use [Webpack][Webpack] and the [bundle loader][bundle-loader] in this guide.

Here's the way the website you're using right now does code splitting: `<Bundle>`. What's most notable is that the router actually has nothing to do with this. When you're "at a route" that simply means "you're rendering a component". So we can make a component that loads dynamic imports as the user navigates to it. This approach works for any part of your app.

```js
import loadSomething from 'bundle-loader?lazy!./Something'

<Bundle load={loadSomething}>
  {(mod) => (
    // do something w/ the module
  )}
</Bundle>
```

If the module is a component, we can render it right there:

```jsx
<Bundle load={loadSomething}>
  {(Comp) => (Comp
    ? <Comp/>
    : <Loading/>
  )}
</Bundle>
```

This component takes a prop called `load` we get from the webpack [bundle loader][bundle-loader]. We'll talk about why we use that in a minute. When the component mounts or gets a new load prop, it will call `load`, then place the returned value in state. Finally, it calls back in render with the module.

```js
import React, { Component } from 'react'

class Bundle extends Component {
  state = {
    // short for "module" but that's a keyword in js, so "mod"
    mod: null
  }

  componentWillMount() {
    this.load(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.load !== this.props.load) {
      this.load(nextProps)
    }
  }

  load(props) {
    this.setState({
      mod: null
    })
    props.load((mod) => {
      this.setState({
        // handle both es imports and cjs
        mod: mod.default ? mod.default : mod
      })
    })
  }

  render() {
    return this.state.mod ? this.props.children(this.state.mod) : null
  }
}

export default Bundle
```

You'll notice that `render` calls back with a null `state.mod` on any
renders before the module has been fetched. This is important so you
can indicate to the user we're waiting for something.

**Why bundle loader, and not `import()`?**

We've been using it [for years][for-years] and it continues to work while TC39 continues to come up with an official dynamic import. The latest proposal is [`import()`][import], and we could adjust our `Bundle` component to use `import()` instead:

```jsx
<Bundle load={() => import('./something')}>
  {(mod) => ()}
</Bundle>
```

Another **HUGE** benefit of bundle loader is that the second time it calls back synchronously, which prevents flashing the loading screen every time you visit a code-split screen.

Regardless of the way you import, the idea is the same: a component that handles the code loading when it renders. Now all you do is render a `<Bundle>` wherever you want to load code dynamically.

## Loading after rendering is complete

The `Bundle` component is great for loading as you approach a new screen, but it's also beneficial to preload the rest of the app in the background.

```js
import loadAbout from 'bundle-loader?lazy!./loadAbout'
import loadDashboard from 'bundle-loader?lazy!./loadDashboard'

// components load their module for initial visit
const About = (props) => (
  <Bundle load={loadAbout}>
    {(About) => <About {...props}/>}
  </Bundle>
)

const Dashboard = (props) => (
  <Bundle load={loadDashboard}>
    {(Dashboard) => <Dashboard {...props}/>}
  </Bundle>
)

class App extends React.Component {
  componentDidMount() {
    // preloads the rest
    loadAbout(() => {})
    loadDashbaord(() => {})
  }

  render() {
    return (
      <div>
        <h1>Welcome!</h1>
        <Route path="/about" component={About}/>
        <Route path="/dashboard" component={Dashboard}/>
      </div>
    )
  }
}
```

When, and how much, of your app to load is your own decision. It need not be tied to specific routes. Maybe you only want to do it when the user is inactive, maybe only when they visit a route, maybe you want to preload the rest of the app after the initial render:

```js
ReactDOM.render(<App/>, preloadTheRestOfTheApp)
```

## Code-splitting + server rendering

We've tried and failed a couple of times. What we learned:

1. You need synchronous module resolution on the server so you can get those bundles in the initial render.
2. You need to load all the bundles in the client that were involved in the server render before rendering so that the client render is the same as the server render. (The trickiest part, I think its possible but this is where I gave up.)
3. You need asynchronous resolution for the rest of the client app's life.

We determined that google was indexing our sites well enough for our needs without server rendering, so we dropped it in favor of code-splitting + service worker caching. Godspeed those who attempt the server-rendered, code-split apps.

  [Webpack]:https://webpack.github.io/
  [import]:https://github.com/tc39/proposal-dynamic-import
  [bundle-loader]:https://github.com/webpack-contrib/bundle-loader
  [for-years]:https://github.com/ReactTraining/react-router/blob/9f43019b26ad625ce4673e6abf5aa0093d7a7ef4/package.json#L17
