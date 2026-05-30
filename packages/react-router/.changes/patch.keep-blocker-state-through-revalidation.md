Keep a blocker's `blocked` state through a revalidation

- `router.revalidate()` ran through `completeNavigation`, which reset all blockers to the idle state even though a revalidation does not pass through any blocker. A blocked navigation now keeps its `proceed`/`reset` handlers after a revalidation.
