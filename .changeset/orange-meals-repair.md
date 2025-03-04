---
"react-router": patch
---

Fix types for loaderData and actionData that contained `Record`s

UNSTABLE(BREAKING):

`unstable_SerializesTo` added a way to register custom serialization types in Single Fetch for other library and framework authors like Apollo.
It was implemented with branded type whose branded property that was made optional so that casting arbitrary values was easy:

```ts
// without the brand being marked as optional
let x1 = 42 as unknown as unstable_SerializesTo<number>;
//          ^^^^^^^^^^

// with the brand being marked as optional
let x2 = 42 as unstable_SerializesTo<number>;
```

However, this broke type inference in `loaderData` and `actionData` for any `Record` types as those would now (incorrectly) match `unstable_SerializesTo`.
This affected all users, not just those that depended on `unstable_SerializesTo`.
To fix this, the branded property of `unstable_SerializesTo` is marked as required instead of optional.

For library and framework authors using `unstable_SerializesTo`, you may need to add `as unknown` casts before casting to `unstable_SerializesTo`.
