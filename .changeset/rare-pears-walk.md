---
"react-router": minor
---

Add `loaderData` arguments/properties alongside existing `data` arguments/properties to provide consistency and clarity between `loaderData` and `actionData` across the board
 - Updated types: `Route.MetaArgs`, `Route.MetaMatch`, `MetaArgs`, `MetaMatch`, `Route.ComponentProps.matches`, `UIMatch`
 - `@deprecated` warnings have been added to the existing `data` properties to point users to new `loaderData` properties, in preparation for removing the `data` properties in a future major release
