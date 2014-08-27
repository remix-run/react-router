API: `Router`
=============

The main export, `Router`, contains several methods that may be used to
navigate around the application.

```js
// cjs modules
var Router = require('react-router')

// or global build
window.ReactRouter
```

Methods
-------

### `transitionTo(routeNameOrPath, [params[, query]])`

Programmatically transition to a new route.

#### Examples

```js
Router.transitionTo('user', {id: 10}, {showAge: true});
Router.transitionTo('about');
Router.transitionTo('/users/10?showAge=true');
```

### `replaceWith(routeNameOrPath, [params[, query]])`

Programmatically replace current route with a new route. Does not add an
entry into the browser history.

#### Examples

```js
Router.replaceWith('user', {id: 10}, {showAge: true});
Router.replaceWith('about');
Router.replaceWith('/users/10?showAge=true');
```

### `goBack()`

Programmatically go back to the last route and remove the most recent
entry from the browser history.

#### Example

```js
Router.goBack();
```

### `makeHref(routeName, params, query)`

Creates an `href` to a route. Use this along with `ActiveState` when you
need to build components similar to `Link`.

#### Example

```js
// given a route like this:
<Route name="user" path="users/:userId"/>
Router.makeHref('user', {userId: 123}); // "users/123"
```

### `renderRoutesToString(routes, path)`

* `routes` is the `<Routes/>` component
* `path` is the full path with query string

Returns a Promise resolving with a `data` object:

```js
{
	html: string
}
```

* `html` is the string returned from React.renderComponentToString

The Promise may reject with an error. If this error has a `httpStatus`
302 and `location` it should be sent to the client for redirect.

#### Example

```js
Router.renderRoutesToString(routes, path).then(function (data) {
  //merge a template with `data.html`

  res.send(html);

}).catch(function (error){
  //if error is from a `<Redirect />` route.
  if (error.httpStatus == 302) {
    return res.redirect(error.location);
  }

  //else pass error to server error handler.
  res.send(error);
});
```

### `renderRoutesToStaticMarkup(routes, path)`

Same as `renderRoutesToString` except it uses 
`React.renderComponentToStaticMarkup`.
However, the resulting `data.html` will not contain the `initalData` 
to be sent to the client.

```js
Router.renderRoutesToStaticMarkup(routes, path).then(function (data) {
  //merge a template with `data.html`

  res.send(html);

}).catch(function (error){
  //if error is from a `<Redirect />` route.
  if (error.httpStatus == 302) {
    return res.redirect(error.location);
  }

  //else pass error to server error handler.
  res.send(error);
});
```
