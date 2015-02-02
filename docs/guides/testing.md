React Router Testing
====================

Because the router relies heavily on the lesser known `context` feature
of React, it can be a pain in the neck to test your components that have
things like `<Link>` or mixin `State` and `Navigation`.

You simply have to stub out the context you need.

```js
// this will yell at you if you have `<Link>` and friends
React.render(<IndividualComponent/>, testElement);
```

You'll get something like:

```
"Warning: Required context `makePath` was not specified in `Link`. Check the render method of `IndividualComponent`."
"Warning: Required context `makeHref` was not specified in `Link`. Check the render method of `IndividualComponent`."
"Warning: Required context `transitionTo` was not specified in `Link`. Check the render method of `IndividualComponent`."
"Warning: Required context `replaceWith` was not specified in `Link`. Check the render method of `IndividualComponent`."
"Warning: Required context `goBack` was not specified in `Link`. Check the render method of `IndividualComponent`."
"Warning: Required context `getCurrentPath` was not specified in `Link`. Check the render method of `IndividualComponent`."
"Warning: Required context `getCurrentRoutes` was not specified in `Link`. Check the render method of `IndividualComponent`."
"Warning: Required context `getCurrentPathname` was not specified in `Link`. Check the render method of `IndividualComponent`."
"Warning: Required context `getCurrentParams` was not specified in `Link`. Check the render method of `IndividualComponent`."
"Warning: Required context `getCurrentQuery` was not specified in `Link`. Check the render method of `IndividualComponent`."
"Warning: Required context `isActive` was not specified in `Link`. Check the render method of `IndividualComponent`."
```

So we can just wrap up the thing we want to test in a different
component and stub out the `context` stuff.

```js
// wrap it up first:
var { func } = React.PropTypes;

var TestWrapper = React.createClass({
  childContextTypes: {
    makePath: func,
    makeHref: func,
    transitionTo: func,
    replaceWith: func,
    goBack: func,
    getCurrentPath: func,
    getCurrentRoutes: func,
    getCurrentPathname: func,
    getCurrentParams: func,
    getCurrentQuery: func,
    isActive: func,
  },

  getChildContext () {
    return {
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
you add some behavior to the stubbed context. It's also a lot of junk to
write, copy/paste this into your test utils to make things a bit easier:

```js
var stubRouterContext = (Component, props, stubs) => {
  return React.createClass({
    childContextTypes: {
      makePath: func,
      makeHref: func,
      transitionTo: func,
      replaceWith: func,
      goBack: func,
      getCurrentPath: func,
      getCurrentRoutes: func,
      getCurrentPathname: func,
      getCurrentParams: func,
      getCurrentQuery: func,
      isActive: func,
    },

    getChildContext () {
      return Object.assign({
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
      }, stubs);
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

