# Quick Start

You'll need a React web app to add `react-router`.

If you need to create one, the easiest way to get started is with a popular tool called [Create React App][crapp].

First install `create-react-app`, if you don't already have it, and then make a new project with it.

```sh
npm install -g create-react-app
create-react-app demo-app
cd demo-app
```

## Installation

React Router DOM is [published to npm](https://npm.im/react-router-dom) so you can install it with either `npm` or [`yarn`](https://yarnpkg.com).

```sh
npm install react-router-dom
```

Copy/paste either of the examples (below) into your `src/App.js`.

## Example: Basic Routing

In this example we have 3 'Page' Components handled by the `<Router>`.

Note: Instead of `<a href="/">` we use `<Link to="/">`.

```jsx
import React from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

function Index() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

function Users() {
  return <h2>Users</h2>;
}

function AppRouter() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about/">About</Link>
            </li>
            <li>
              <Link to="/users/">Users</Link>
            </li>
          </ul>
        </nav>

        <Route path="/" exact component={Index} />
        <Route path="/about/" component={About} />
        <Route path="/users/" component={Users} />
      </div>
    </Router>
  );
}

export default AppRouter;
```

## Example: Nested Routing

This example shows how nested routing works. The route `/topics` loads the `Topics` component, which renders any further `<Route>`'s conditionally on the paths `:id` value.

```jsx
import React from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

function App() {
  return (
    <Router>
      <div>
        <Header />

        <Route exact path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/topics" component={Topics} />
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

function Topic({ match }) {
  return <h3>Requested Param: {match.params.id}</h3>;
}

function Topics({ match }) {
  return (
    <div>
      <h2>Topics</h2>

      <ul>
        <li>
          <Link to={`${match.url}/components`}>Components</Link>
        </li>
        <li>
          <Link to={`${match.url}/props-v-state`}>Props v. State</Link>
        </li>
      </ul>

      <Route path={`${match.path}/:id`} component={Topic} />
      <Route
        exact
        path={match.path}
        render={() => <h3>Please select a topic.</h3>}
      />
    </div>
  );
}

function Header() {
  return (
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
  );
}

export default App;
```

Now you're ready to tinker. Happy routing!

[crapp]: https://github.com/facebook/create-react-app
