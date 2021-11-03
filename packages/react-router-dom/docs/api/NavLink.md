# &lt;NavLink>

A special version of the [`<Link>`](Link.md) that will add styling attributes to the rendered element when it matches the current URL.

```jsx
<NavLink to="/about">About</NavLink>
```

## className: string | func

`className` can either be a string or a function that returns a string. If the function `className` is used, the link's `active` state is passed as a parameter. This is helpful if you want to exclusively apply a `className` to an inactive link.

```jsx
<NavLink
  to="/faq"
  className={isActive =>
    "nav-link" + (!isActive ? " unselected" : "")
  }
>
  FAQs
</NavLink>
```

In React Router v6, `activeClassName` will be removed and you should use the function `className` to apply classnames to either active or inactive `NavLink` components.

## activeClassName: string

The class to give the element when it is active. The default given class is `active`. This will be joined with the `className` prop.

```jsx
<NavLink to="/faq" activeClassName="selected">
  FAQs
</NavLink>
```

## style: object | func

`style` can either be a `React.CSSProperties` object or a function that returns a style object. If the function `style` is used, the link's `active` state is passed as a parameter.

```jsx
<NavLink
  to="/faq"
  style={isActive => ({
    color: isActive ? "green" : "blue"
  })}
>
  FAQs
</NavLink>
```

In React Router v6, `activeStyle` will be removed and you should use the function `style` to apply inline styles to either active or inactive `NavLink` components.

## activeStyle: object

The styles to apply to the element when it is active.

```jsx
<NavLink
  to="/faq"
  activeStyle={{
    fontWeight: "bold",
    color: "red"
  }}
>
  FAQs
</NavLink>
```

## exact: bool

When `true`, the active class/style will only be applied if the location is matched exactly.

```jsx
<NavLink exact to="/profile">
  Profile
</NavLink>
```

## strict: bool

When `true`, the trailing slash on a location's `pathname` will be taken into consideration when determining if the location matches the current URL. See the [`<Route strict>`](../../../react-router/docs/api/Route.md#strict-bool) documentation for more information.

```jsx
<NavLink strict to="/events/">
  Events
</NavLink>
```

## isActive: func

A function to add extra logic for determining whether the link is active. This should be used if you want to do more than verify that the link's pathname matches the current URL's `pathname`.

```jsx
<NavLink
  to="/events/123"
  isActive={(match, location) => {
    if (!match) {
      return false;
    }

    // only consider an event active if its event id is an odd number
    const eventID = parseInt(match.params.eventID);
    return !isNaN(eventID) && eventID % 2 === 1;
  }}
>
  Event 123
</NavLink>
```

## location: object

The [`isActive`](#isactive-func) compares the current history location (usually the current browser URL).
To compare to a different location, a [`location`](../../../react-router/docs/api/location.md) can be passed.

## aria-current: string

The value of the `aria-current` attribute used on an active link. Available values are:

- `"page"` - used to indicate a link within a set of pagination links
- `"step"` - used to indicate a link within a step indicator for a step-based process
- `"location"` - used to indicate the image that is visually highlighted as the current component of a flow chart
- `"date"` - used to indicate the current date within a calendar
- `"time"` - used to indicate the current time within a timetable
- `"true"` - used to indicate if the NavLink is active
- `"false"` - used to prevent assistive technologies from reacting to a current link (a use case would be to prevent multiple aria-current tags on a single page)

Defaults to `"page"`.

Based on [WAI-ARIA 1.1 specifications](https://www.w3.org/TR/wai-aria-1.1/#aria-current)
