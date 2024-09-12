---
title: useViewTransitionState
---

# `useViewTransitionState`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useViewTransitionState(
  to: To,
  opts: { relative?: "route" : "path" } = {}
): boolean;

type To = string | Partial<Path>;

interface Path {
  pathname: string;
  search: string;
  hash: string;
}
```

</details>

This hook returns `true` when there is an active [View Transition][view-transitions] to the specified location. This can be used to apply finer-grained styles to elements to further customize the view transition. This requires that view transitions have been enabled for the given navigation via the [viewTransition][link-view-transition] prop on the `Link` (or the `Form`, `navigate`, or `submit` call).

Consider clicking on an image in a list that you need to expand into the hero image on the destination page:

```jsx
function NavImage({ src, alt, id }) {
  const to = `/images/${id}`;
  const isTransitioning = useViewTransitionState(to);
  return (
    <Link to={to} viewTransition>
      <img
        src={src}
        alt={alt}
        style={{
          viewTransitionName: isTransitioning
            ? "image-expand"
            : "",
        }}
      />
    </Link>
  );
}
```

[link-view-transition]: ../components/link#viewtransition
[view-transitions]: https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
