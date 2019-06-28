# useParams

Lets you access the current parsed parameters of the nearest `<Route>`.
This mean, that you can only use `useParams()` inside of `<Router>`. Otherwise you will get an error.

Be aware of that you can use `useParams()` only with React version 16.8.0 or later.
In earlier versions of React you will get an error noticing you about this.

```js
import { useParams } from "react-router";

<Route path="/foobar/:id" component={MyComponent} />;

function MyComponent() {
  const params = useParams();

  // {
  //   id: ...,
  // }
}
```

## arguments

`useParams()` does not accept any arguments.
