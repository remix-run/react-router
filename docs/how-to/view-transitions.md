---
title: View Transitions
---

# View Transitions

[MODES: framework, data, declarative]

<br/>
<br/>

Use React's [`<ViewTransition>`][react-view-transition] component to animate client-side navigations. This requires React and React DOM 19.3 or later.

<docs-warning>

React Router's `viewTransition` props/options, `useViewTransitionState` hook, and `NavLink`'s `isTransitioning` render prop and `transitioning` class are deprecated in favor of React's `<ViewTransition>` component. The existing APIs continue to work, including with older React versions.

</docs-warning>

## Navigation View Transitions with React

Wrap the outlet in a persistent `<ViewTransition>` boundary in a shared layout route. In Framework Mode, this can be your root route's default export; in Data and Declarative modes, use it as the component for a parent route with children:

```tsx
import { ViewTransition } from "react";
import { Link, Outlet } from "react-router";

export default function PageLayout() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <ViewTransition>
        <main>
          <Outlet />
        </main>
      </ViewTransition>
    </>
  );
}
```

Navigations that update the outlet cross-fade its contents. Keep the boundary mounted across navigations; you don't need to key it by location or remount the route tree. The navigation stays outside the animated region. Other updates inside the boundary can also animate when they run in a React Transition.

React Router wraps router state updates in [`React.startTransition`][start-transition] by default, which lets React activate `<ViewTransition>` without additional configuration. React Transitions must remain enabled for navigation view transitions to work: do not set `useTransitions={false}` on your router.

This applies to navigations from `<Link>`, `<NavLink>`, and `<Form>`, as well as programmatic navigation with `useNavigate` and `useSubmit`. No additional `startTransition` wrapper is needed.

### Migrating from React Router's view transitions

- Remove `viewTransition` from `<Link>`, `<NavLink>`, and `<Form>`, and remove `viewTransition: true` from navigation/submission options. React coordinates `document.startViewTransition()` itself; enabling both implementations can interrupt animations.
- Replace `useViewTransitionState`, `isTransitioning`, and `.transitioning` styles with React's [View Transition classes][react-view-transition-classes]. Those router APIs only track the legacy transitions.
- For shared elements such as an image moving from a list to a detail route, wrap each side in `<ViewTransition name="...">` with the same unique name. See React's [shared element example][react-shared-elements].
- Keep React Transitions enabled. `useTransitions={false}` and synchronous updates such as `flushSync` can prevent React's animations.

React's component is not a drop-in replacement for every legacy animation. In particular, React [skips view transitions for synchronous updates from `popstate`][react-router-transitions], so browser Back/Forward navigations may not animate. Browsers without View Transitions support still navigate normally.

Respect reduced-motion preferences when adding animations:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

## Legacy View Transitions (Deprecated)

The following examples document the deprecated APIs for existing applications. These APIs are available in Framework and Data modes.

### Basic View Transition

#### 1. Enable view transitions on navigation

The simplest way to enable view transitions is by adding the `viewTransition` prop to your `Link`, `NavLink`, or `Form` components. This automatically wraps the navigation update in `document.startViewTransition()`.

```tsx
<Link to="/about" viewTransition>
  About
</Link>
```

Without any additional CSS, this provides a basic cross-fade animation between pages.

#### 2. Enable view transitions with programmatic navigation

When using programmatic navigation with the `useNavigate` hook, you can enable view transitions by passing the `viewTransition: true` option:

```tsx
import { useNavigate } from "react-router";

function NavigationButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() =>
        navigate("/about", { viewTransition: true })
      }
    >
      About
    </button>
  );
}
```

This provides the same cross-fade animation as using the `viewTransition` prop on Link components.

For more information on using the View Transitions API, please refer to the ["Smooth transitions with the View Transition API" guide][view-transitions-guide] from the Google Chrome team.

### Image Gallery Example

Let's build an image gallery that demonstrates how to trigger and use view transitions. We'll create a list of images that expand into a detail view with smooth animations.

#### 1. Create the image gallery route

