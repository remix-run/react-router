# generatePath

The `generatePath` function can be used to generate URLs to the routes. Internally the `path-to-regexp` library is used.

```js
import { generatePath } from "react-router";

generatePath("/user/:id/:entity(posts|comments)", {
  id: 1,
  entity: "posts"
});
// Will return /user/1/posts
```

Results of compiling paths into regular expressions are cached, so there is no overhead on generating multiple paths with the same pattern.

## pattern: string

`generatePath` takes 3 arguments. The first one is a pattern provided as a path attribute to the `Route` component.

## params: object

The second argument is an object with corresponding params for the pattern to use.

If provided params and path don't match, an error will be thrown:

```js
generatePath("/user/:id/:entity(posts|comments)", { id: 1 });
// TypeError: Expected "entity" to be defined
```

## pathFunctionOptions: object

The third argument is an object with a single parameter used within `path-to-regexp` library to switch between encoding functions.

These functions are:

- [encodeURIComponentPretty](https://github.com/pillarjs/path-to-regexp/blob/a99ec3c149e8c1d91fa533aa54d3ee7e34449bb3/index.js#L120) which is a slightly modified [encodeURI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI) function with escaped characters of `/`, `?`, and `#`

- [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) function

By default, `encodeURIComponentPretty` function is used.

In most cases, you would highly likely ignore this argument, however, there are some edge cases, where you could want to escape some of these characters in your query

| Character | encodeURIComponentPretty | encodeURIComponent |
| --------- | ------------------------ | ------------------ |
| `$`       | `$`                      | `%24`              |
| `&`       | `&`                      | `%26`              |
| `+`       | `+`                      | `%2B`              |
| `,`       | `,`                      | `%2C`              |
| `:`       | `:`                      | `%3A`              |
| `;`       | `;`                      | `%3B`              |
| `=`       | `=`                      | `%3D`              |
| `@`       | `@`                      | `%40`              |

```js
generatePath("/password/restore?email=:email", {
  email: "emailWith+Sign@gmail.com"
});
// Will return "/password/restore?email=emailWith+Sign@gmail.com"

generatePath(
  "/password/restore?email=:email",
  { email: "emailWith+Sign@gmail.com" },
  { pretty: false }
);
// Will return "/password/restore?email=emailWith%2BSign%40gmail.com"
```
