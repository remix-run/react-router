# Quick Start

You'll need a React web app to add `react-router`.

If you need to create one, the popular tool [Create React App][crapp] can get you started quickly. Calling `npx create-react-app <app-name>` will create an application and install its dependencies for you.

```sh
npx create-react-app demo-app
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

const Index = () => <h2>Home</h2>;
const About = () => <h2>About</h2>;
const Users = () => <h2>Users</h2>;

const AppRouter = () => (
  <Router>
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about/">About</Link>
        <Link to="/users/">Users</Link>
      </nav>

      <Route path="/" exact component={Index} />
      <Route path="/about/" component={About} />
      <Route path="/users/" component={Users} />
    </div>
  </Router>
);

export default AppRouter;
```

## Example: Nested Routing

This example shows how nested routing works. The route `/topics` loads the `Topics` component, which renders any further `<Route>`'s conditionally on the paths `:id` value.

```jsx
import React from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

const App = () => (
  <Router>
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/topics">Topics</Link>
      </nav>

      <Route exact path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/topics" component={Topics} />
    </div>
  </Router>
);

const Home = () => <h2>Home</h2>;
const About = () => <h2>About</h2>;
const Topic = ({ match }) => <h3>Requested Param: {match.params.id}</h3>;
const Topics = ({ match }) => (
  <div>
    <h2>Topics</h2>

    <nav>
      <Link to={`${match.url}/components`}>Components</Link>
      <Link to={`${match.url}/props-v-state`}>Props v. State</Link>
    </nav>

    <Route path={`${match.path}/:id`} component={Topic} />
    <Route
      exact
      path={match.path}
      render={() => <h3>Please select a topic.</h3>}
    />
  </div>
);

export default App;
```

Now you're ready to tinker. Happy routing!

[crapp]: https://github.com/facebookincubator/create-react-app
