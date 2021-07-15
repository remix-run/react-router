<a name="top"></a>

# Add React Router to a Website

There are a few different ways to get React Router running on your website, depending mostly on what the rest of your stack looks like. This document describes the most common ways people use React Router.

The version of React Router for websites is contained in [the `react-router-dom` package](https://npm.im/react-router-dom). `react-router-dom` has a few peer dependencies which you'll also need, namely:

- [react](https://npm.im/react)
- [react-dom](https://npm.im/react-dom)
- [history](https://npm.im/history)

But don't worry; the various installation methods in this guide include all the dependencies you'll need. Just pick one of the following:

- [Quick Install](#quick-install)
- [Install with a Package Manager](#install-with-a-package-manager)
- [Create React App](#create-react-app)
- [Parcel](#parcel)
- [Webpack](#webpack)

<a name="quick-install"></a>

## Quick Install

One of the quickest ways to add React and React Router to a website is to use
good ol' `<script>` tags and global variables. React Router is compatible with
React 16.8+. Just add the following `<script>` tags to your HTML, just before
the closing `</body>` tag:

```html
  <!-- Other HTML for your app goes here -->

  <!-- The node we will use to put our app in the document -->
  <div id="root"></div>

  <!-- Note: When deploying to production, replace "development.js"
       with "production.min.js" in each of the following tags -->

  <!-- Load React and React DOM -->
  <!-- See https://reactjs.org/docs/add-react-to-a-website.html to learn more -->
  <script src="https://unpkg.com/react@>=16.8/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@>=16.8/umd/react-dom.development.js" crossorigin></script>

  <!-- Load history -->
  <script src="https://unpkg.com/history@5/umd/history.development.js" crossorigin></script>

  <!-- Load React Router and React Router DOM -->
  <script src="https://unpkg.com/react-router@6/umd/react-router.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-router-dom@6/umd/react-router-dom.development.js" crossorigin></script>

  <!-- A simple example app -->
  <script>
  var e = React.createElement;
  var Router = ReactRouterDOM.BrowserRouter;
  var Routes = ReactRouterDOM.Routes;
  var Route = ReactRouterDOM.Route;

  ReactDOM.render(
    (
      e(Router, null, (
        e(Routes, null, (
          e(Route, {
            element: e('div', null, 'Hello, React Router!')
          })
        ))
      ))
    ),
    document.getElementById('root')
  );
  </script>

</body>
```

Although this method is a nice way to get up and running quickly, it does load some code that you may not make use of in your app. React Router is designed as a collection of many small components and functions that allow you to use as little of the library as you actually need.

In order to do this, you'll need to build your website with a JavaScript bundler like [Webpack](#webpack) or [Parcel](#parcel). The rest of the installation methods on this page describe how to get started using these tools.

<a name="install-with-a-package-manager"></a>

## Install with a Package Manager

Before using a bundler for your project, you'll first need to install React Router to your local `node_modules` directory using a JavaScript package manager. The following instructions use [npm](https://www.npmjs.com/), but [Yarn](https://yarnpkg.com/) is also a popular choice.

```sh
$ npm install history@5 react-router-dom@6
```

<a name="create-react-app"></a>

## Create React App

Follow the instructions in the [React documentation to set up a new project with Create React App](https://reactjs.org/docs/create-a-new-react-app.html#create-react-app), then follow [the instructions above](#install-with-a-package-manager) to install React Router in your project.

Once your project is set up and React Router is installed as a dependency, open the `src/index.js` in your text editor. Import `BrowserRouter` from `react-router-dom` near the top of your file.

```diff
import React from 'react';
import ReactDOM from 'react-dom';
+ import { BrowserRouter as Router } from "react-router-dom";
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
```

To make sure your app has the necessary context to handle state and logic controlled by React Router, you need to wrap the entire app inside [the `BrowserRouter` component](../api-reference.md#browserrouter). Where `ReactDOM.render` is called to load your app, update the first argument so that `<App />` is nested accordingly:

```diff
- ReactDOM.render(<App />, document.getElementById('root'));
+ ReactDOM.render(
+   <Router>
+     <App />
+   </Router>,
+   document.getElementById('root')
+ );
```

Now you can use React Router anywhere in your app! For a simple example, open `src/App.js` and replace the default markup with some routes:

```diff
import React from 'react';
+ import { Routes, Route, Link } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div className="App">
-     <header className="App-header">
-       <img src={logo} className="App-logo" alt="logo" />
-       <p>
-         Edit <code>src/App.js</code> and save to reload.
-       </p>
-       <a
-         className="App-link"
-         href="https://reactjs.org"
-         target="_blank"
-         rel="noopener noreferrer"
-       >
-         Learn React
-       </a>
-     </header>
+     <h1>Welcome to React Router!</h1>
+
+     <Routes>
+       <Route path="/" element={<Home />} />
+       <Route path="about" element={<About />} />
+     </Routes>
    </div>
  );
}
```

Now, still in `src/App.js`, create your route components:

```js
// App.js
function Home() {
  return (
    <React.Fragment>
      <main>
        <h2>Welcome to the homepage!</h2>
        <p>You can do this, I believe in you.</p>
      </main>
      <nav>
        <Link to="/about">About</Link>
      </nav>
    </React.Fragment>
  );
}

function About() {
  return (
    <React.Fragment>
      <main>
        <h2>Who are we?</h2>
        <p>That feels like an existential question, don't you think?</p>
      </main>
      <nav>
        <Link to="/">Home</Link>
      </nav>
    </React.Fragment>
  );
}
```

Now start your app by running `npm start`, and you should see the `Home` route when your app starts runinng. Click the `About` link to see your `About` route, and voila! You successfully set up React Router using Create React App! 🥳

When it's time to deploy your app to production, be sure to follow [Create React App's instructions](https://create-react-app.dev/docs/deployment#serving-apps-with-client-side-routing) on deploying with React Router to be sure your server is configured correctly.

<a name="parcel"></a>

## Parcel

Follow the instructions in the [Parcel documentation to set up a new project](https://parceljs.org/getting_started.html), then follow [the instructions above](#install-with-a-package-manager) to install React Router in your project. You will also need to install `react`, `react-dom` and `@babel/preset-react`.

```sh
$ npm install parcel-bundler history@5 react-router-dom@6 react react-dom @babel/preset-react
```

In your project's `package.json`, add a `start` script so you can open your project in a browser during development.

```diff
"scripts": {
+  "start": "parcel index.html"
}
```

Once the project is set up and your dependencies are installed, create a new `.babelrc` file at the root of your project:

```
{
  "presets": ["@babel/preset-react"]
}
```

Go to the `index.js` file in your project and import the necessary functions from `react`, `react-dom`, and `react-router-dom`:

```js
// index.js
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App.js";
```

Now mount a React app in a `div` with the ID of `root`:

```js
// index.js
ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById("root")
);
```

In your `index.html`, create the root div in the document body above the script tag. It's also helpful to provide a `noscript` fallback message for users who may disabled JavaScript, unless you plan on server-rendering your app later.

```diff
<!-- index.html -->
<body>
+	<noscript>You need to enable JavaScript to run this app.</noscript>
+	<div id="root"></div>
	<script src="./index.js"></script>
</body>
```

Now that React and React Router are set up, create your app component and a few routes. Create a new file `App.js` and import the following:

```js
// App.js
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
```

Define your app and route components:

```js
// App.js
function App() {
  return (
    <div>
      <header>
        <h1>Welcome to React Router!</h1>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="about" element={<About />} />
      </Routes>
    </div>
  );
}

function Home() {
  return (
    <React.Fragment>
      <main>
        <h2>Welcome to the homepage!</h2>
        <p>You can do this, I believe in you.</p>
      </main>
      <nav>
        <Link to="/about">About</Link>
      </nav>
    </React.Fragment>
  );
}

function About() {
  return (
    <React.Fragment>
      <main>
        <h2>Who are we?</h2>
        <p>That feels like an existential question, don't you think?</p>
      </main>
      <nav>
        <Link to="/">Home</Link>
      </nav>
    </React.Fragment>
  );
}

export default App;
```

Now start your app by running `npm start`, and you should see the `Home` route when your app starts runinng. Click the `About` link to see your `About` route, and voila! You successfully set up React Router using Parcel! 🥳

<a name="webpack"></a>

## Webpack

Follow the instructions in the [webpack documentation to set up a new project](https://webpack.js.org/guides/getting-started/), then follow [the instructions above](#install-with-a-package-manager) to install React Router in your project.

Setting up a new React project in webpack is a bit more involved than Parcel or Create React App. Because webpack is a low-level tool that allows you to fine-tune your build to your liking, you may want to read the [webpack documentation](https://webpack.js.org/) or check out [webpack configurations in other repos](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/webpack.config.js) to understand how to build your own.

Once you have webpack configured and working with React, you can install the dependencies needed for React Router:

```sh
$ npm install history@5 react-router-dom@6
```

Then, somewhere in your code (probably towards the root of your React component tree) you'll want to `import` the pieces you need from `react-router-dom`.

```js
import { BrowserRouter as Router } from "react-router-dom";

function App() {
  return (
    <Router>
      <div>
        <h1>Hello, React Router!</h1>

        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}
```
