# &lt;NavLink> {id=navlink}

A special version of the [`<Link>`](#link) that will add styling attributes to the rendered element when it matches the current URL.

```js
import { NavLink } from 'react-router-dom'

<NavLink to="/about" activeClassName="active">About</NavLink>
```

## activeClassName: string _`<NavLink>`_ {id=navlink.activeclassname}

The class to give the element when it is active. There is no default active class. This will be joined with the `className` prop.

```js
<NavLink to="/faq" activeClassName="active">FAQs</NavLink>
```

## activeStyle: object _`<NavLink>`_ {id=navlink.activestyle}

The styles to apply to the element when it is active.

```js
<NavLink to="/faq" activeStyle={{ fontWeight: 'bold', color: 'red' }}>FAQs</NavLink>
```

## exact: bool _`<NavLink>`_ {id=navlink.exact}

When `true`, the active class/style will only be applied if the location is matched exactly.

```js
<NavLink exact to="/profile" activeClassName='active'>Profile</NavLink>
```

## strict: bool _`<NavLink>`_ {id=navlink.strict}

When `true`, the trailing slash on a location's `pathname` will be taken into consideration when determining if the location matches the current URL. See the [`<Route strict>`](#route.strict) documentation for more information.

```js
<NavLink strict to="/events/" activeClassName='active'>Events</NavLink>
```

## isActive: func _`<NavLink>`_ {id=navlink.isactive}

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
