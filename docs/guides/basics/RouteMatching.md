# Route Matching

A [route](/docs/Glossary.md#route) has three attributes that determine whether or not it "matches" the URL:  

1. [nesting](#nesting) and
2. its [`path`](#path-syntax)
3. its [precedence](#precedence)

### Nesting
React Router uses the concept of nested routes to let you declare nested sets of views that should be rendered when a given URL is invoked. Nested routes are arranged in a tree-like structure. To find a match, React Router traverses the [route config](/docs/Glossary.md#routeconfig) depth-first searching for a route that matches the URL.

### Path Syntax
A route path is [a string pattern](/docs/Glossary.md#routepattern) that is used to match a URL (or a portion of one). Route paths are interpreted literally, except for the following special symbols:

  - `:paramName` – Matches a URL segment and captures a param. The matched segment depends on the **parameter rule**. If no rule is provided, it defaults to the string matcher ([^/?#]+). The matched string is called a [param](/docs/Glossary.md#params)
  - `()` – Wraps a portion of the URL that is optional
  - `*` – Matches all characters (non-greedy) up to the next character in the pattern, or to the end of the URL if there is none, and creates a `splat` [param](/docs/Glossary.md#params)
  - `**` - Matches all characters (greedy) until the next `/`, `?`, or `#` and creates a `splat` [param](/docs/Glossary.md#params)

```js
<Route path="/hello/:name">         // matches /hello/michael and /hello/ryan
<Route path="/hello(/:name)">       // matches /hello, /hello/michael, and /hello/ryan
<Route path="/files/*.*">           // matches /files/hello.jpg and /files/hello.html
<Route path="/**/*.jpg">            // matches /files/hello.jpg and /files/path/to/file.jpg
```

If a route uses a relative `path`, it builds upon the accumulated `path` of its ancestors. Nested routes may opt-out of this behavior by [using an absolute `path`](RouteConfiguration.md#decoupling-the-ui-from-the-url).

### Parameter Rules

If a parameter is defined in the form of `:parameterName` in the path, you might want to specify specific parsing rules for it. The [`params`](/docs/API.md#route-params) prop defined on the Route allows you to do so. if for example you want to match only integers for a specific parameter, you can decalare your route like this:

````js
import { int } from 'react-router/rules'

<Route path="/:id" params={{id: int()}}> // matches /123 but not /abc
````

not only the Route will match only the desired input, but the `props.params.id` on the Component will be converted to a `Number` automatically.

The `params` prop of a parent route get passed to the children by merging the two params object together:

````js
import { int } from 'react-router/rules'

<Route path=":/" params={{id: int()}}>
  <Route path=":id" > // matches /123 but not /abc
</Route>
````

#### Existing rules

- `int({ max, min, fixedLength })`:  This rule matches non negative integers and returns the parsed string as a number. The following arguments can be specified to further refine the parameter matching:
  - `fixedLength` specifies the precise length of the argument
  - `max` specifies the minimum value assignable
  - `min` specifies the maximum value assignable
- `string({ maxLength, minLength, length })`: This rule matches any character except the forward slashes. This is the default rule when nothing else is specified. you can use the following arguments:
  - `length` specifies the precise length of the argument
  - `minLength` specifies the minimum length for the argument
  - `maxLength` specifies the maximum length for the argument
- `greedySplat()`: This rule behaves exactly like `**`. You might want to use this definition instead of `**` when you want to specify a differnt parameter name other than the default `splat` that is used with `**`
- `splat()` This rule behaves exactly like `*`
- `any(...values)`: This rule mathces only if the parmeter value is specified in the values array passed as argument
- `uuid()`: This rule matches only values that are valid **UUIDs**

#### Creating a custom rule

You can create your custom rules to validate parameters. Here is an example on how to do so:

````js
import { createRule } from 'react-router/rules'

var array = createRule({
  regex: '(\\[(?:\\w+,)*\\w*\\])',
  convert: (v) => {
    let result = []
    let matcher = /(\w+)/g
    let match
    while((match = matcher.exec(v))) result.push(match[1])
    return match
  }
})
````

The following rule will matches paths that are specified as list of comma-separated values and it will pass an array of the values to the props. It can be then used in the following fashion:

````js
<Route path="images/:tags" params={{ tags: array }} component={Images}>
````

For example, The route will match '/images/[top, funny]' and it will set `props.params.tags = ['top', 'funny']` on the component.

`createRule` is a utility method that helps defining rules. if the object passed as parameter doesn't contain one of the following properties, a default will be used:

- `regex` defaults to `([^/?#]+)` (the string matcher)
- `validate` defaults to `(() => true)`
- `convert` defaults to `((val) => val)` (the identity function)

### Precedence
Finally, the routing algorithm attempts to match routes in the order they are defined, top to bottom. So, when you have two sibling routes you should be sure the first doesn't match all possible `path`s that can be matched by the later sibling. For example, **don't** do this:

```js
<Route path="/comments" ... />
<Redirect from="/comments" ... />
```
