# Add React Router to a Website

There are a few different ways to get React Router running on your website,
depending mostly on what the rest of your stack looks like. This document
describes the most common ways people use React Router.

- [Quick Install](#quick-install)
- [create-react-app](#create-react-app)
- [Webpack](#webpack)
- [Parcel](#parcel)

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

To add React Router to a
[create-react-app](https://github.com/facebook/create-react-app) project, you
can use [yarn](https://yarnpkg.com).

```
$ yarn add react-router@6 react-router-dom@6
```

Then, in `src/App.js` just import the pieces you need.

```js
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div>...</div>
    </BrowserRouter>
  );
}
```

## Webpack

In order to add React Router to a [Webpack](https://webpack.js.org) project,
you'll first need to install it to your local `node_modules` directory using a
JavaScript package manager. The following instructions use
[npm](https://npmjs.org), but [yarn](https://yarnpkg.com) is also a popular
choice.

```
$ npm install react-router@6 react-router-dom@6
```

Then just `import` and use as you would anything else.

## Parcel

TODO
