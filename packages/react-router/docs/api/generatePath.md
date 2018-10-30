# generatePath

The `generatePath` function can be used to generate URLs to the routes. Internally the `path-to-regexp` library is used.

```js
import { generatePath } from "react-router";

generatePath("/user/:id/:entity(posts|comments)", { id: 1, entity: "posts" });
// Will return /user/1/posts
```

Results of compiling paths into regular expressions are cached, so there is no overhead on generating multiple paths with the same pattern.

## pattern: string

`generatePath` takes 2 arguments. The first one is a pattern provided as a path attribute to the `Route` component.

## params: object

The second argument is an object with corresponding params for the pattern to use.

If provided params and path don't match, an error will be thrown:

```js
generatePath("/user/:id/:entity(posts|comments)", { id: 1 });
// TypeError: Expected "entity" to be defined
```
