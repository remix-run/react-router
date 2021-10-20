---
title: Custom Links
order: 4
---

In most cases, the exported `<Link>` and `<NavLink>` components should meet all of your needs as an abstraction of the anchor tag. If you need to return anything other than an anchor element (whatever you do return should eventually render an anchor element unless you really know what you're doing with accessibility), or override any of `<Link>`'s rendering logic, you can use a few hooks from `react-router-dom` to build your own:

```tsx
import {
  useHref,
  useLinkClickHandler
} from "react-router-dom";

const StyledLink = styled("a", { color: "fuschia" });

const Link = React.forwardRef(
  (
    {
      onClick,
      replace = false,
      state,
      target,
      to,
      ...rest
    },
    ref
  ) => {
    let href = useHref(to);
    let handleClick = useLinkClickHandler(to, {
      replace,
      state,
      target
    });

    return (
      <StyledLink
        {...rest}
        href={href}
        onClick={event => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            handleClick(event);
          }
        }}
        ref={ref}
        target={target}
      />
    );
  }
);
```

If you're using `react-router-native`, you can create a custom `<Link>` with the `useLinkPressHandler` hook:

```tsx
import { TouchableHighlight } from "react-native";
import { useLinkPressHandler } from "react-router-native";

function Link({
  onPress,
  replace = false,
  state,
  to,
  ...rest
}) {
  let handlePress = useLinkPressHandler(to, {
    replace,
    state
  });

  return (
    <TouchableHighlight
      {...rest}
      onPress={event => {
        onPress?.(event);
        if (!event.defaultPrevented) {
          handlePress(event);
        }
      }}
    />
  );
}
```

## Dealing with external URLs

React Router's `Link` component assumes that the `to` prop's `pathname` is relative to the app. For external links we recommend using an HTML anchor component.

A common pattern for React Router apps is to create a custom `Link` to check the `to` value to determine whether or not it is an external URL string before returning React Router's `Link`.

```tsx
import * as React from "react";
import { Link as BaseLink } from "react-router-dom";

const Link = React.forwardRef(
  ({ to, replace, state, ...props }, ref) => {
    return typeof to === "string" && isExternalURL(to) ? (
      <a {...props} href={to} ref={ref} />
    ) : (
      <BaseLink
        {...props}
        to={to}
        replace={replace}
        state={state}
        ref={ref}
      />
    );
  }
);
```

There are a number of ways one might implement a function like `isExternalURL`. At some point we may decide to provide one in a companion package as a convenience.

<!-- [TODO: Add an example or two] -->
