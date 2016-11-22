# Link

Provides declarative, accessible navigation around your application.

```js
<Link to="/about" activeClassName="active">
  About
</Link>
```

## to: string | object _Link_

The pathname or location descriptor to link to.

```js
<Link to="/courses"/>
<Link to={{
  pathname: '/courses',
  query: { sort: 'name' },
  state: { fromDashboard: true }
}}/>
```

## activeStyle: object _Link_

An object of styles to apply to the element when the location matches
the link's `to` prop. It will be merged after a `style` prop object.

```js
<Link
  to="/courses"
  style={{ color: 'blue', background: 'gray' }}
  activeStyle={{ color: 'red' }}
/>
// will always have a gray background
// at /foo will be 'blue' (inactive)
// at /courses will be 'red' (active)
```

## activeClassName: string _Link_

A className to apply when the location matches the link's `to` prop.

```js
<Link
  to="/courses"
  className="course-link"
  activeClassName="active"
/>
// will always have "course-link"
// at /courses it will be "course-link active"
```

## activeOnlyWhenExact: bool _Link_

When true, the link will only apply `activeClassName` and `activeStyle`
if the link's `to` matches the `location` exactly.

```js
<Link to="/courses" activeOnlyWhenExact activeClassName="active"/>
// at /courses this will be active
// at /courses/123 it will not be active
```

## isActive: func _Link_

Allows for customized handling of whether or not the link is active.
Return `true` for active, `false` for inactive.

```js
<Link
  to="/"
  activeStyle={{ color: 'red' }}
  isActive={(location) => (
    // only be active if there is no query
    !Object.keys(location.query).length
  )}
/>

<Link
  to="/courses"
  activeStyle={{ color: 'red' }}
  isActive={(location, props) => (
    // make it active for "/courses" and "/course/123"
    // Even though it's not technically active, it is
    // theoretically for the sake of a navigation menu
    location.pathname.match(/course(s)?/)
  )}
/>
```

## location _Link_

If you don't want to use the location from context, you can pass the
location to match as a prop instead. Useful in redux apps for links deep
in the hierarchy.

```js
<Match pattern="/foo" location={this.props.location}/>
```

## replace: bool _Link_

When true, clicking the link will replace the current history state with
`replaceState` instead of adding a new history state with `pushState`.

```js
<Link to="/courses" replace/>
```
