# &lt;MemoryRouter>

[`<Router>`](Router.md) 能在内存中保存你的 “URL” 的历史记录(并不会对地址栏进行读写)。很适合在测试环境和非浏览器环境中使用，例如 [React Native](https://facebook.github.io/react-native/)。

```jsx
import { MemoryRouter } from 'react-router'

<MemoryRouter>
  <App/>
</MemoryRouter>
```

## initialEntries: array

history 栈中的一个 `location` 数组。这些可能是具有 `{ pathname, search, hash, state }` 或简单的 URL 字符串的完整地址对象。

```jsx
<MemoryRouter
  initialEntries={[ '/one', '/two', { pathname: '/three' } ]}
  initialIndex={1}
>
  <App/>
</MemoryRouter>
```

## initialIndex: number

在 `initialEntries` 数组中的初始化地址索引。

## getUserConfirmation: func

用于确认导航的函数。在使用 `<MemoryRouter>` 时，直接使用 `<Prompt>`，你必须使用这个选项。

## keyLength: number

`location.key` 的长度。默认为 6。

```jsx
<MemoryRouter keyLength={12}/>
```

## children: node

渲染一个 [单独子元素](https://facebook.github.io/react/docs/react-api.html#react.children.only)。