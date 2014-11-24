React Router in a Flux App
==========================

```js
///////////////////////////////////////////////////////////
// router.js
var routes = require('./routes');
var Router = require('react-router');

// we can create a router instance before "running" it
var router = Router.create({
  routes: routes,
  location: Router.HistoryLocation
});

module.exports = router;

///////////////////////////////////////////////////////////
//SomeActions.js

// and then action creators can require it like other
// singletons in the app (or if you don't use singletons,
// do something else with the router you created in
// router.js)
var router = require('../router');

module.exports = {
  doSomeTransitionThing: function () {
    router.transitionTo('somewhere');
  }
};

///////////////////////////////////////////////////////////
// main.js

// finally, run it in your main script
var React = require('react');
var router = require('./router');
router.run(function (Handler, state) {
  // you might want to push the state of the router to a
  // store for whatever reason
  RouterActions.routeChange({routerState: state});
  React.render(<Handler/>, document.body);
});
```

