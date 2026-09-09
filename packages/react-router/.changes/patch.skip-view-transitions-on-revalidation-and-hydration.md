Do not run a view transition for `router.revalidate()` or for the initial hydration.

Both complete with a `POP` history action, so when the current path had previously been the source of a view-transitioned navigation they replayed a transition even though the location did not change. In apps this showed up as a full-document cross-fade on every revalidation after a reload or back/forward navigation, during which open overlays rendered incorrectly.
