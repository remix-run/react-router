React Router in a Flux App
==========================

Circular Dependencies in Actions
--------------------------------

Oftentimes your actions need to call `transitionTo` on the router, you
can't just require your router instance as a module into your actions
because your routes require views which also require the actions,
creating a cycle indirectly.

`router.js -> routes.js -> SomeComponent.js -> actions.js -> router.js`

To avoid this, you can do one of two things:

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

