# &lt;NavLink>

A special version of the [`<Link>`](Link.md) that will add styling attributes to the rendered element when it matches the current URL.

```js
import { NavLink } from 'react-router-dom'

<NavLink to="/about" activeClassName="active">About</NavLink>
```

## activeClassName: string

The class to give the element when it is active. There is no default active class. This will be joined with the `className` prop.

```js
<NavLink to="/faq" activeClassName="active">FAQs</NavLink>
```

## activeStyle: object

The styles to apply to the element when it is active.

```js
<NavLink to="/faq" activeStyle={{ fontWeight: 'bold', color: 'red' }}>FAQs</NavLink>
```

## exact: bool

When `true`, the active class/style will only be applied if the location is matched exactly.

```js
<NavLink exact to="/profile" activeClassName='active'>Profile</NavLink>
```

## strict: bool

When `true`, the trailing slash on a location's `pathname` will be taken into consideration when determining if the location matches the current URL. See the [`<Route strict>`](../../react-router/docs/Route.md#strict-bool) documentation for more information.

```js
<NavLink strict to="/events/" activeClassName='active'>Events</NavLink>
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

<NavLink to="/events/123" isActive={oddEvent} activeClassName="active">Event 123</NavLink> 
```
