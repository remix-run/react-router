Deprecate React Router's view transition APIs in favor of React's `<ViewTransition>` component, available in React 19.3 and later

This includes the `viewTransition` props/options, `useViewTransitionState`, and `NavLink`'s `isTransitioning` render prop and `transitioning` class. Existing behavior is unchanged. See the [migration guide](https://reactrouter.com/how-to/view-transitions) for a navigation example and compatibility considerations.
