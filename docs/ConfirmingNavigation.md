## Confirming Navigation

React Router provides a [`routerWillLeave` lifecycle hook](Glossary.md#routehook) that React [component](Glossary.md#component)s may use to prevent a transition from happening or to prompt the user before leaving a [route](Glossary.md#route). `routerWillLeave` may either 1) `return false` to cancel the transition or 2) `return` a prompt message that will prompt the user for confirmation before leaving the route.

To install this hook, use the `Lifecycle` mixin in one of your [route component](Glossary.md#routecomponent)s.

```js
import { Lifecycle } from 'react-router';

var Home = React.createClass({

  // Assuming Home is a route component, it may use the
  // Lifecycle mixin to get a routerWillLeave method.
  mixins: [ Lifecycle ],
  
  routerWillLeave(nextLocation) {
    if (!this.state.isSaved)
      return 'Your work is not saved! Are you sure you want to leave?';
  },

  // ...

});
```

If you need a `routerWillLeave` hook in a deeply nested component, simply use the `RouteContext` mixin in your [route component](Glossary.md#routecomponent) to put the `route` in context.

```js
import { Lifecycle, RouteContext } from 'react-router';

var Home = React.createClass({

  // Home should provide its route in context
  // for descendants further down the hierarchy.
  mixins: [ RouteContext ],

  render() {
    return <NestedForm />;
  }

});

var NestedForm = React.createClass({

  // Descendants use the Lifecycle mixin to get
  // a routerWillLeave method.
  mixins: [ Lifecycle ],

  routerWillLeave(nextLocation) {
    if (!this.state.isSaved)
      return 'Your work is not saved! Are you sure you want to leave?';
  },

  // ...

});
```
