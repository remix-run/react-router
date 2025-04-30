---
"@react-router/dev": minor
---

Automatic types for future flags

Some future flags alter the way types should work in React Router.
Previously, you had to remember to manually opt-in to the new types.

For example, for `unstable_middleware`:

```ts
// react-router.config.ts

// Step 1: Enable middleware
export default {
  future: {
    unstable_middleware: true,
  },
};

// Step 2: Enable middleware types
declare module "react-router" {
  interface Future {
    unstable_middleware: true; // 👈 Enable middleware types
  }
}
```

It was up to you to keep the runtime future flags synced with the types for those future flags.
This was confusing and error-prone.

Now, React Router will automatically enable types for future flags.
That means you only need to specify the runtime future flag:

```ts
// react-router.config.ts

// Step 1: Enable middleware
export default {
  future: {
    unstable_middleware: true,
  },
};

// No step 2! That's it!
```

Behind the scenes, React Router will generate the corresponding `declare module` into `.react-router/types`.
Currently this is done in `.react-router/types/+register.ts` but this is an implementation detail that may change in the future.
