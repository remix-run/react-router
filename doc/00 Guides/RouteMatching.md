## Route Matching

In order to determine which routes to render, React Router traverses the route hierarchy searching for a set of routes that match the URL. Routes have two attributes that determine whether or not they match: 1) a `path` and 2) nesting.

### Path Syntax

A route path is a string pattern that is used to match a URL (or a portion of one). Route paths are interpreted literally, except for the following special symbols:

- `:paramName` - specifies a portion of the URL up to the next `/`, `?`, or `#` that is captured as a named "param"
- `()` - specifies a portion of the URL that is optional
- `*` - matches all characters up to the next character in the pattern, or the end of the URL

    <Route path="/hello/:name">         // matches /hello/michael and /hello/ryan
    <Route path="/hello(/:name)">       // matches /hello, /hello/michael, and /hello/ryan
    <Route path="/files/*.*">           // matches /files/hello.jpg and /files/path/to/hello.jpg

### Nesting

Unlike most routers, React Router uses the concept of nested routes to let you declare nested sets of views that should be rendered when a given URL is invoked. Nested routes are arranged in a tree-like structure.

If a route uses a relative `path`, its `path` actually builds upon the accumulated `path` of its ancestors. Nested routes may opt-out of this behavior by using an absolute `path`. (Note: absolute paths may not be used in route config that is dynamically loaded. See [Advanced Usage][advanced]).

React Router traverses routes from the top of the hierarchy depth-first to find the deepest route in the hierarchy that matches the entire URL, stopping as soon as it finds one.

    <Route path="/users">               // matches /users
      <Route path=":id" />              // matches /users/5
      <Route path="/about" />           // matches /about
    </Route>

  [advanced]: AdvancedUsage.md
