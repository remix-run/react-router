`BrowserHistory` is a [history][Histories] implementation for DOM environments that
support the HTML5 history API (pushState, replaceState, and the popstate event).
It provides the cleanest URLs and should always be used in browser
environments if possible.

You must configure your server when using `BrowserHistory`.

Configuring your server
-----------------------

When a visitor sends the url `/assignments/123` or `/settings` to your
app, they both must send your client application to the visitor.

Here's an example using express:

```js
app.get('*', function (req, res) {
  res.render('index');
});
```

This will route all requests to the `index` template rendered by your
server and then React Router will take over from there.

Fallback for browsers that don't support it
-------------------------------------------

`BrowserHistory` falls back to using full page refreshes when the browser
does not support the HTML5 history API.

> Why don't you just fall back to `HashHistory`?

Because we'd end up with multiple URLs for the same UI, and as users
with different location support share URLs they become non-deterministic
for the router to switch back and forth.

Additionally, many `BrowserHistory` apps will want to take advantage of
what the hash is actually intended for: linking to specific elements in
the page. We don't want to break this valuable feature of the web.

Example
-------

```js
import { Router } from 'react-router';
import BrowserHistory from 'react-router/lib/BrowserHistory';
var history = new BrowserHistory();

React.render((
  <Router history={ history }>
    {/* ... */}
  </Router>
), document.body);
```

  [Histories]:#TODO

