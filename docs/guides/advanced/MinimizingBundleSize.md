# Minimizing Bundle Size

For convenience, React Router exposes its full API on the top-level `react-router` import. However, this causes the entire React Router library and its dependencies to be included in client bundles that include code that makes any imports from the top-level CommonJS bundle.

There are two options for minimizing client bundle size by excluding unused modules.


## Import from `react-router/lib`

Bindings exported from `react-router` are also available in `react-router/lib`. When using CommonJS models, you can import directly from `react-router/lib` to avoid pulling in unused modules.

Assuming you are transpiling ES2015 modules into CommonJS modules, instead of

```js
import { Link, Route, Router } from 'react-router'
```

use

```js
import Link from 'react-router/lib/Link'
import Route from 'react-router/lib/Route'
import Router from 'react-router/lib/Router'
```

The public API available in this manner is defined as the set of imports available from the top-level `react-router` module. Anything not available through the top-level `react-router` module is a private API, and is subject to change without notice.


## Use a Bundler with ES2015 Module Support

React Router offers a ES2015 module build under `es6/` and defines a `jsnext:main` entry point. If you are using a bundler that supports ES2015 modules and tree-shaking such as webpack 2 or Rollup, you can directly import from `react-router`, as long as you are correctly resolving to the ES2015 module build.
