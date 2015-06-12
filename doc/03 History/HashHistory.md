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

Using location state
--------------------

`HashHistory` shims the `state` features of `window.history.pushState`,
but you have to opt-in because it puts a key in the URL and we didn't
want a bunch of issues opened about it :P

If you want to use the `location.state` features, opt-in. See the
examples.

Example
-------

Normal usage

```js
import { Router } from 'react-router';
import HashHistory from 'react-router/lib/HashHistory';

React.render((
  <Router history={HashHistory}>
    {/* ... */}
  </Router>
), document.body);
```

Opting in to the `state` features:

```js
// note the `{ ... }` syntax on the import
import { HashHistory } from 'react-router/lib/HashHistory';

// use the default key which is `_key`
var history = new HashHistory({ queryKey: true });

// use your own
var history = new HashHistory({queryKey: 'k'});

React.render((
  <Router history={history}>
    {/* ... */}
  </Router>
), document.body);
```

  [Histories]:#TODO

