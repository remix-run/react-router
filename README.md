# React Router [![Travis][build-badge]][build] [![npm package][npm-badge]][npm]

[build-badge]: https://img.shields.io/travis/ReactTraining/react-router/master.svg?style=flat-square
[build]: https://travis-ci.org/ReactTraining/react-router

[npm-badge]: https://img.shields.io/npm/v/react-router.svg?style=flat-square
[npm]: https://www.npmjs.org/package/react-router

<img src="/logo/Vertical@2x.png" height="150"/>

Declarative routing for [React](https://facebook.github.io/react).

React Router keeps your UI in sync with the URL. Make the URL your first thought, not an after-thought.

## Installation

Using [npm](https://www.npmjs.com/):

    $ npm install --save react-router@next

Then with a module bundler like [webpack](https://webpack.github.io/), use as you would anything else:

```js
// using an ES6 transpiler, like babel
import { BrowserRouter, Match, Link } from 'react-router'

// not using an ES6 transpiler
var BrowserRouter = require('react-router').BrowserRouter
var Match = require('react-router').Match
var Link = require('react-router').Link
```

The UMD build is also available on [unpkg](https://unpkg.com):

```html
<script src="https://unpkg.com/react-router@next/umd/react-router.min.js"></script>
```

You can find the library on `window.ReactRouter`.

## Docs

Please read [our docs here](https://react-router-website-uxmsaeusnn.now.sh/basic).

## Thanks

Thanks to [our sponsors](/SPONSORS.md) for supporting the development of React Router.

Also, thanks to [BrowserStack](https://www.browserstack.com/) for providing the infrastructure that allows us to run our build in real browsers.
