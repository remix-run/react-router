Deprecate React Router's view transition APIs in favor of React's `<ViewTransition>` component, available in React 19.3 and later

- Deprecate the `viewTransition` props/options, `useViewTransitionState`, and `NavLink`'s `isTransitioning` render prop and `transitioning` class
- Preserve existing behavior, including support for older React versions
- See the [migration guide](https://reactrouter.com/how-to/view-transitions) for a navigation example and compatibility considerations
