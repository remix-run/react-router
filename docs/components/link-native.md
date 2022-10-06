---
title: Link (RN)
---

# `<Link>` (React Native)

<docs-info>This is the React Native version of `<Link>`. For the web version, [go here][link].</docs-info>

<details>
  <summary>Type declaration</summary>

```tsx
declare function Link(props: LinkProps): React.ReactElement;

interface LinkProps extends TouchableHighlightProps {
  children?: React.ReactNode;
  onPress?(event: GestureResponderEvent): void;
  replace?: boolean;
  state?: any;
  to: To;
}
```

</details>

A `<Link>` is an element that lets the user navigate to another view by tapping it, similar to how `<a>` elements work in a web app. In `react-router-native`, a `<Link>` renders a `TouchableHighlight`. To override default styling and behaviour, please refer to the [Props reference for `TouchableHighlight`](https://reactnative.dev/docs/touchablehighlight#props).

```tsx
import * as React from "react";
import { View, Text } from "react-native";
import { Link } from "react-router-native";

function Home() {
  return (
    <View>
      <Text>Welcome!</Text>
      <Link to="/profile">
        <Text>Visit your profile</Text>
      </Link>
    </View>
  );
}
```

[link]: ./link
