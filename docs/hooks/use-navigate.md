---
title: useNavigate
---

# `useNavigate`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useNavigate(): NavigateFunction;

interface NavigateFunction {
  (
    to: To,
    options?: { replace?: boolean; state?: any }
  ): void;
  (delta: number): void;
}
```

</details>

The `useNavigate` hook returns a function that lets you navigate programmatically, for example after a form is submitted. If using `replace: true`, the navigation will replace the current entry in the history stack instead of adding a new one.

```tsx
import { useNavigate } from "react-router-dom";

function SignupForm() {
  let navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    await submitForm(event.target);
    navigate("../success", { replace: true });
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

Using the `state` object to pass data between components, you have to use [useLocation](./use-location.md) to access this data.

```tsx
import { useNavigate } from "react-router-dom";

function ComponentA() {
  let navigate = useNavigate();

  function toComponentB () {
    navigate('/componentB',{ state: { name:'name' }});
  }

  return <a onClick={toComponentB}>Component B</a>;
}
```

```tsx
import { useLocation } from "react-router-dom";

function ComponentB() {
  let location = useLocation();
   
  return <div>{location.state.name}</div>;
}
```

The `navigate` function has two signatures:

- Either pass a `To` value (same type as `<Link to>`) with an optional second `{ replace, state }` arg or
- Pass the delta you want to go in the history stack. For example, `navigate(-1)` is equivalent to hitting the back button.
