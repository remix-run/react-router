---
title: useLinkPressHandler
---

# `useLinkPressHandler`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useLinkPressHandler(
  to: To,
  options?: {
    replace?: boolean;
    state?: any;
  }
): (event: GestureResponderEvent) => void;
```

</details>

The `react-router-native` counterpart to `useLinkClickHandler`, `useLinkPressHandler` returns a press event handler for custom `<Link>` navigation.

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
    state,
  });

  return (
    <TouchableHighlight
      {...rest}
      onPress={(event) => {
        onPress?.(event);
        if (!event.defaultPrevented) {
          handlePress(event);
        }
      }}
    />
  );
}
```
