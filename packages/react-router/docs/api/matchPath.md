# matchPath

This lets you use the same matching code that `<Route>` uses except outside of the normal render cycle, like gathering up data dependencies before rendering on the server.

```js
import { matchPath } from 'react-router'

const match = matchPath('/users/123', {
  path: '/users/:id',
  end: true,
  strict: false
})
```

## pathname

The first argument is the pathname you want to match. If you're using
this on the server with Node.js, it would be `req.url`.

## props

The second argument are the `path` to match and the props to match against. The props are the `options` that [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp/blob/v1.7.0/Readme.md#usage) accepts.

```js
{
  path, // like /users/:id
  strict, // optional, defaults to false
  end, // optional, defaults to true
  sensitive // optional, defaults to false
}
```
