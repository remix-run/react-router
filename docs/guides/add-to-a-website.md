# Add React Router to a Website

There are a few different ways to get React Router running on your website,
depending mostly on what the rest of your stack looks like. This document
describes the most common ways people use React Router.

- Quick Install
- create-react-app
- Parcel
- Webpack

React Router has a single dependency, the `history` library, which is developed
and released alongside the router. All of the following methods will
automatically include this dependency.

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
  var Router = ReactRouterDOM.BrowserRouter;
  var Routes = ReactRouterDOM.Routes;
  var Route = ReactRouterDOM.Route;
  var root = document.getElementById('root');

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
    root
  );
  </script>

</body>
```

Although this method is a nice way to get up and running quickly, it does load
some code that you may not make use of in your app. React Router is designed as
a collection of many small components and functions that allow you to use as
little of the library as you actually need.

In order to do this, you'll need to build your website with a JavaScript bundler
like Webpack or Parcel. The rest of the installation methods on this page
describe how to get started using these tools.

## create-react-app

TODO

## Parcel

TODO

## Webpack

In order to add React Router to a [Webpack](#) project, you'll first need to install
it to your local `node_modules` directory using a JavaScript package manager.
The following instructions use [npm](#), but [yarn](#) is also a popular choice.

```
$ npm install history@5 react-router@6 react-router-dom@6
```

Then, somewhere in your code (probably towards the root of your React component tree)
you'll want to `import` the pieces you need from `react-router-dom`.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function Home() {
  return <div>This is the home page.</div>;
}

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
  )
}

ReactDOM.render(<App />, document.getElementById('root'));
```
