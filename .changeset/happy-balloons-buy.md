---
"react-router": patch
"@remix-run/router": patch
---

Stop incorrectly matching on partial named parameters, i.e. `<Route path="prefix-:param">`, to align with how splat parameters work. If you were previously relying on this behavior then it's recommended to extract the static portion of the path at the `useParams` call site:

```jsx
// Old behavior at URL /prefix-123
<Route path="prefix-:id" element={<Comp /> }>

function Comp() {
  let params = useParams(); // { id: '123' }
  let id = params.id; // "123"
  ...
}

// New behavior at URL /prefix-123
<Route path=":id" element={<Comp /> }>

function Comp() {
  let params = useParams(); // { id: 'prefix-123' }
  let id = params.id.replace(/^prefix-/, ''); // "123"
  ...
}
```
