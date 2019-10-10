# Quick Start

To get started with React Router in a web app, you'll need a React web app. If you need to create one, we recommend you try [Create React App](https://github.com/facebook/create-react-app). It's a popular tool that works really well with React Router.

First, install `create-react-app` and make a new project with it.

```sh
npm install -g create-react-app
create-react-app demo-app
cd demo-app
```

## Installation

You can install React Router from [the public npm registry](https://npm.im/react-router-dom) with either `npm` or [`yarn`](https://yarnpkg.com). Since we're building a web app, we'll use `react-router-dom` in this guide.

```sh
npm install react-router-dom
```

Next, copy/paste either of the following examples into `src/App.js`.

## 1st Example: Basic Routing

In this example we have 3 "pages" handled by the router: a home page, an about page, and a users page. As you click around on the different `<Link>`s, the router renders the matching `<Route>`.

Note: Behind the scenes a `<Link>` renders an `<a>` with a real `href`, so people using the keyboard for navigation or screen readers will still be able to use this app.

```jsx
import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

export default function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/users">Users</Link>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/users">
            <Users />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function Home() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

function Users() {
  return <h2>Users</h2>;
}
```

## 2nd Example: Nested Routing

This example shows how nested routing works. The route `/topics` loads the `Topics` component, which renders any further `<Route>`'s conditionally on the paths `:id` value.

```jsx
import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";

export default function App() {
  return (
    <Router>
      <div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/topics">Topics</Link>
          </li>
        </ul>

        <Switch>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/topics">
            <Topics />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function Home() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

function Topics() {
  let match = useRouteMatch();

  return (
    <div>
      <h2>Topics</h2>

      <ul>
        <li>
          <Link to={`${match.url}/components`}>Components</Link>
        </li>
        <li>
          <Link to={`${match.url}/props-v-state`}>
            Props v. State
          </Link>
        </li>
      </ul>

      {/* The Topics page has its own <Switch> with more routes
          that build on the /topics URL path. You can think of the
          2nd <Route> here as an "index" page for all topics, or
          the page that is shown when no topic is selected */}
      <Switch>
        <Route path={`${match.path}/:topicId`}>
          <Topic />
        </Route>
        <Route path={match.path}>
          <h3>Please select a topic.</h3>
        </Route>
      </Switch>
    </div>
  );
}

function Topic() {
  let { topicId } = useParams();
  return <h3>Requested topic ID: {topicId}</h3>;
}
```

## Keep Going!

Hopefully these examples give you a feel for what it's like to create a web app with React Router. Keep reading to learn more about [the primary components](primary-components.md) in React Router!
