# useLocation

Lets you access the current location of the nearest `<Route>`.
This mean, that you can only use `useLocation()` inside of `<Router>`. Otherwise you will get an error.
It returns an object containing the current `location` object and a function `navigate`
for navigation inside of the routing context.

Be aware of that you can use `useLocation()` only with React version 16.8.0 or later.
In earlier versions of React you will get an error noticing you about this.

```js
import { useLocation } from "react-router";

function MyComponent() {
  const { navigate, location } = useLocation();

  // navigate to /foobar/baz and add it to the history
  navigate("/foobar/baz");

  // navigate to /foobar/baz and replace the last history entry
  navigate("/foobar/baz", { replace: true });

  location;
  // {
  //   pathname: ...,
  //   search: ...,
  //   hash: ...,
  //   state: ...,
  //   key: ...,
  // }
}
```

## arguments

`useLocation()` does not accept any arguments.
