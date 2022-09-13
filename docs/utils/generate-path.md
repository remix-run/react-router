---
title: generatePath
---

# `generatePath`

<details>
  <summary>Type declaration</summary>

```tsx
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
generatePath("/users/:id", { id: "42" }); // "/users/42"
generatePath("/files/:type/*", {
  type: "img",
  "*": "cat.jpg",
}); // "/files/img/cat.jpg"
```
