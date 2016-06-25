# `<Link>`

Provides declarative, accessible navigation around your application.

```js
<Link to="/about" activeClassName="active">
  About
</Link>
```

## `to: string | object`

The pathname or location descriptor to link to.

```js
<Link to="/courses"/>
<Link to={{
  pathname: '/courses',
  query: { sort: 'name' },
  state: { fromDashboard: true }
}}/>
```

## `activeStyle: object`

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

## `activeClassName: string`

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

## `activeOnlyWhenExact: bool`

When true, the link will only apply `activeClassName` and `activeStyle`
if the link's `to` matches the `location` exactly.

```js
<Link to="/courses" activeOnlyWhenExact activeClassName="active"/>
// at /courses this will be active
// at /courses/123 it will not be active
```

## `location`

If you don't want to use the location from context, you can pass the
location to match as a prop instead.

```js
<Match pattern="/foo" location={{ pathname: '/foo' }}/>
```

# `</Link>`
