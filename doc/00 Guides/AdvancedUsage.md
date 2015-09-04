## Advanced Usage

React Router is great for small sites like [React.js Training](https://reactjs-training.com) ("React Router brought to you by ...") but it's built with websites like [facebook](https://www.facebook.com/) and [twitter](https://twitter.com/) in mind, too.

The biggest concern for large apps is the amount of JavaScript required to boot the app. Large apps should download only the JavaScript required to render the current view. Some people call this "code splitting", you split your code up into multiple bundles that are loaded on-demand as the visitor navigates around.

It's important that changes deep down in the application don't require changes all the way up top. Adding a route to the photo viewer should not affect the size of the initial JavaScript bundle the user downloads.  Neither should it cause merge conflicts as multiple teams have their fingers in the same, big route configuration file.

A router is the perfect place to handle code splitting: it's responsible for setting up your views.

React Router does all of its path matching and component resolving asynchronously, which allows you to not only load up the components lazily, *but also lazily load the route configuration*. You really only need one route definition in your initial bundle, the router will resolve the rest on demand.

Routes may define `getChildRoutes` and `getComponents` methods. These are asynchronous and only called when needed. We call it "gradual matching". React Router will gradually match the URL and fetch only the amount of route configuration and components it needs to match the path and render.

Coupled with a smart code splitting tool like [webpack](http://webpack.github.io/), a once tireless architecture is now simple and declarative.

```js
var CourseRoute = {
  path: 'course/:courseId',

  getChildRoutes(location, callback) {
    require.ensure([], function (require) {
      callback(null, [
        require('./routes/Announcements'),
        require('./routes/Assignments'),
        require('./routes/Grades'),
      ])
    })
  },

  getComponents(callback) {
    require.ensure([], function (require) {
      callback(null, require('./components/Course'))
    })
  }
};
```

Now go look at what hacks you have in place to do this. Just kidding, I don't want to make you sad right now.

Check out the [huge apps][huge] example in the repository with your web inspector open and watch code get loaded in as you navigate around the demo.

  [huge]:/examples/huge-apps
