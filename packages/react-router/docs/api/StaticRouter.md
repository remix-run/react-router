# &lt;StaticRouter>

一个永不改变地址的 [`<Router>`](Router.md)。

当用户没有真正点击时，它对于服务器端渲染脚本是有帮助的，因此该位置实际上并未发生变化。由此命名：静态。当你只需要插入一个位置并且在渲染输出上作出断言时，它在简单测试中也很有用。

以下是一个节点服务器示例，它为 [`<Redirect>`](Redirect.md) 发送302状态码，并为其他请求发送常规的 HTML。

```jsx
import { createServer } from 'http'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router'

createServer((req, res) => {

  // 这个上下文对象包含渲染结果
  const context = {}

  const html = ReactDOMServer.renderToString(
    <StaticRouter location={req.url} context={context}>
      <App/>
    </StaticRouter>
  )

  // 如果一个 <Redirect> 被使用，context.url 将包含 URL 重定向
  if (context.url) {
    res.writeHead(302, {
      Location: context.url
    })
    res.end()
  } else {
    res.write(html)
    res.end()
  }
}).listen(3000)
```

## basename: string

所有位置的基本网址。一个正确的命名格式应该有一个前导斜线，而不是后面的斜线。

```jsx
<StaticRouter basename="/calendar">
  <Link to="/today"/> // renders <a href="/calendar/today">
</StaticRouter>
```

## location: string

服务器收到的URL,或许 `req.url` 会位于节点服务器上。

```jsx
<StaticRouter location={req.url}>
  <App/>
</StaticRouter>
```

## location: object

一个位置对象形似 `{ pathname, search, hash, state }`。

```jsx
<StaticRouter location={{ pathname: '/bubblegum' }}>
  <App/>
</StaticRouter>
```

## context: object

一个普通的 JavaScript 对象。在渲染过程中，组件可以向对象添加属性，用来存储有关渲染的信息。

```jsx
const context = {}
<StaticRouter context={context}>
  <App />
</StaticRouter>
```

当一个 `<Route>` 匹配时，它会将上下文对象传递给作为 `staticContext` 属性渲染的组件。查看 [Server Rendering guide](../../../react-router-dom/docs/guides/server-rendering.md) 来获得更多有关如何自行完成此操作的信息。

渲染之后，可以使用这些属性来配置服务器的响应。

```js
if(context.status === '404') {
  // ...
}
```

## children: node

一个用来渲染的 [单一的子元素](https://facebook.github.io/react/docs/react-api.html#react.children.only)。 
