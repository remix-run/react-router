Improved types for `generatePath`'s `param` arg

Type errors when required params are omitted:

```ts
// Before
// Passes type checks, but throws at runtime 💥
generatePath(":required", { required: null });

// After
generatePath(":required", { required: null });
//                          ^^^^^^^^ Type 'null' is not assignable to type 'string'.ts(2322)
```

Allow omission of optional params:

```ts
// Before
generatePath(":optional?", {});
//                         ^^ Property 'optional' is missing in type '{}' but required in type '{ optional: string | null | undefined; }'.ts(2741)

// After
generatePath(":optional?", {});
```

Allows extra keys:

```ts
// Before
generatePath(":a", { a: "1", b: "2" });
//                           ^ Object literal may only specify known properties, and 'b' does not exist in type '{ a: string; }'.ts(2353)

// After
generatePath(":a", { a: "1", b: "2" });
```
