---
"@react-router/dev": patch
---

Fix href types for optional dynamic params

7.6.1 introduced fixes for `href` when using optional static segments,
but those fixes caused regressions with how optional dynamic params worked in 7.6.0:

```ts
// 7.6.0
href("/users/:id?"); // ✅
href("/users/:id?", { id: 1 }); // ✅

// 7.6.1
href("/users/:id?"); // ❌
href("/users/:id?", { id: 1 }); // ❌
```

Now, optional static segments are expanded into different paths for `href`, but optional dynamic params are not.
This way `href` can unambiguously refer to an exact URL path, all while keeping the number of path options to a minimum.

```ts
// 7.6.2

// path: /users/:id?/edit?
href("
//    ^ suggestions when cursor is here:
//
//    /users/:id?
//    /users/:id?/edit
```

Additionally, you can pass `params` from component props without needing to narrow them manually:

```ts
declare const params: { id?: number };

// 7.6.0
href("/users/:id?", params);

// 7.6.1
href("/users/:id?", params); // ❌
"id" in params ? href("/users/:id", params) : href("/users"); // works... but is annoying

// 7.6.2
href("/users/:id?", params); // restores behavior of 7.6.0
```
