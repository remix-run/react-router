# Link

Provides declarative, accessible navigation around your application.

```js
<Link to="/about">About</Link>
```

## to: string | object _Link_

The pathname or location to link to.

```js
<Link to="/courses"/>
<Link to={{
  pathname: '/courses',
  search: '?sort=name',
  state: { fromDashboard: true }
}}/>
```

## replace: bool _Link_

When true, clicking the link will replace the current history state with `replaceState` instead of adding a new history state with `pushState`.

```js
<Link replace to="/courses"/>
```

## location: object _Link_

If you don't want to use the location from context, you can pass the location to match as a prop instead. Useful in redux apps for links deep in the hierarchy.

```js
<Link to="/foo" location={location}/>
```
