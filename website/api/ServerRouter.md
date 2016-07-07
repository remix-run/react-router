# `<ServerRouter>`

The Router to use when rendering on the server. It takes all the same
props as the normal `Router` with an added `onRedirect` callback.

## `onRedirect: func.isRequired`

If your app redirects during the initial render, this callback will be
called with the next location.

In React, when you need a component instance after rendering is complete
you can assign it in a ref callback:

```js
<input ref={input => this.input = input}/>
```

Similarly, with React Router server rendering, you assign the redirect
information to a variable to use after rendering:

```js
<Router onRedirect={location => redirect = loation}/>
```

Here's a slightly more complete example:

```js
import { Router } from 'react-router/server'
import { renderToString } from 'react-dom/server'
import App from './App'

const handleRequest = (req, res) => {
  let redirect

  const html = (
    <Router
      location={req.url}
      onRedirect={location => redirect = location}
    ><App/></Router>
  )

  if (redirect) {
    res.redirect(302, redirect.pathname)
  } else {
    res.send(html)
  }

}
```

## Redirect Status

You can use location state to determe the response status.

```js
<Redirect to={{ pathname: '/somewhere', state: { status: 301 } }}/>
<Redirect to={{ pathname: '/somewhere-else', state: { status: 302 } }}/>

// then on your server
res.redirect(redirect.state.status, redirect.pathname)
```

# `</ServerRouter>`
