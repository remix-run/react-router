# matchPath

这使你可以使用与 `<Route>` 相同的匹配代码，除正常渲染周期外，例如，在服务端渲染之前收集数据依赖。

```js
import { matchPath } from 'react-router'

const match = matchPath('/users/123', {
  path: '/users/:id',
  exact: true,
  strict: false
})
```

## pathname

第一个参数是你想要匹配的 pathname。 如果您正在服务器上使用 Node.js ，它将是 `req.path`。

## props

第二个参数是匹配的 props，它们与 `Route` 接受的 props 相同：

```js
{
  path, // 例如 /users/:id
  strict, // 选填, 默认为 false
  exact // 选填, 默认为 false
}
```
