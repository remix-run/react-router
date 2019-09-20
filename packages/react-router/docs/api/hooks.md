# Hooks

React Router ships with a few hooks that let you access the state of the router in your components.

- [`useHistory`](#usehistory)
- [`useLocation`](#uselocation)
- [`useParams`](#useparams)
- [`useRouteMatch`](#useroutematch)

<a id="usehistory" />

## `useHistory`

The `useHistory` hook gives you access to the [`history`](./history.md) instance that you may use to navigate.

```jsx
import { useHistory } from "react-router"

function HomeButton() {
  let history = useHistory()

  function handleClick() {
    history.push("/home")
  }

  return (
    <button type="button" onClick={handleClick}>
      Go home
    </button>
  )
}
```

<a id="uselocation" />

## `useLocation`

The `useLocation` hook returns the [`location`](./location.md) object that represents the current URL. You can think about it like a `useState` that returns a new `location` whenever the URL changes.

This could be really useful e.g. in a situation where you would like to trigger a new "page view" event using your web analytics tool whenever a new page loads, as in the following example:

```jsx
import React from "react"
import ReactDOM from "react-dom"
import { BrowserRouter as Router, Switch, useLocation } from "react-router"

function usePageViews() {
  let location = useLocation()
  React.useEffect(() => {
    ga.send(["pageview", location.pathname])
  }, [location])
}

function App() {
  usePageViews()
  return <Switch>...</Switch>
}

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  node
)
```

<a id="useparams" />

## `useParams`

`useParams` returns an object of key/value pairs of URL parameters. Use it to access `match.params` of the current `<Route>`.

```jsx
import React from "react"
import ReactDOM from "react-dom"
import { BrowserRouter as Router, Switch, Route, useParams } from "react-router"

function BlogPost() {
  let { slug } = useParams()
  return <div>Now showing post {slug}</div>
}

ReactDOM.render(
  <Router>
    <Switch>
      <Route exact path="/">
        <HomePage />
      </Route>
      <Route path="/blog/:slug">
        <BlogPost />
      </Route>
    </Switch>
  </Router>,
  node
)
```

## `useRouteMatch`

The `useRouteMatch` hook attempts to [match](./match.md) the current URL in the same way that a `<Route>` would. It's mostly useful for getting access to the match data without actually rendering a `<Route>`.

Now, instead of

```jsx
function BlogPost() {
  return (
    <Route
      path="/blog/:slug"
      render={({ match }) => {
        // Do whatever you want with the match ...
        return <div />
      }}
    />
  )
}
```

you can just

```jsx
function BlogPost() {
  let match = useMatch("/blog/:slug")
  // Do whatever you want with the match...
}
```
