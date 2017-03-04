# React Router [![Travis][build-badge]][build]

[build-badge]: https://img.shields.io/travis/ReactTraining/react-router/v4.svg?style=flat-square
[build]: https://travis-ci.org/ReactTraining/react-router

Declarative routing for [React](https://facebook.github.io/react).

React Router keeps your UI in sync with the URL. Make the URL your first thought, not an after-thought.

## Packages

This repository is a monorepo that we manage using [Lerna](https://github.com/lerna/lerna). That means that we actually publish [several packages](https://github.com/ReactTraining/react-router/tree/v4/packages) to npm from the same codebase, including: 

- `react-router` - The core of React Router ([API docs](packages/react-router/docs))
- `react-router-dom` - DOM bindings for React Router ([API docs](packages/react-router-dom/docs))
- `react-router-native` - [React Native](https://facebook.github.io/react-native/) bindings for React Router ([API docs](packages/react-router-native/docs))

While we're in beta, all packages are published to npm with the `next` tag. So you can install them with e.g.

`npm install --save react-router@next` or `yarn add react-router@next`

You can also install a specific router package via `react-router-[package]@next`.

## v4 FAQ

### Why a major version bump?

**tl;dr** Declarative Composability.

We've never been this excited about React Router. Like you, we've learned a lot about React since we first picked it up. We built a Router the best we knew how along the way. What we've learned most is that we love React because of its **declarative composability**.

As we looked at the router, it didn't work that way because of the static route configuration. You couldn't even wrap a Route!

```js
// NOPE!
const CoolRoute = (props) => <Route {...props} cool={true}/>
```

For apps to participate in rendering of route components, we had to create APIs we were never actually comfortable with, like `<Router createElement render>` and `createRouterMiddleware`. We took `createElement` away from you and had to give it back!

We had to recreate the lifecycle hooks with `onEnter`, `onLeave`, and `onChange`. React already has `componentWillMount`, `componentWillReceiveProps` and `componentWillUnmount`.

Route configs described your view hierarchy. Turns out, React components already describe view hierarchy.

To code-split, we had to introduce `getComponent` and `getChildRoutes`. Hot module replacement libs had to do specific hacks for routes to work. The list goes on and on.

React Router was not a "React router", it was a routing framework for React. An accidental framework with APIs that were not only redundant with React, but incredibly difficult to build an ecosystem around.

What did we do? We took everything we've learned and love about React (and still learning!) and applied it to routing. It started with the quest to actually render a `<Route>` (we used to just strip their props). It ended with removing the idea of routes completely (surprised us too) and a completely component based API, which actually means no API at all.

You control routing by rendering components and passing props. Finally, we have a solid base for us and others to build an ecosystem on top of.

In other words, it's Just React™ and you're going to love it.

### How long until another huge API overhaul?

We know things have been rocky for a lot of people regarding the router API, to the point that the router has a reputation for huge API overhauls.

We went back and audited the changes to the major versions.  From 0.13 to 1.0 there were huge, backwards incompatible, changes. From 1.0 to 2.0 there were some subtle, but fully backwards compatible changes, and 3.0 will be 2.0 but without any deprecation warnings.

It has been 18 months since the release of 1.0. So, if you've kept up with only the non-beta releases, you've only had to update your code once in a year and a half.

Our previous API was fighting against React. With v4, our only API is components that receive props, so, it's hard to imagine a big change again. Now that we're embracing (not fighting) React's declarative composability, we think this API will last as long as React itself, because that's all it is.

We're excited to create and encourage building an ecosystem of addons to this stable base. In the words of Cheng Lou, we've become more powerful (https://www.youtube.com/watch?v=mVVNJKv9esE).

### Why did you get rid of feature [x]?

We've been pulled a lot of directions with bleeding edge use-cases that nobody really has generic answers for: server rendering, code-splitting while avoiding waterfalls, anticipating streamed server rendering, loading data before rendering anything, etc. We unconsciously tried to solve this stuff when all we really want to be doing is keeping rendered UI in sync
with the url. That's our scope of responsibility.

By using components as our only API, features we had that are important to you can be implemented on top of these components.

We will be creating some addons and hope to see others too.

### What about scrolling?

We have some code close to being published that will manage the scroll positions of window and individual elements.

### What about route transition hooks? (example needed)

Because we are just components, you have the component lifecycle as transition hooks. They are completely parallel. The only difference is that the route transition hooks could be asynchronous. The problem with that was you weren't in the render lifecycle so you couldn't use React to indicate to the user something was happening.

```js
<Route onEnter={(_, cb) => {
  loadStuffForever(() => {
    // WHAT IS THE USER SEEING RIGHT NOW?
    cb()
  })
}}/>
```

One use case was loading data and waiting to render the next screen until the data landed. With a component, you can save the previous children, render them while loading, and then render your new children when you're done. We'll have an example of this eventually.

### I liked seeing all my routes in one place, now what?

Check out the "Route Config" example.

### I want to load data before rendering, now what?

See below

### The route config is important to the ecosystem, now what?

We have started an addon that we hope people who are interested in this will take ownership of here: https://github.com/ReactTraining/react-router-addons-routes

### What about upgrading?

We believe very strongly in iterative migration, not rewrites, for applications. We are working on a migration guide, but the basic strategy is that both versions will be runnable in tandem (due to npm limitations, we'll publish the previous version separately so both can be installed).

You will be able to take routes one-by-one and migrate them to the new API. Additionally, the config addon mentioned above may help out here. 

### Do I have to upgrade?

No. Leave your package.json at v2/3 and move on with your life. We'll be merging bug fixes for v2/3 indefinitely.

### We're Pumped!

We've received a ton of great feedback from people we really admire in the React community so we know we've found something special that's a bit unprecendented in the world of UI routing.

We've never been more excited about React Router. It's no longer a router for React, it is truly a React Router.

### Where are the examples?!?

The examples are now located under [the website](https://reacttraining.com/react-router/examples).

## Thanks

Thanks to [our sponsors](/SPONSORS.md) for supporting the development of React Router.

Also, thanks to [BrowserStack](https://www.browserstack.com/) for providing the infrastructure that allows us to run our build in real browsers.