```tsx filename=routes/image-gallery.tsx
import { NavLink } from "react-router";

export const images = [
  "https://remix.run/blog-images/headers/the-future-is-now.jpg",
  "https://remix.run/blog-images/headers/waterfall.jpg",
  "https://remix.run/blog-images/headers/webpack.png",
  // ... more images ...
];

export default function ImageGalleryRoute() {
  return (
    <div className="image-list">
      <h1>Image List</h1>
      <div>
        {images.map((src, idx) => (
          <NavLink
            key={src}
            to={`/image/${idx}`}
            viewTransition // Enable view transitions for this link
          >
            <p>Image Number {idx}</p>
            <img
              className="max-w-full contain-layout"
              src={src}
            />
          </NavLink>
        ))}
      </div>
    </div>
  );
}
```

#### 2. Add transition styles

Define view transition names and animations for elements that should transition smoothly between routes.

```css filename=app.css
/* Layout styles for the image grid */
.image-list > div {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 10px;
}

.image-list h1 {
  font-size: 2rem;
  font-weight: 600;
}

.image-list img {
  max-width: 100%;
  contain: layout;
}

.image-list p {
  width: fit-content;
}

/* Assign transition names to elements during navigation */
.image-list a.transitioning img {
  view-transition-name: image-expand;
}

.image-list a.transitioning p {
  view-transition-name: image-title;
}
```

#### 3. Create the image detail route

The detail view needs to use the same view transition names to create a seamless animation.

```tsx filename=routes/image-details.tsx
import { Link } from "react-router";
import { images } from "./home";
import type { Route } from "./+types/image-details";

export default function ImageDetailsRoute({
  params,
}: Route.ComponentProps) {
  return (
    <div className="image-detail">
      <Link to="/" viewTransition>
        Back
      </Link>
      <h1>Image Number {params.id}</h1>
      <img src={images[Number(params.id)]} />
    </div>
  );
}
```

#### 4. Add matching transition styles for the detail view

```css filename=app.css
/* Match transition names from the list view */
.image-detail h1 {
  font-size: 2rem;
  font-weight: 600;
  width: fit-content;
  view-transition-name: image-title;
}

.image-detail img {
  max-width: 100%;
  contain: layout;
  view-transition-name: image-expand;
}
```

### Advanced Usage

You can control view transitions more precisely using either render props or the `useViewTransitionState` hook.

#### 1. Using render props

```tsx filename=routes/image-gallery.tsx
<NavLink to={`/image/${idx}`} viewTransition>
  {({ isTransitioning }) => (
    <>
      <p
        style={{
          viewTransitionName: isTransitioning
            ? "image-title"
            : "none",
        }}
      >
        Image Number {idx}
      </p>
      <img
        src={src}
        style={{
          viewTransitionName: isTransitioning
            ? "image-expand"
            : "none",
        }}
      />
    </>
  )}
</NavLink>
```

#### 2. Using the `useViewTransitionState` hook

```tsx filename=routes/image-gallery.tsx
function NavImage(props: { src: string; idx: number }) {
  const href = `/image/${props.idx}`;
  // Hook provides transition state for specific route
  const isTransitioning = useViewTransitionState(href);

  return (
    <Link to={href} viewTransition>
      <p
        style={{
          viewTransitionName: isTransitioning
            ? "image-title"
            : "none",
        }}
      >
        Image Number {props.idx}
      </p>
      <img
        src={props.src}
        style={{
          viewTransitionName: isTransitioning
            ? "image-expand"
            : "none",
        }}
      />
    </Link>
  );
}
```

[view-transitions-api]: https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition
[react-view-transition]: https://react.dev/reference/react/ViewTransition
[start-transition]: https://react.dev/reference/react/startTransition
[react-view-transition-classes]: https://react.dev/reference/react/ViewTransition#view-transition-class
[react-shared-elements]: https://react.dev/reference/react/ViewTransition#animating-a-shared-element
[react-router-transitions]: https://react.dev/reference/react/ViewTransition#building-view-transition-enabled-routers
[view-transitions-guide]: https://developer.chrome.com/docs/web-platform/view-transitions
