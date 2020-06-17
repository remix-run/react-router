# &lt;Link>

Provides declarative, accessible navigation around your application.

```jsx
<Link to="/about">About</Link>
```

## to: string

A string representation of the Link location, created by concatenating the location's pathname, search, and hash properties.

```jsx
<Link to="/courses?sort=name" />
```

## to: object

An object that can have any of the following properties:

- `pathname`: A string representing the path to link to.
- `search`: A string representation of query parameters.
- `hash`: A hash to put in the URL, e.g. `#a-hash`.
- `state`: State to persist to the `location`.

```jsx
<Link
  to={{
    pathname: "/courses",
    search: "?sort=name",
    hash: "#the-hash",
    state: { fromDashboard: true }
  }}
/>
```

## to: function

A function to which current location is passed as an argument and which should return location representation as a string or as an object

```jsx
<Link to={location => ({ ...location, pathname: "/courses" })} />
```

```jsx
<Link to={location => `${location.pathname}?sort=name`} />
```

## replace: bool

When `true`, clicking the link will replace the current entry in the history stack instead of adding a new one.

```jsx
<Link to="/courses" replace />
```

## innerRef: function

As of React Router 5.1, if you are using React 16 you should not need this prop because we [forward the ref](https://reactjs.org/docs/forwarding-refs.html) to the underlying `<a>`. Use a normal `ref` instead.

Allows access to the underlying `ref` of the component.

```jsx
<Link
  to="/"
  innerRef={node => {
    // `node` refers to the mounted DOM element
    // or null when unmounted
  }}
/>
```

## innerRef: RefObject

As of React Router 5.1, if you are using React 16 you should not need this prop because we [forward the ref](https://reactjs.org/docs/forwarding-refs.html) to the underlying `<a>`. Use a normal `ref` instead.

Get the underlying `ref` of the component using [`React.createRef`](https://reactjs.org/docs/refs-and-the-dom.html#creating-refs).

```jsx
let anchorRef = React.createRef()

<Link to="/" innerRef={anchorRef} />
```
## component: React.Component

If you would like utilize your own navigation component, you can simply do so by passing it through the `component` prop.

```jsx
const FancyLink = React.forwardRef((props, ref) => (
  <a ref={ref} {...props}>💅 {props.children}</a>
))

<Link to="/" component={FancyLink} />
```

## others

You can also pass props you'd like to be on the `<a>` such as a `title`, `id`, `className`, etc.
