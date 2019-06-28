# useRouter

Lets you access the current value of the nearest `<Route>`.
This mean, that you can only use `useRouter()` inside of `<Router>`. Otherwise you will get an error.

Be aware of that you can use `useRouter()` only with React version 16.8.0 or later.
In earlier versions of React you will get an error noticing you about this.

```js
import { useRouter } from "react-router";

function MyComponent() {
  const context = useRouter();

  // {
  //   history: ...,
  //   location: ...,
  //   match: ...,
  //   staticContext: ...,
  // }
}
```

## arguments

`useRouter()` does not accept any arguments.
