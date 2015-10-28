# Route Matching

A [route](/docs/Glossary.md#route) has three attributes that determine whether or not it "matches" the URL:  

1. [nesting](#nesting) and
2. its [`path`](#path-syntax)
3. its [precedence](#precedence)

### Nesting
React Router uses the concept of nested routes to let you declare nested sets of views that should be rendered when a given URL is invoked. Nested routes are arranged in a tree-like structure. To find a match, React Router traverses the [route config](/docs/Glossary.md#routeconfig) depth-first searching for a route that matches the URL.

### Path Syntax
A route path is [a string pattern](/docs/Glossary.md#routepattern) that is used to match a URL (or a portion of one). Route paths are interpreted literally, except for the following special symbols:

  - `:paramName` – matches a URL segment up to the next `/`, `?`, or `#`. The matched string is called a [param](/docs/Glossary.md#params)
  - `()` – Wraps a portion of the URL that is optional
  - `*` – Matches all characters (non-greedy) up to the next character in the pattern, or to the end of the URL if there is none, and creates a `splat` [param](/docs/Glossary.md#params)
  - `**` - Matches all characters (greedy) until the next `/`, `?`, or `#` and creates a `splat` [param](/docs/Glossary.md#params)

```js
<Route path="/hello/:name">         // matches /hello/michael and /hello/ryan
<Route path="/hello(/:name)">       // matches /hello, /hello/michael, and /hello/ryan
<Route path="/files/*.*">           // matches /files/hello.jpg and /files/path/to/hello.jpg
<Route path="/**/*.jpg">            // matches /files/hello.jpg and /files/path/to/file.jpg
```

If a route uses a relative `path`, it builds upon the accumulated `path` of its ancestors. Nested routes may opt-out of this behavior by [using an absolute `path`](RouteConfiguration.md#decoupling-the-ui-from-the-url).

### Precedence
Finally, the routing algorithm attempts to match routes in the order they are defined, top to bottom. So, when you have two sibling routes you should be sure the first doesn't match all possible `path`s that can be matched by the later sibling. For example, **don't** do this:

```js
<Route path="/comments" ... />
<Redirect from="/comments" ... />
```
