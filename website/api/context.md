# `context`

There are 3 keys defined in the context by react-router, these are: `router`, `history` and `match`.

## `router`

The router key contains functions to aid with navigation, those keys are:

* `transitionTo(location)` Requires a location descriptor to be passed in, will transition the router to that location.
* `replaceWith(location)`  Requires a location descriptor to be passed in, will transition the router to that location replacing the current history entry.
* `blockTransitions(prompt)` //TODO For reference this is used internally in the `<NavigationPrompt/>` component.
* `createHref(to)` `to` is a string or location object, will return a href for use in a `a` tag.

## `history`

The history key exposes the `history` api for all Routers _Except_ ServerRouter. For details see: [https://github.com/mjackson/history](https://github.com/mjackson/history)

## `match`

The match key exposes the functions used by the `<Match>` tags to register and subscribe to changes in matches. This context is recreated in each `<Match>` component so you can only access the match details for the current closest defined `<Match>`.
