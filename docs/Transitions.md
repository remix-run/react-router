## Transitions

TODO: talk about onEnter/onLeave

### Lifecycle Method

React Router provides a [`routerWillLeave` lifecycle hook](Glossary.md#routehook) that React [component](Glossary.md#component)s may use to prevent the user from leaving a [route](Glossary.md#route) by `return`ing either `false` or a prompt message.

To install this hook, use the `Lifecycle` mixin either directly in one of your [route component](Glossary.md#routecomponent)s or in a component further down the hierarchy whose [route component](Glossary.md#routecomponent) uses the `RouteContext` mixin.

```js
import { Lifecycle, RouteContext } from 'react-router';

// Assuming Home is a route component, it may use the
// Lifecycle mixin directly.
var Home = React.createClass({

  mixins: [ Lifecycle ],
  
  routerWillLeave(nextLocation) {
    if (!this.state.isSaved)
      return 'Your work is not saved! Are you sure you want to leave?';
  },

  // ...

});

// Otherwise, Home should provide its route in context
// for descendants further down the hierarchy.
var Home = React.createClass({

  mixins: [ RouteContext ],

  render() {
    return <NestedForm />;
  }

});

var NestedForm = React.createClass({

  mixins: [ Lifecycle ],

  routerWillLeave(nextLocation) {
    if (!this.state.isSaved)
      return 'Your work is not saved! Are you sure you want to leave?';
  },

  // ...

});
```
