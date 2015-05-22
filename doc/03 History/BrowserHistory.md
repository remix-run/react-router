API is described in [Histories][Histories].

Uses the Browser history API to create real URLs. We recommend you use
this history. It has better looking URLs and is required for picking up
a server rendered app in the browser.

**You must configure your server when using `BrowserHistory`**

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

`BrowserHistory` falls back to an internal history called
`RefreshHistory` when the broweser history API isn't supported. When
the history transitions, the user gets a full page reload, instead of
client side routing.

> Why don't you just fall back to `HashLocation`?

Because we'd end up with multiple urls for the same UI, and as users
with different location support share urls they become non-deterministic
for the router to switch back and forth.

Additionally, many `HistoryLocation` apps will want to take advantage of
what the hash is actually intended for: linking to specific elements in
the page. We don't want to break this valuable feature of the web.

Example
-------

```js
import { BrowserHistory, Router } from 'react-router';
import routes from './routes';

React.render((
  <BrowserHistory>
    <Router routes={routes}/>
  </BrowserHistory>
), document.body);
```

  [Histories]:#TODO

