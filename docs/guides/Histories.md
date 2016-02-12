# Histories

React Router is built with [history](https://github.com/reactjs/history).
In a nutshell, a history knows how to listen to the browser's address
bar for changes and parses the URL into a `location` object that the
router can use to match routes and render the correct set of components.

There are three types of histories you'll come across most often, but
note that anyone can build a custom history implementation for
consumption with React Router.

- [`hashHistory`](#hashhistory)
- [`browserHistory`](#browserhistory)
- [`createMemoryHistory`](#creatememoryhistory)

You import them from the React Router package:

```js
// JavaScript module import
import { browserHistory } from 'react-router'
```

Then pass them into your `<Router>`:

```js
render(
  <Router history={browserHistory} routes={routes} />,
  document.getElementById('app')
)
```

### `hashHistory`
Hash history uses the hash (`#`) portion of the URL, creating routes that look like `example.com/#/some/path`.

#### Should I use `hashHistory`?
Hash history works without configuring your server, so if you're just getting started, go ahead and use it. But, we don't recommend using it in production, every web app should aspire to use `browserHistory`.

#### What is that `?_k=ckuvup` junk in the URL?
When a history transitions around your app with `push` or `replace`, it can store "location state" that doesn't show up in the URL on the new location, think of it a little bit like post data in an HTML form.

The DOM API that hash history uses to transition around is simply `window.location.hash = newHash`, with no place to store location state.  But, we want all histories to be able to use location state, so we shim it by creating a unique key for each location and then store that state in session storage. When the visitor clicks "back" and "forward" we now have a mechanism to restore the location state.

### `browserHistory`
Browser history is the recommended history for browser application with React Router. It uses the [History](https://developer.mozilla.org/en-US/docs/Web/API/History) API built into the browser to manipulate the URL, creating real URLs that look like `example.com/some/path`.

#### Configuring Your Server
Your server must be ready to handle real URLs. When the app first loads at `/` it will probably work, but as the user navigates around and then hits refresh at `/accounts/23` your web server will get a request to `/accounts/23`. You will need it to handle that URL and include your JavaScript application in the response.

An express app might look like this:

```js
const express = require('express')
const path = require('path')
const port = process.env.PORT || 8080
const app = express()

// serve static assets normally
app.use(express.static(__dirname + '/public'))

// handle every other route with index.html, which will contain
// a script tag to your application's JavaScript file(s).
app.get('*', function (request, response){
  response.sendFile(path.resolve(__dirname, 'public', 'index.html'))
})

app.listen(port)
console.log("server started on port " + port)
```

If you're using nginx, use the [`try_files` directive](http://nginx.org/en/docs/http/ngx_http_core_module.html#try_files):

```
server {
  ...
  location / {
    try_files $uri /index.html;
  }
}
```

This lets nginx serve static asset files and serves your `index.html` file when another file isn't found on the server.

There is also a similar approach for Apache servers. Create an `.htaccess` file in your folder's root:

```
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### IE8, IE9 Support
We feature detect to see if we can use the browser's native `window.history` API. If not, any call to transition around the app will result in _a full page reload_, which allows you to build your app and have a better experience for newer browsers, but still support old ones.

You might wonder why we don't fall back to hash history; the problem is that URLs become non-deterministic. If a visitor on hash history shares a URL with a visitor on browser history, and then they share that back, we end up with a terrible cartesian product of infinite potential URLs.

### `createMemoryHistory`
Memory history doesn't manipulate or read from the address bar. This is how we implement server rendering. It's also useful for testing and other rendering environments (like React Native).

Its a bit different than the other two histories because you have to
create one, it is this way to facilitate testing:

```js
const history = createMemoryHistory(location)
```

## Example implementation

Putting this all together, if we wanted to use the HTML5 history API for our
app, the client entry point would look like:

```js
import React from 'react'
import { render } from 'react-dom'
import { browserHistory, Router, Route, IndexRoute } from 'react-router'

import App from '../components/App'
import Home from '../components/Home'
import About from '../components/About'
import Features from '../components/Features'

render(
  <Router history={browserHistory}>
    <Route path='/' component={App}>
      <IndexRoute component={Home} />
      <Route path='about' component={About} />
      <Route path='features' component={Features} />
    </Route>
  </Router>,
  document.getElementById('app')
)
```
