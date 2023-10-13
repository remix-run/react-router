---
"react-router-dom": minor
"@remix-run/router": minor
---

Add support for the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition) via `document.startViewTransition` to enable CSS animated transitions on SPA navigations in your application.

The simplest approach to enabling a View Transition in your React Router app is via the new `<Link unstable_viewTransition>` prop. This will cause the navigation DOM update to be wrapped in `document.startViewTransition` which will enable transitions for the DOM update. Without any additional CSS styles, you'll get a basic cross-fade animation for your page.

If you need to apply more fine-grained styles for your animations, you can leverage the `unstable_useViewTransitionState` hook which will tell you when a transition is in progress and you can use that to apply classes or styles:

```jsx
function ImageLink(to, src, alt) {
  let isTransitioning = unstable_useViewTransitionState(to);
  return (
    <Link to={to} unstable_viewTransition>
      <img
        src={src}
        alt={alt}
        style={{
          viewTransitionName: isTransitioning ? "image-expand" : "",
        }}
      />
    </Link>
  );
}
```

You can also use the `<NavLink unstable_viewTransition>` shorthand which will manage the hook usage for you and automatically add a `transitioning` class to the `<a>` during the transition:

```css
a.transitioning img {
  view-transition-name: "image-expand";
}
```

```jsx
<NavLink to={to} unstable_viewTransition>
  <img src={src} alt={alt} />
</NavLink>
```

For an example usage of View Transitions with React Router, check out [our fork](https://github.com/brophdawg11/react-router-records) of the [Astro Records](https://github.com/Charca/astro-records) demo.

For more information on using the View Transitions API, please refer to the [Smooth and simple transitions with the View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) guide from the Google Chrome team.
