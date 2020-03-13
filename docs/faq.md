# Frequently Asked Questions About React Router v6

Here are some questions that people commonly have about React Router v6:

## What happened to withRouter? I need it!

This question usually stems from the fact that you're using React class
components, which don't support hooks. In React Router v6, we fully embraced
hooks and use them to share all the router's internal state. But that doesn't
mean you can't use the router. Assuming you can actually use hooks (you're on
React 16.8+), you just need a wrapper.

```js
import { useLocation, useNavigate, useParams } from 'react-router-dom';

function withRouter(Component) {
   function ComponentWithRouterProp(props) {
     let location = useLocation();
     let navigate = useNavigate();
     let params = useParams();
     return (
       <Component
         {...props}
         router={{ location, navigate, params }}
       />
     );
   }

   return ComponentWithRouterProp;
}
```

## Why does `<Route>` have an `element` prop instead of `render` or `component`?

We mentioned this [in the migration guide from v5 to
v6](advanced-guides/migrating-5-to-6.md#advantages-of-route-element), but it's worth
repeating here.

In React Router v6 we switched from using v5's `<Route component>` and `<Route
render>` APIs to `<Route element>`. Why is that?

For starters, we see React itself taking the lead here with the `<Suspense
fallback={<Spinner />}>` API. The `fallback` prop takes a React **element**, not
a **component**. This lets you easily pass whatever props you want to your
`<Spinner>` from the component that renders it.

Using elements instead of components means we don't have to provide a
`passProps`-style API so you can get the props you need to your elements. For
example, in a component-based API there is no good way to pass props to the
`<Profile>` element that is rendered when `<Route path=":userId"
component={Profile} />` matches. Most React libraries who take this approach end
up with either an API like `<Route component={Profile} passProps={{ animate:
true }} />` or use a render prop or higher-order component.

Also, `Route`'s rendering API in v5 was rather large. As we worked on v4/5, the
conversation went something like this:

```js
// Ah, this is nice and simple!
<Route path=":userId" component={Profile} />

// But wait, how do I pass custom props to the <Profile> element??
// Hmm, maybe we can use a render prop in those situations?
<Route
  path=":userId"
  render={routeProps => (
    <Profile routeProps={routeProps} animate={true} />
  )}
/>

// Ok, now we have two ways to render something with a route. :/

// But wait, what if we want to render something when a route
// *doesn't* match the URL, like a Not Found page? Maybe we
// can use another render prop with slightly different semantics?
<Route
  path=":userId"
  children={({ match }) => (
    match ? (
      <Profile match={match} animate={true} />
    ) : (
      <NotFound />
    )
  )}
/>

// What if I want to get access to the route match, or I need
// to redirect deeper in the tree?
function DeepComponent(routeStuff) {
  // got routeStuff, phew!
}
export default withRouter(DeepComponent);

// Well hey, now at least we've covered all our use cases!
// ... *facepalm*
```

At least part of the reason for this API sprawl was that React did not provide
any way for us to get the information from the `<Route>` to your route element,
so we had to invent clever ways to get both the route data **and** your own
custom props through to your elements: `component`, render props, `passProps`
higher-order-components ... until **hooks** came along!

Now, the conversation above goes like this:

```js
// Ah, nice and simple API. And it's just like the <Suspense> API!
// Nothing more to learn here.
<Route path=":userId" element={<Profile />} />

// But wait, how do I pass custom props to the <Profile>
// element? Oh ya, it's just an element. Easy.
<Route path=":userId" element={<Profile animate={true} />} />

// Ok, but how do I access the router's data, like the URL params
// or the current location?
function Profile({ animate }) {
  let params = useParams();
  let location = useLocation();
}

// But what about components deep in the tree?
function DeepComponent() {
  // oh right, same as anywhere else
  let navigate = useNavigate();
}

// Aaaaaaaaand we're done here.
```

Another important reason for using the `element` prop in v6 is that `<Route
children>` is reserved for nesting routes. You can read more about this in [the
guide about getting started](installation/getting-started.md#nested-routes) with v6.

## How do I add a No Match (404) Route in react-router v6?

In v4 we would have just left the path prop off a route. In v5 we would have
wrapped our 404 element in a Route and used `path="*"`. In v6 use the new
element prop, pass `path="*"` instead:

```js
<Route path="*" element={<NoMatch />} />
```
