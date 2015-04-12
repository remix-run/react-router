React Router Testing
====================

Because the router relies heavily on the lesser known `context` feature
of React, it can be a pain in the neck to test your components that have
things like `<Link>` or rely on `this.context.router`.

You simply have to stub out the context you need.

```js
// this will yell at you if you have `<Link>` and friends
React.render(<IndividualComponent/>, testElement);
```

You'll get something like:

```
"Warning: Required context `router` was not specified in `Link`. Check the render method of `IndividualComponent`."
```

So we can just wrap up the thing we want to test in a different
component and stub out the `context` stuff.

```js
// add whichever router methods your component uses:
function RouterStub() { }
RouterStub.makePath = function () { }

// wrap it up:
var TestWrapper = React.createClass({
  childContextTypes: {
    router: React.PropTypes.func
  },

  getChildContext () {
    return {
      router: RouterStub
    };
  },

  render () {
    return <IndividualComponent/>
  }
});

// okay, now it'll work:
React.render(<TestWrapper/>, testElement);
```

This is handy because now you can force the code down certain paths if
you add some behavior to the stubbed context. But It's also a lot of junk to
write.

`stubRouterContext`
-------------------

Copy/paste this helper into your test utils to make things a bit easier:

```js
var stubRouterContext = (Component, props, stubs) => {
  function RouterStub() { }

  Object.assign(RouterStub, {
    makePath () {},
    makeHref () {},
    transitionTo () {},
    replaceWith () {},
    goBack () {},
    getCurrentPath () {},
    getCurrentRoutes () {},
    getCurrentPathname () {},
    getCurrentParams () {},
    getCurrentQuery () {},
    isActive () {},
    getRouteAtDepth() {},
    setRouteComponentAtDepth() {}
  }, stubs)

  return React.createClass({
    childContextTypes: {
      router: React.PropTypes.func,
      routeDepth: React.PropTypes.number
    },

    getChildContext () {
      return {
        router: RouterStub,
        routeDepth: 0
      };
    },

    render () {
      return <Component {...props} />
    }
  });
};
```

Now your tests are much simpler:

```js
var stubRouterContext = require('./stubRouterContext');
var IndividualComponent = require('./IndividualComponent');
var Subject = stubRouterContext(IndividualComponent, {someProp: 'foo'});
React.render(<Subject/>, testElement);
```

You can also send code down certain paths if you'd like by supplying
behavior to the stubbed context:

```js
var Subject = stubRouterContext(IndividualComponent, {prop: 'foo'}, {
  getCurrentQuery () {
    return { modal: true };
  }
});
```

Now your test will think it got `?modal=true` in the URL, even though
there is no URL in the test.

Why is `stubRouterContext` not in the project?
----------------------------------------------

I dunno.

