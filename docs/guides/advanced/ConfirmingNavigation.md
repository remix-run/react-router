# Confirming Navigation

React Router provides a [`routerWillLeave` lifecycle hook](/docs/Glossary.md#routehook) that React [component](/docs/Glossary.md#component)s may use to prevent a transition from happening or to prompt the user before leaving a [route](/docs/Glossary.md#route). [`routerWillLeave`](/docs/API.md#routerwillleavenextlocation) may either:  

1. `return false` to cancel the transition or
2. `return` a prompt message that will prompt the user for confirmation before leaving the route.

To install this hook, use the `Lifecycle` mixin in one of your [route component](/docs/Glossary.md#routecomponent)s.

```js
import { Lifecycle } from 'react-router'

const Home = React.createClass({

  // Assuming Home is a route component, it may use the
  // Lifecycle mixin to get a routerWillLeave method.
  mixins: [ Lifecycle ],

  routerWillLeave(nextLocation) {
    if (!this.state.isSaved)
      return 'Your work is not saved! Are you sure you want to leave?'
  },

  // ...

})
```

If you are using ES6 classes for your components, you can use [react-mixin](https://github.com/brigand/react-mixin) to add the `Lifecycle` mixin to your component, but we recommend using `React.createClass` for components that set up router lifecycle hooks.

If you need a [`routerWillLeave`](/docs/API.md#routerwillleavenextlocation) hook in a deeply nested component, simply use the [`RouteContext`](/docs/API.md#routecontext-mixin) mixin in your [route component](/docs/Glossary.md#routecomponent) to put the `route` in context.

```js
import { Lifecycle, RouteContext } from 'react-router'

const Home = React.createClass({

  // Home should provide its route in context
  // for descendants further down the hierarchy.
  mixins: [ RouteContext ],

  render() {
    return <NestedForm />
  }

})

const NestedForm = React.createClass({

  // Descendants use the Lifecycle mixin to get
  // a routerWillLeave method.
  mixins: [ Lifecycle ],

  routerWillLeave(nextLocation) {
    if (!this.state.isSaved)
      return 'Your work is not saved! Are you sure you want to leave?'
  },

  // ...

})
```
