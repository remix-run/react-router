`HashHistory` is a [history][Histories] implementation for DOM environments that
uses `window.location.hash` to store the current path. This is essentially a hack
for older browsers (IE <= 9) that do not support the HTML5 history API.

For example, your urls will look like this: `https://example.com/#/courses/123`.

Query Params
------------

Query params in the portion of the URL before the `#` are completely
ignored with `HashHistory` because they are not part of the URL that
`HashHistory` manages. Query parameters after the `#` will work as
expected.

For example: ` http://example.com/?lang=es#/messages?sort=date`,
`lang=es` is invisible to a `HashHistory` router, but `sort=date` is
recognized, and will be used as the query parameters.

Example
-------

```js
import { Router } from 'react-router';
import HashHistory from 'react-router/lib/HashHistory';

React.render((
  <Router history={HashHistory}>
    {/* ... */}
  </Router>
), document.body);
```

  [Histories]:#TODO

