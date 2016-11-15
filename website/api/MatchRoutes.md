# MatchRoutes

Exclusively renders a route when the route's pattern matches the location.

```js
<MatchRoutes
  routes={arrayOf(route)}
  missComponent={componentFunc}
  renderMiss={func}
/>
```

**How is this different than just using `Match` and `Miss`?**

This component is unique in that it renders a route *exclusively*, where every `Match` that matches the location will render. Consider this code:

```js
<Match pattern="/about" component={About}/>
<Match pattern="/:user" component={User}/>
<Miss component={NoMatch}/>
```

If the url is `/about`, then both `About` and `User` will render because they both match the pathname. This is by design, allowing us to compose `Match` into our apps in many ways, like sidebars and breadcrumbs, bootstrap tabs, etc.

Occasionally, however, we want to exclusively render something. If we're at `/about` we don't want to also match `/:user`.  Here's how to do it with `MatchRoutes`.

```js
<MatchRoutes
  routes={[
    { pattern: '/', exact: true, component: Home },
    { pattern: '/about', component: About },
    { pattern: '/:user', component: User }
  ]}
  missComponent={NoMatch}
/>
```

Now, if we're at `/about`, `MatchRoutes` will start looking for a matching route, `/about` will match, it will stop looking for matching routes and the `About` component will render. `User` will not render because. `MatchRoutes` "exclusively" renders the first matching route.

This is also useful for animated transitions since the matched route is rendered in the same position as the previous route.

```js
<Fade>
  <MatchRoutes routes={routes}/>
  {/* there will only ever be on child here */}
</Fade>

<Fade>
  <Match/>
  <Match/>
  {/* there will always be two children here,
      one might render null though, making transitions
      a bit more cumbersome to work out */}
</Fade>
```

## routes: arrayOf(route) _MatchRoutes_

The first route to match the current location will be rendered. A "route" has just about the same properties that `<Match>` takes.

Here's the propType for `routes`.

```js
const routes = arrayOf(
  shape({
    pattern: string.isRequired,
    exact: bool,
    render: func,
    component: func
  })
)
```

Usage:

```js
<MatchRoutes
  routes={[
    { pattern: '/', exact: true, component: Home },
    { pattern: '/about', component: About },
    { pattern: '/:user', component: User }
  ]}
/>
```

## missComponent: componentFunc _MatchRoutes_

The component to render if none of the routes render. It will pass the
current `location` as a prop to the component.

```js
<MatchRoutes
  missComponent={NoMatch}
  routes={routes}
/>
```

## renderMiss: func _MatchRoutes_

A function that will be rendered if none of the routes match. Useful over `missComponent` when you need to wrap `MatchRoutes` or pass in extra props to the component rendered when there's a miss.

```js
<MatchRoutes
  render={(props) => <NoMatch {...props}/>}
  routes={routes}
/>
```
