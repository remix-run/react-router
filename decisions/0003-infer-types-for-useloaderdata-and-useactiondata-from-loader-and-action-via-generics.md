# Infer types for `useLoaderData` and `useActionData` from `loader` and `action` via generics

Date: 2022-07-11

Status: accepted

## Context

Goal: End-to-end type safety for `useLoaderData` and `useActionData` with great Developer Experience (DX)

Related discussions:

- [remix-run/remix#1254](https://github.com/remix-run/remix/pull/1254)
- [remix-run/remix#3276](https://github.com/remix-run/remix/pull/3276)

---

In Remix v1.6.4, types for both `useLoaderData` and `useActionData` are parameterized with a generic:

```tsx
type MyLoaderData = {
  /* ... */
};
type MyActionData = {
  /* ... */
};

export default function Route() {
  const loaderData = useLoaderData<MyLoaderData>();
  const actionData = useActionData<MyActionData>();
  return <div>{/* ... */}</div>;
}
```

For end-to-end type safety, it is then the user's responsability to make sure that `loader` and `action` also use the same type in the `json` generic:

```ts
export const loader: LoaderFunction = () => {
  return json<MyLoaderData>({
    /* ... */
  });
};

export const action: ActionFunction = () => {
  return json<MyActionData>({
    /* ... */
  });
};
```

### Diving into `useLoaderData`'s and `useActionData`'s generics

Tracing through the `@remix-run/react` source code (v1.6.4), you'll find that `useLoaderData` returns an `any` type that is implicitly type cast to whatever type gets passed into the `useLoaderData` generic:

```ts
// https://github.com/remix-run/remix/blob/v1.6.4/packages/remix-react/components.tsx#L1370
export function useLoaderData<T = AppData>(): T {
  return useRemixRouteContext().data; //
}

// https://github.com/remix-run/remix/blob/v1.6.4/packages/remix-react/components.tsx#L73
function useRemixRouteContext(): RemixRouteContextType {
  /* ... */
}

// https://github.com/remix-run/remix/blob/v1.6.4/packages/remix-react/components.tsx#L56
interface RemixRouteContextType {
  data: AppData;
  id: string;
}

// https://github.com/remix-run/remix/blob/v1.6.4/packages/remix-react/data.ts#L4
export type AppData = any;
```

Boiling this down, the code looks like:

```ts
let data: any;

// somewhere else, `loader` gets called an sets `data` to some value

function useLoaderData<T>(): T {
  return data; // <-- Typescript casts this `any` to `T`
}
```

`useLoaderData` isn't basing its return type on how `data` was set (i.e. the return value of `loader`) nor is it validating the data.
It's just blindly casting `data` to whatever the user passed in for the generic `T`.

### Issues with current approach

The developer experience is subpar.
Users are required to write redundant code for the data types that could have been inferred from the arguments to `json`.
Changes to the data shape require changing _both_ the declared `type` or `interface` as well as the argument to `json`.

Additionally, the current approach encourages users to pass the same type to `json` with the `loader` and to `useLoaderData`, but **this is a footgun**!
`json` can accept data types like `Date` that are JSON serializable, but `useLoaderData` will return the _serialized_ type:

```ts
type MyLoaderData = {
  birthday: Date;
};

export const loader: LoaderFunction = () => {
  return json<MyLoaderData>({ birthday: new Date("February 15, 1992") });
};

export default function Route() {
  const { birthday } = useLoaderData<MyLoaderData>();
  // ^ `useLoaderData` tricks Typescript into thinking this is a `Date`, when in fact its a `string`!
}
```

Again, the same goes for `useActionData`.

### Solution criteria

- Return type of `useLoaderData` and `useActionData` should somehow be inferred from `loader` and `action`, not blindly type cast
- Return type of `loader` and `action` should be inferred
  - Necessarily, return type of `json` should be inferred from its input
- No module side-effects (so higher-order functions like `makeLoader` is definitely a no).
- `json` should allow everything that `JSON.stringify` allows.
- `json` should allow only what `JSON.stringify` allows.
- `useLoaderData` should not return anything that `JSON.parse` can't return.

### Key insight: `loader` and `action` are an _implicit_ inputs

While there's been interest in inferring the types for `useLoaderData` based on `loader`, there was [hesitance to use a Typescript generic to do so](https://github.com/remix-run/remix/pull/3276#issuecomment-1164764821).
Typescript generics are apt for specifying or inferring types for _inputs_, not for blindly type casting output types.

A key factor in the decision was identifying that `loader` and `action` are _implicit_ inputs of `useLoaderData` and `useActionData`.

In other words, if `loader` and `useLoaderData` were guaranteed to run in the same process (and not cross the network), then we could write `useLoaderData(loader)`, specifying `loader` as an explicit input for `useLoaderData`.

```ts
// _conceptually_ `loader` is an input for `useLoaderData`
function useLoaderData<Loader extends LoaderFunction>(loader: Loader) {
  /*...*/
}
```

Though `loader` and `useLoaderData` exist together in the same file at development-time, `loader` does not exist at runtime in the browser.
Without the `loader` argument to infer types from, `useLoaderData` needs a way to learn about `loader`'s type at compile-time.

Additionally, `loader` and `useLoaderData` are both managed by Remix across the network.
While its true that Remix doesn't "own" the network in the strictest sense, having `useLoaderData` return data that does not correspond to its `loader` is an exceedingly rare edge-case.

Same goes for `useActionData`.

---

A similar case is how [Prisma](https://www.prisma.io/) infers types from database schemas available at runtime, even though there are (exceedingly rare) edge-cases where that database schema _could_ be mutated after compile-time but before run-time.

## Decision

Explicitly provide type of the implicit `loader` input for `useLoaderData` and then infer the return type for `useLoaderData`.
Do the same for `action` and `useActionData`.

```ts
export const loader = async (args: LoaderArgs) => {
  // ...
  return json(/*...*/);
};

export default function Route() {
  const data = useLoaderData<typeof loader>();
  // ...
}
```

Additionally, the inferred return type for `useLoaderData` will only include serializable (JSON) types.

### Return `unknown` when generic is omitted

Omitting the generic for `useLoaderData` or `useActionData` results in `any` being returned.
This hides potential type errors from the user.
Instead, we'll change the return type to `unknown`.

```ts
type MyLoaderData = {
  /*...*/
};

export default function Route() {
  const data = useLoaderData();
  // ^? unknown
}
```

Note: Since this would be a breaking change, changing the return type to `unknown` will be slated for v2.

### Deprecate non-inferred types via generics

Passing in a non-inferred type for `useLoaderData` is hiding an unsafe type cast.
Using the `useLoaderData` in this way will be deprecated in favor of an explicit type cast that clearly communicates the assumptions being made:

```ts
type MyLoaderData = {
  /*...*/
};

export default function Route() {
  const dataGeneric = useLoaderData<MyLoaderData>(); // <-- will be deprecated
  const dataCast = useLoaderData() as MyLoaderData; // <- use this instead
}
```

## Consequences

- Users can continue to provide non-inferred types by type casting the result of `useLoaderData` or `useActionData`
- Users can opt-in to inferred types by using `typeof loader` or `typeof action` at the generic for `useLoaderData` or `useActionData`.
- Return types for `loader` and `action` will be the sources-of-truth for the types inferred for `useLoaderData` and `useActionData`.
- Users do not need to write redundant code to align types across the network
- Return type of `useLoaderData` and `useActionData` will correspond to the JSON _serialized_ types from `json` calls in `loader` and `action`, eliminating a class of errors.
- `LoaderFunction` and `ActionFunction` should not be used when opting into type inference as they override the inferred return types.[^1]

🚨 Users who opt-in to inferred types **MUST** return a `TypedResponse` from `json` and **MUST NOT** return a bare object:

```ts
const loader = () => {
  // NO
  return { hello: "world" };

  // YES
  return json({ hello: "world" });
};
```

[^1]: The proposed `satisfies` operator for Typescript would let `LoaderFunction` and `ActionFunction` enforce function types while preserving the narrower inferred return type: https://github.com/microsoft/TypeScript/issues/47920
