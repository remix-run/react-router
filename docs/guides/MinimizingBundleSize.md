# Minimizing Bundle Size

For convenience, One App Router exposes its full API on the top-level `@americanexpress/one-app-router` import. However, this causes the entire One App Router library and its dependencies to be included in client bundles that include code that imports from the top-level CommonJS bundle.

Instead, the bindings exported from `@americanexpress/one-app-router` are also available in `@americanexpress/one-app-router/lib`. When using CommonJS modules, you can import directly from `@americanexpress/one-app-router/lib` to avoid pulling in unused modules.

Assuming you are transpiling ES2015 modules into CommonJS modules, instead of:

```js
import { Link, Route, Router } from '@americanexpress/one-app-router'
```

use:

```js
import Link from '@americanexpress/one-app-router/lib/Link'
import Route from '@americanexpress/one-app-router/lib/Route'
import Router from '@americanexpress/one-app-router/lib/Router'
```

The public API available in this manner is defined as the set of imports available from the top-level `@americanexpress/one-app-router` module. Anything not available through the top-level `@americanexpress/one-app-router` module is a private API, and is subject to change without notice.
