---
"react-router": patch
---

useRoute: return type-safe `handle`

For example:

```ts
// app/routes/admin.tsx
const handle = { hello: "world" };
```

```ts
// app/routes/some-other-route.tsx
export default function Component() {
  const admin = useRoute("routes/admin");
  if (!admin) throw new Error("Not nested within 'routes/admin'");
  console.log(admin.handle);
  //                ^? { hello: string }
}
```
