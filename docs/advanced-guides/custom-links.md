# Custom Links

In most cases, the exported `<Link>` component should meet all of your needs as an abstraction of the anchor tag. If you need to return anything other than an anchor element, or override any of `<Link>`'s rendering logic, you can use a few hooks from `react-router-dom` to build your own:

```tsx
import { useHref, useLinkClickHandler } from "react-router-dom";

const StyledLink = styled("a", { color: "fuschia" });

const Link = React.forwardRef(
  ({ onClick, replace = false, state, target, to, ...rest }, ref) => {
    let href = useHref(to);
    let handleClick = useLinkClickHandler(to, { replace, state, target });

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

function Link({ onPress, replace = false, state, to, ...rest }) {
  let handlePress = useLinkPressHandler(to, { replace, state });

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
