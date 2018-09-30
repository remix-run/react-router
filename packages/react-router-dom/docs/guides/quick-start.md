# Quick Start

The easiest way to get started with a React web project is with a tool called [Create React App][crapp], a Facebook project with a ton of community help.

First install create-react-app if you don't already have it, and then
make a new project with it.

```sh
npm install -g create-react-app
create-react-app demo-app
cd demo-app
```

## Installation

React Router DOM is [published to npm](https://npm.im/react-router-dom) so you can install it with either `npm` or [`yarn`](https://yarnpkg.com). Create React App uses yarn, so that's what we'll use.

```sh
yarn add react-router-dom
# or, if you're not using yarn
npm install react-router-dom
```

Now you can copy/paste any of the examples into `src/App.js`. Here's the
basic one:

```jsx
import React from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
);

const About = () => (
  <div>
    <h2>About</h2>
  </div>
);

const Topic = ({ match }) => (
  <div>
    <h3>{match.params.topicId}</h3>
  </div>
);

const Topics = ({ match }) => (
  <div>
    <h2>Topics</h2>
    <ul>
      <li>
        <Link to={`${match.url}/rendering`}>Rendering with React</Link>
      </li>
      <li>
        <Link to={`${match.url}/components`}>Components</Link>
      </li>
      <li>
        <Link to={`${match.url}/props-v-state`}>Props v. State</Link>
      </li>
    </ul>

    <Route path={`${match.path}/:topicId`} component={Topic} />
    <Route
      exact
      path={match.path}
      render={() => <h3>Please select a topic.</h3>}
    />
  </div>
);

const BasicExample = () => (
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

      <hr />

      <Route exact path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/topics" component={Topics} />
    </div>
  </Router>
);
export default BasicExample;
```

Now you're ready to tinker. Happy routing!

[crapp]: https://github.com/facebookincubator/create-react-app
