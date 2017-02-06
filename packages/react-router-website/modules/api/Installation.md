# Installation {id=installation}

React Router runs in multiple environments: browsers, servers, native, and even VR (works in the dev preview!) While many components are shared (like `Route`) others are specific to environment (like `NativeRouter`).  Rather than requiring you install two packages, you only have to install the package for the target environment. Any shared components between the environments are re-exported from the environment specific package.

## Web {id=installationweb}

```bash
npm install react-router-dom@next
# or
yarn add react-router-dom@next
```

All of the package modules can be imported from the top:

```js
import {
  BrowserRouter as Router,
  StaticRouter, // for server rendering
  Route,
  Link
  // etc.
} from 'react-router-dom'
```

If you're going for a really minimal bundle sizes on the web you can import modules directly. Theoretically a tree-shaking bundler like Webpack makes this unnecessary but we haven't tested it yet. We welcome you to!

```js
import Router from 'react-router-dom/BrowserRouter'
import Route from 'react-router-dom/Route'
// etc.
```

## Native {id=installation.native}

We're still working on great documentation for the native capabilities of React Router. For now we recommend you [read the source](https://github.com/ReactTraining/react-router/tree/v4/packages/react-router-native).

```bash
yarn add react-router-native@next
# or if not using the react-native cli
npm install react-router-native@next
```

All of the package modules can be imported from the top:

```js
import {
  NativeRouter as Router,
  DeepLinking,
  AndroidBackButton,
  Link,
  Route
  // etc.
} from 'react-router-native'
```

## Who-knows-where {id=installation.who-knows-where}

```bash
yarn add react-router@next
# or if not using the react-native cli
npm install react-router@next
```

All of the package modules can be imported from the top:

```js
import {
  MemoryRouter as Router,
  Route
  // etc.
} from 'react-router'
```

You can use React Router's navigation anywhere you run React, the navigation state is kept in a memory router. You can look at the implementation of NativeRouter to get an idea on how to integrate.
