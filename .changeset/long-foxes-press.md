---
"react-router-dom": minor
"react-router": minor
"react-router-dom-v5-compat": minor
"react-router-native": minor
---

add: generic type to data hooks

Data hooks `useLoaderData`, `useRouteLoaderData` and `useActionData` now accept generic types that can be used to type returned data from `loader` or `action` functions.

> Note: for the sake of compatibility, if no generic type is passed, the hooks return `unknown`

Which means you can now do this:

```tsx
const loader = async ()=>{
    return { message: "I'm typed mate" }
}
const Component = ()=>{
    const loaderData = useLoaderData<typeof loader>()
        // typeof loaderData => { message: string }
}

```