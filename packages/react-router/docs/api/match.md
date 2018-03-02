# match

一个 `match` 对象中包涵了有关如何匹配 URL 的信息。`match` 对象中包涵以下属性：

- `params` - (object) key／value 与动态路径的 URL 对应解析
- `isExact` - (boolean) `true`  如果匹配整个 URL （没有结尾字符）
- `path` - (string)  用于匹配的路径模式。被嵌套在 `<Route>` 中使用
- `url` - (string)  用于匹配部分的 URL 。被嵌套在 `<Link>` 中使用

你将会在这些地方用到 `match` 对象：

- [Route component](./Route.md#component) 例如 `this.props.match`
- [Route render](./Route.md#render-func) 例如 `({ match }) => ()`
- [Route children](./Route.md#children-func) 例如 `({ match }) => ()`
- [withRouter](./withRouter.md) 例如 `this.props.match`
- [matchPath](./matchPath.md) 例如  返回值

如果 Route 没有 `path`，那么将会一直与他最近的父级匹配。这也同样适用于`withRouter`。

## null matches

当前路由的 `path` 与当前地址不匹配时，使用 `children`  属性的 `<Route> ` 将调用 `children` 方法。这种情况下， `match` 将为 `null` 。当`<Route>` 中的内容能够被渲染出来时，说明匹配成功，但这种情况是有挑战性的。

“解析”URL的默认方式是将 `match.url` 字符串连接到“相对”路径。

```js
`${match.url}/relative-path`
```

如果你的匹配为 `null` 时尝试执行此操作，则会出现`TypeError`。它的意思是在使用子级属性时在 `<Route>` 内部加入“相对”路径是不安全的。

当您在生成`null`匹配对象的 `<Route>` 内部使用无路径的 `<Route>` 时。会出现类似但更微妙的情况。

```js
// location.pathname = '/matches'
<Route path='/does-not-match' children={({ match }) => (
  // match === null
  <Route render={({ match:pathlessMatch }) => (
    // pathlessMatch === ???
  )}/>
)}/>
```

无路径的 `<Route>` 从它们的父节点继承它们的`match`对象。 如果他们的父`match`是`null`，那么他们的匹配也是`null`。 这意味着：a）任何子路由/链接必须是绝对的，因为没有父级去解决，并且b）父级路径`match`可以是`null`的无路径路由将需要使用子级属性进行渲染。
