# match

A `match` object contains information about how a `<Route path>` matched the URL. `match` objects may contain the following properties:

  - `params` - (object) Key/value pairs parsed from the URL corresponding to the dynamic segments of the path
  - `isExact` - `true` if the entire URL was matched (no trailing characters)
  - `path` - (string) The path pattern used to match. Useful for building nested `<Route>`s
  - `url` - (string) The matched portion of the URL. Useful for building nested `<Link>`s

The majority of the time you can get a `match` object as a prop to your [`<Route component>`](Route.md#component-func) or in your [`<Route render>`](Route.md#render-func) callback, so you shouldn't need to manually generate them.

However, you may find it useful to manually calculate the match if you have a pre-determined route config that you'd like to traverse in order to know which routes match. In that case, we also export our `matchPath` function so you can use it to match just like we do internally.

```js
import { matchPath } from 'react-router'

const match = matchPath('/the/pathname', '/the/:dynamicId', {
  exact: true,
  strict: false
})
```
