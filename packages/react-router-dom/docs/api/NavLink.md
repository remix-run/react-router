# &lt;NavLink>

A special version of the [`<Link>`](Link.md) that will add styling attributes to the rendered element when it matches the current URL.

```js
import { NavLink } from 'react-router-dom'

<NavLink to="/about">About</NavLink>
```

## activeClassName: string

The class to give the element when it is active. The default given class is `active`. This will be joined with the `className` prop.

```js
<NavLink
  to="/faq"
  activeClassName="selected"
>FAQs</NavLink>
```

## activeStyle: object

The styles to apply to the element when it is active.

```js
<NavLink
  to="/faq"
  activeStyle={{
    fontWeight: 'bold',
    color: 'red'
   }}
>FAQs</NavLink>
```

## exact: bool

When `true`, the active class/style will only be applied if the location is matched exactly.

```js
<NavLink
  exact
  to="/profile"
>Profile</NavLink>
```

## strict: bool

When `true`, the trailing slash on a location's `pathname` will be taken into consideration when determining if the location matches the current URL. See the [`<Route strict>`](../../../react-router/docs/api/Route.md#strict-bool) documentation for more information.

```js
<NavLink
  strict
  to="/events/"
>Events</NavLink>
```

## isActive: func

A function to add extra logic for determining whether the link is active. This should be used if you want to do more than verify that the link's pathname matches the current URL's `pathname`.

```js
// only consider an event active if its event id is an odd number
const oddEvent = (match, location) => {
  if (!match) {
    return false
  }
  const eventID = parseInt(match.params.eventID)
  return !isNaN(eventID) && eventID % 2 === 1
}

<NavLink
  to="/events/123"
  isActive={oddEvent}
>Event 123</NavLink>
```

## location: object

The [`isActive`](#isactive-func) compares the current history location (usually the current browser URL).
To compare to a different location, a [`location`](../../../react-router/docs/api/location.md) can be passed.
