# Migrating 从 v2/v3 到 v4

React Router v4 完全重写，所以没有简单的迁移路径。本指南将为您提供一些步骤，以帮助您了解如何升级您的应用程序

**注意：**本迁移指南适用于 React Router v2 和 v3，但为简洁起见，对以前版本的引用仅提及 v3。

**react-router-redux 使用者注意：** 并非所有的 package 都与 React Router v4 兼容或具有完整的功能。 尤其是，Redux DevTools 中的 time travel 在最新的 react-router-redux 中尚不可用（当前版本为 alpha）。

* [The Router](#the-router)
* [Routes](#routes)
  * [Nesting Routes](#nesting-routes)
  * [on* properties](#on-properties)
  * [Switch](#switch)
  * [Redirect](#redirect)
* [PatternUtils](#patternutils)
* [Link](#link)

## Router

在 React Router v3 中， 有一个  `<Router>`  组件。它有一个 ` history ` 对象的属性.

同样，你可以将应用程序的路由配置提供给 ```<Router>``` 而不用 `routes` 属性 或  `<Router>` 的 ```<children>```。

```jsx
// v3
import routes from './routes'
<Router history={browserHistory} routes={routes} />
// or
<Router history={browserHistory}>
  <Route path='/' component={App}>
    // ...
  </Route>
</Router>
```

在 React Router v4 中有一个重大变更，那就是有了许多不同的路由器组件。每个组件都为你添加了一个 `history` 对象。  `<BrowserRouter>` 组件添加了 browser history，  `<HashRouter>` 组件添加了一个  hash history，  `<MemoryRouter>` 添加了 memory history。

在 v4 中， 没有集中路由配置。你需要根据 router 渲染内容，你将只需要渲染一个 `<Route>` 组件。

```jsx
//v4
<BrowserRouter>
  <div>
    <Route path='/about' component={About} />
    <Route path='/contact' component={Contact} />
  </div>
</BrowserRouter>
```

有一点需要注意的是，路由器组件只能有一个子元素。

```jsx
// yes
<BrowserRouter>
  <div>
    <Route path='/about' component={About} />
    <Route path='/contact' component={Contact} />
  </div>
</BrowserRouter>

// no
<BrowserRouter>
  <Route path='/about' component={About} />
  <Route path='/contact' component={Contact} />
</BrowserRouter>
```

## Routes

在 v3 中， `<Route>` 不是一个正真意义上的组件。相反，你所有的应用程序的 `<Route>` 都只是一个用来创建路由配置的对象。

```jsx
/// in v3 the element
<Route path='contact' component={Contact} />
// was equivalent to
{
  path: 'contact',
  component: Contact
}
```

在 v4 中， 你就像平常的React应用程序那样布置你的 app 组件。 在任何你想要根据 location 渲染内容的地方（特别是，它的 `pathname`）， 渲染一个 `<Route>`。

 v4 `<Route>` 是一个真实的组件， 所以无论你在哪里渲染 `<Route>` 组件， 它的内容都会被渲染。当 `<Route>`  的  `path` 匹配了当前的 location， 它就会使用 （`component`， `render`， 或 `children` ）渲染属性来渲染。 当 `<Route>` 的`path` 没有匹配， 它就会渲染 `null`。

### Nesting Routes

在 v3 中，通过将 `<Route> ` 作为其它 `<Route>` 父级进行嵌套。

```jsx
<Route path='parent' component={Parent}>
  <Route path='child' component={Child} />
  <Route path='other' component={Other} />
</Route>
```

当一个嵌套的 `<Route>` 匹配， React 元素将使用子级和父级的组件进行渲染。 子元素将作为 `children` 属性传递给父元素。

```jsx
<Parent {...routeProps}>
  <Child {...routeProps} />
</Parent>
```

 在 v4 中，子代的 `<Route>` 应该被父级的 `<Route>` 组件渲染。

```jsx
<Route path='parent' component={Parent} />

const Parent = () => (
  <div>
    <Route path='child' component={Child} />
    <Route path='other' component={Other} />
  </div>
)
```

### `on*` properties

React Router v3 提供了 `onEnter`， `onUpdate`，和 `onLeave` 方法。 这些方法基本上重建了React的生命周期。

在 v4 中，你需要使用由 `<Route>` 渲染的组件的生命周期函数。你应该用 `componentDidMount` 或者 `componentWillMount`， 而不是 `onEnter`。在你需要使用 `onUpdate`的地方，你可以使用 `componentDidUpdate` 或者 `componentWillUpdate` （或也可以是 `componentWillReceiveProps`）。 `onLeave` 可以替代 `componentWillUnmount`。

### `<Switch>`

在 v3 中， 你可以指定一些子路由，从而只有第一个匹配的会被渲染。

```jsx
// v3
<Route path='/' component={App}>
  <IndexRoute component={Home} />
  <Route path='about' component={About} />
  <Route path='contact' component={Contact} />
</Route>
```

v4 提供了一个泛函性的相似于`<Switch>` 的组件。 当一个 `<Switch>` 被渲染，它会只渲染第一个匹配当前地址的子组件 `<Route>` 。

```jsx
// v4
const App = () => (
  <Switch>
    <Route exact path='/' component={Home} />
    <Route path='/about' component={About} />
    <Route path='/contact' component={Contact} />
  </Switch>
)

```

### `<Redirect>`

在 v3 中， 如果你想从一个路径重定向到另一个路径，例如从 instance / 重定向到 /welcome， 你应该使用 `<IndexRedirect >`。

```jsx
// v3
<Route path="/" component={App}>
  <IndexRedirect to="/welcome" />
</Route>

```

在 v4 中，你可以使用`<Redirect>` 实现相同的功能。

```jsx
// v4
<Route exact path="/" render={() => <Redirect to="/welcome" component={App} />} />

<Switch>
  <Route exact path="/" component={App} />
  <Route path="/login" component={Login} />
  <Redirect path="*" to="/" />
</Switch>

```

在 v3 中， `<Redirect>` 保留了查询字符串：

```jsx
// v3

<Redirect from="/" to="/welcome" />
// /?source=google → /welcome?source=google
```

在 v4 中， 您必须将这些属性重新传递给`to` 属性：

```jsx
// v4

<Redirect from="/" to="/welcome" />
// /?source=google → /welcome

<Redirect from="/" to={{ ...location, pathname: "/welcome" }} />
// /?source=google → /welcome?source=google
```

## PatternUtils

### matchPattern(pattern, pathname)
在 v3 中，你可以使用相同的匹配代码来检查路径是否匹配。在 v4 中 它已经被  [matchPath](/packages/react-router/docs/api/matchPath.md) 所替代，它由  [path-to-regexp](https://github.com/pillarjs/path-to-regexp) 库提供支持。

### formatPattern(pattern, params)
在 v3 中，你可以使用 PatternUtils.formatPattern 从路径模式中生成有效路径(也许是一个常量或你的主路由配置) 和一个包含 names 参数的对象：

```jsx
// v3
const THING_PATH = '/thing/:id';

<Link to={PatternUtils.formatPattern(THING_PATH, {id: 1})}>A thing</Link>
```

在 v4 中, 你可以使用 [path-to-regexp](https://github.com/pillarjs/path-to-regexp) 中的 [compile](https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp) 来实现相同的效果。

```jsx
// v4
const THING_PATH = '/thing/:id';

const thingPath = pathToRegexp.compile(THING_PATH);

<Link to={thingPath({id: 1})}>A thing</Link>
```

## Link

### `to` property is required
在 v3 中，你可以省略 `to` 属性 或 将其设置为null以创建不带 href 属性的锚标签。

```jsx
// v3
<Link to={disabled ? null : `/item/${id}`} className="item">
  // item content
</Link>
```

在 v4 中，你应该始终具备 `to`。如若你添加了一个空的 `to`，你可以制作一个简单的容器包裹它。

```jsx
// v4
import { Link } from 'react-router-dom'

const LinkWrapper = (props) => {
  const Component = props.to ? Link : 'a'
  return (
    <Component {...props}>
      { props.children }
    </Component>
  )
}

<LinkWrapper to={disabled ? null : `/item/${id}`} className="item">
  // item content
</LinkWrapper>
```
