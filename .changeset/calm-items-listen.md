---
"react-router": patch
"@remix-run/router": patch
---

`useLocation` hook now accepts a state as a generic parameter.

Thus, if you've defined a state you want to send with navigate

```ts
navigate('thepath', { state: { from: 'Your message' } }) // string | boolean | number
```

you can retrieve this state in your target component like this:

```ts
const location = useLocation<{from?: string}>();

console.log(location.state?.from) // "Your message" -> string | null | undefined
```
