React Router in a Flux App
==========================

Circular Dependencies in Actions
--------------------------------

Oftentimes your actions need to call `transitionTo` on the router, you
can't just require your router instance as a module into your actions
because your routes require views which also require the actions,
creating a cycle indirectly.

`router.js -> routes.js -> SomeComponent.js -> actions.js -> router.js`

To avoid this, you can do one of three things:

1. Send the component to the action, think of it like `event.target` in
   DOM events if it bothers you.

    ```js
    var SomeActionCreators = require('./SomeActionCreators');
    var Something = React.createClass({
      mixins: [ Router.Navigation ],
      handleClick () {
        SomeActionCreators.doStuff({ sourceComponent: this });
      }
    });
    ```

   and then in `SomeActionCreators.doStuff` call
   `payload.sourceComponent.transitionTo(...)`

2. Use some sort of application container, or module container for the
   router instance.

    ```js
    // RouterContainer.js
    var _router = null;
    exports.set(router => _router = router);
    exports.get(() => _router);
    ```

    ```js
    // main bootstrap file, like main.js or whatever
    var RouterContainer = require('./RouterContainer');
    var routes = require('./routes');
    RouterContainer.set(Router.create({ routes }));
    ```

   and then in your `ActionCreators.js`

    ```js
    var RouterContainer = require('./RouterContainer');
    exports.doStuff = (payload) => {
      // stuff
      RouterContainer.get().transitionTo(...);
    }
    ```

3. Proxy calls to `router` instance and export the proxy early so action creators can `require` it.

    ```js
     // router.js
     // The trick is to assign module.exports before any require()s

     var router;

     module.exports = {
      getCurrentPath() {
        return router.getCurrentPath();
      },

      makePath(to, params, query) {
        return router.makePath(to, params, query);
      },

      makeHref(to, params, query) {
        return router.makeHref(to, params, query);
      },

      transitionTo(to, params, query) {
        router.transitionTo(to, params, query);
      },

      replaceWith(to, params, query) {
        router.replaceWith(to, params, query);
      },

      goBack() {
        router.goBack();
      },

      run(render) {
        router.run(render);
      }
    };

    // By the time route config is require()-d,
    // require('./router') already returns a valid object

    var routes = require('./routes'),
        Router = require('react-router');

    router = Router.create({
      routes: routes,
      location: Router.HistoryLocation
    });
    ```

   and then in your `ActionCreators.js`

    ```js
    var router = require('./router');
    exports.doStuff = (payload) => {
      // stuff
      router.transitionTo(...);
    }
    ```

    
Accessing route and params from action creators
---------------------------------

You can create your own `RouterStore` and fire an action in `run` callback:

```js
Router.run(routes, (Handler, state) => {
  ActionCreators.changeRoute({ state });
  React.render(<Handler/>, document.body);
});
```

Let `RouterStore` keep router state and add a public method to obtain it.  
This way your action creators and other stores can learn about current router state.

Handling route changes as actions
---------------------------------

If you'd like to handle route changes as actions, it could look
something like this:

```js
Router.run(routes, (Handler, state) => {
  ActionCreators.changeRoute({ Handler, state });
});
```

```js
// ActionCreators.js
exports.changeRoute = (payload) => {
  var { Handler } = payload;
  React.render(<Handler/>, document.body);
};
```

This is not how we use the router with flux, but to each their own.

