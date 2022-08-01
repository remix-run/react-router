---
title: generatePath
---

# `generatePath`

<details>
  <summary>Type declaration</summary>

```tsx
// Recursive helper for finding path parameters in the absence of wildcards
type _PathParam<Path extends string> =
  // split path into individual path segments
  Path extends `${infer L}/${infer R}` ? _PathParam<L> | _PathParam<R> :
  // find params after `:`
  Path extends `${string}:${infer Param}` ? Param :
  // otherwise, there aren't any params present
  never

/**
 * Examples:
 * "/a/b/*" -> "/*"
 * ":a" -> "a"
 * "/a/:b" -> "b"
 * "/:a/:b" -> "a" | "b"
 */
type PathParam<Path extends string> =
  // check if path is just a wildcard
  Path extends "*" ? "*" :
  // look for wildcard at the end of the path
  Path extends `${infer Rest}/*` ? "*" | _PathParam<Rest> :
  // look for params in the absence of wildcards
  _PathParam<Path>


declare function generatePath<Path extends string>(
  path: Path,
  params?: {
    [key in PathParams<Path>]: string;
  }
): string;
```

</details>

`generatePath` interpolates a set of params into a route path string with `:id` and `*` placeholders. This can be useful when you want to eliminate placeholders from a route path so it matches statically instead of using a dynamic parameter.

```tsx
generatePath("/users/:id", { id: 42 }); // "/users/42"
generatePath("/files/:type/*", {
  type: "img",
  "*": "cat.jpg",
}); // "/files/img/cat.jpg"
```
