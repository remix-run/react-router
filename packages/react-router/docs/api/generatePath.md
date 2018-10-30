# generatePath

The `generatePath` function can be used to generate URLs to the routes. Internally the `path-to-regexp` library is used.

```js
import { generatePath } from "react-router";

const ROUTE = {
  path: "/user/:id([1-9]\\d*)/:entity(posts|comments)",
  render: Profile,
  exact: true
};

generatePath(ROUTE.path, { id: 1, entity: "posts" });
// Will return /user/1/posts
```

Results of compiling paths into regular expressions are cached, so there is no overhead on generating multiple links to the same route.

## pattern

`generatePath` takes 2 arguments. The first one is a pattern provided as a path attribute to the `Route` component.

## params

The second argument is an object with corresponding params.

If provided params and path don't match, an error will be thrown:

```js
generatePath(ROUTE.path, { id: 1 });
// TypeError: Expected "entity" to be defined
```
