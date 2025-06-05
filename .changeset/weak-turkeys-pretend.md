---
"react-router": patch
---

Do not serialize types for `useRouteLoaderData<typeof clientLoader>`

For types to distinguish a `clientLoader` from a `serverLoader`, you MUST annotate `clientLoader` args:

```ts
//                                   👇 annotation required to skip serializing types
export function clientLoader({}: Route.ClientLoaderArgs) {
  return { fn: () => "earth" };
}

function SomeComponent() {
  const data = useRouteLoaderData<typeof clientLoader>("routes/this-route");
  const planet = data?.fn() ?? "world";
  return <h1>Hello, {planet}!</h1>;
}
```
