Uses the HTML5 history API to create real URLs. We recommend you use
this location. It has better looking URLs and is required for picking up
a server rendered app in the browser.

**You must configure your server to use `HistoryLocation`**

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

If you specify `HistoryLocation`, React Router will detect support and
fall back to `RefreshLocation` if `HistoryLocation` is not supported.

> Why don't you just fall back to `HashLocation`?

Because we'd end up with multiple urls for the same UI, and as users
with different location support share urls they become non-deterministic
for the router to switch back and forth.

Additionally, many `HistoryLocation` apps will want to take advantage of
what the hash is actually intended for: linking to specific elements in
the page. We don't want to break this valuable feature of the web.


