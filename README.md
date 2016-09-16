# React Router [![Travis][build-badge]][build]

[build-badge]: https://img.shields.io/travis/ReactTraining/react-router/v4.svg?style=flat-square
[build]: https://travis-ci.org/ReactTraining/react-router

<img src="/logo/Vertical@2x.png" height="150"/>

Declarative routing for [React](https://facebook.github.io/react).

React Router keeps your UI in sync with the URL. Make the URL your first thought, not an after-thought.

## Installation

Using [npm](https://www.npmjs.com/):

    $ npm install --save react-router@next

Then with a module bundler like [webpack](https://webpack.github.io/), use as you would anything else:

```js
// using an ES6 transpiler, like babel
import { BrowserRouter, Match, Link } from 'react-router'

// not using an ES6 transpiler
var BrowserRouter = require('react-router').BrowserRouter
var Match = require('react-router').Match
var Link = require('react-router').Link
```

The UMD build is also available on [unpkg](https://unpkg.com):

```html
<script src="https://unpkg.com/react-router@next/umd/react-router.min.js"></script>
```

You can find the library on `window.ReactRouter`.

## Docs

Please read [our docs here](https://react-router-website-xvufzcovng.now.sh/).

## v4 FAQ

### Why the huge change? (AGAIN?!)

**tl;dr** Declarative Composability.

We've never been this excited about React Router. Like you, we've
learned a lot about React since we first picked it up. We built a Router
the best we knew how along the way. What we've learned most is that we
love React because of its **declarative composability**.

As we looked at the router, it didn't work that way because of the
static route configuration. You couldn't even wrap a Route!

```js
// NOPE!
const CoolRoute = (props) => <Route {...props} cool={true}/>
```

For apps to participate in rendering of route components, we had to
create APIs we were never actually comfortable with, like `<Router
createElement render>` and `createRouterMiddleware`. We took
`createElement` away from you and had to give it back!

We had to recreate the lifecycle hooks with `onEnter`, `onLeave`, and
`onChange`. React already has `componentWillMount`,
`componentWillReceiveProps` and `componentWillUnmount`.

Route configs described your view hierarchy. Turns out, React components
already describe view hierarchy.

To code-split, we had to introduce `getComponent` and `getChildRoutes`.
Hot module replacement libs had to do specific hacks for routes to work.
The list goes on and on.

React Router was not a React router, it was a routing framework for
React. An accidental framework with APIs that were not only redundant
with React, but incredibly difficult to build an ecosystem around.

What did we do? We took everything we've learned and love about React
(and we're still learning!) and applied it to routing. It started with
the quest to actually render a `<Route>` (we used to just strip their
props). It ended with removing the idea of routes completely (surprised
us too) and a completely component based API, which actually means no
API at all.

You control routing by rendering components and passing props. Finally,
we have a solid base for us and others to build an ecosystem on top of.

In other words, it's Just React™ and you're going to love it.

### How long until another huge API overhaul?

We know things have been rocky. Our previous API was fighting against
React, causing a ton of churn. With v4, our only API is components that
receive props, so, it's hard to imagine a big change again. Now that
we're embracing (not fighting) React's declarative composability, we
think this API will last as long as React itself, because that's all it
is.

Not only that, but we're excited to create and encourage building an
ecosystem of addons to this stable base.

### Why did you get rid of feature [x]?

We've been pulled a lot of directions with bleeding edge use-cases that
nobody really has generic answers for: server rendering, code-splitting
while avoiding waterfalls, anticipating streamed server rendering, loading
data before rendering anything, etc. We unconsciously tried to solve this
stuff when all we really want to be doing is keeping rendered UI in sync
with the url. That's our scope of responsibility.

By using components as our only API, features we had that are important
to you can be implemented on top of these components.

We will be creating some addons and hope to see others too.

### What about scrolling?

We have some code close to being published that will manage the scroll
positions of window and individual elements.

### What about Redux?

We have a `<ControlledRouter>` close to being published that makes redux
integration with React Router the same as ... uh ... integrating an
`<input>` with Redux.

### What about route transition hooks? (example needed)

Because we are just components, you have the component lifecycle as
transition hooks. They are completely parallel. The only difference is
that the route transition hooks could be asynchronous. The problem with
that was you weren't in the render lifecycle so you couldn't use React
to indicate to the user something was happening.

```js
<Route onEnter={(_, cb) => {
  loadStuffForever(() => {
    // WHAT IS THE USER SEEING RIGHT NOW?
    cb()
  })
}}/>
```

One use case was loading data and waiting to render the next screen
until the data landed. With a component, you can save the previous
children, render them while loading, and then render your new children
when you're done. We'll have an example of this eventually.

### I liked seeing all my routes in one place, now what?

Check out the "Route Config" example.

### I want to load data before rendering, now what?

See below

### The route config is important to the ecosystem, now what?

We will be providing a package that will prescribe a route config for
others to build on. It will also provide a function that will match a
location to the route config and return the routes that match, allowing
you to do things (like data loading) before an initial render.

### What about upgrading?

We believe very strongly in iterative migration, not rewrites, for
applications. We are working on a migration guide, but the basic
strategy is that both versions will be runnable in tandem (due to npm
limitations, we'll publish the previous version separately so both can
be installed).

You will be able to take routes one-by-one and migrate them to the new
API. Additionally, the config addon mentioned above may help out here.

### We're Pumped!

We've received a ton of great feedback from people we really admire in
the React community so we know we've found something special that's a
bit unprecendented in the world of UI routing.

We've never been more excited about React Router. It's no longer a
router for React, it is truly a React Router.



## Thanks

Thanks to [our sponsors](/SPONSORS.md) for supporting the development of React Router.

Also, thanks to [BrowserStack](https://www.browserstack.com/) for providing the infrastructure that allows us to run our build in real browsers.
