# Minimizing Bundle Size

For convenience, React Router exposes its full API on the top-level `react-router` import. However, this causes the entire React Router library and its dependencies to be included in client bundles that include code that imports from the top-level CommonJS bundle.

Instead, the bindings exported from `react-router` are also available in `react-router/lib`. When using CommonJS models, you can import directly from `react-router/lib` to avoid pulling in unused modules.

Assuming you are transpiling ES2015 modules into CommonJS modules, instead of:

```js
import { Link, Route, Router } from 'react-router'
```

use:

```js
import Link from 'react-router/lib/Link'
import Route from 'react-router/lib/Route'
import Router from 'react-router/lib/Router'
```

The public API available in this manner is defined as the set of imports available from the top-level `react-router` module. Anything not available through the top-level `react-router` module is a private API, and is subject to change without notice.
