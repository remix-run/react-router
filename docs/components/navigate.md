---
title: Navigate
---

# `<Navigate>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function Navigate(props: NavigateProps): null;

interface NavigateProps {
  to: To;
  replace?: boolean;
  state?: any;
  relative?: RelativeRoutingType;
}
```

</details>

A `<Navigate>` element changes the current location when it is rendered. It's a component wrapper around [`useNavigate`][use-navigate], and accepts all the same arguments as props.

<docs-info>Having a component-based version of the `useNavigate` hook makes it easier to use this feature in a [`React.Component`](https://reactjs.org/docs/react-component.html) subclass where hooks are not able to be used.</docs-info>

```tsx
import * as React from "react";
import { Navigate } from "react-router-dom";

class LoginForm extends React.Component {
  state = { user: null, error: null };

  async handleSubmit(event) {
    event.preventDefault();
    try {
      let user = await login(event.target);
      this.setState({ user });
    } catch (error) {
      this.setState({ error });
    }
  }

  render() {
    let { user, error } = this.state;
    return (
      <div>
        {error && <p>{error.message}</p>}
        {user && (
          <Navigate to="/dashboard" replace={true} />
        )}
        <form
          onSubmit={(event) => this.handleSubmit(event)}
        >
          <input type="text" name="username" />
          <input type="password" name="password" />
        </form>
      </div>
    );
  }
}
```

[use-navigate]: ../hooks/use-navigate
