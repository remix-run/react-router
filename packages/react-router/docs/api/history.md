# history

本文档中的 “history” 以及 “`history`对象” 请参照 [`history` 包](https://github.com/ReactTraining/history)中的内容，History 是 React Router 的两大重要依赖之一(除去 React 本身)，在不同的 Javascript 环境中，它提供多种不同的形式来实现对 session 历史的管理。

我们也会使用以下术语：

- “browser history” - 在 DOM 上的实现，使用于支持 HTML5 history API 的Web浏览器中
- “hash history” - 在 DOM 上的实现，使用于旧版本的Web浏览器中
- “memory history” - 在内存中的 history 实现，使用于测试或者非 DOM 环境中

`history` 对象通常会具有以下属性和方法：

- `length` - (number类型) history 堆栈的条目数  
- `action` - (string类型) 当前的操作(`PUSH`, `REPLACE`, `POP`)
- `location` - (object类型) 当前的位置。location 会具有以下属性：
  - `pathname` - (string类型) URL路径
  - `search` - (string类型) URL中的查询字符串
  - `hash` - (string类型) URL的 hash 片段
  - `state` - (object类型) location 的状态。例如在 `push(path, state)` 时，state会描述什么时候 location 被放置到堆栈中等信息。这个 state 只会出现在 browser history 和 memory history 的环境里。
- `push(path, [state])` - (function类型) 在 history 堆栈添加一个新条目
- `replace(path, [state])` - (function类型) 替换在 history 堆栈中的当前条目
- `go(n)` - (function类型) 将 history 堆栈中的指针调整 `n`
- `goBack()` - (function类型) 等同于 `go(-1)`
- `goForward()` - (function类型) 等同于 `go(1)`
- `block(prompt)` - (function类型) 阻止跳转。(详见 [history 文档](https://github.com/ReactTraining/history#blocking-transitions))。

## history 是可变的

history 对象是可变的，因此我们建议从 [`<Route>`](./Route.md) 的 props  里来获取 location ，而不是从 `history.location` 直接获取。这样做可以保证 React 在生命周期中的钩子函数正常执行，例如以下代码：

```jsx
class Comp extends React.Component {
  componentWillReceiveProps(nextProps) {
    // locationChanged 将为 true
    const locationChanged = nextProps.location !== this.props.location

    // INCORRECT，因为 history 是可变的所以 locationChanged 将一直为 false
    const locationChanged = nextProps.history.location !== this.props.history.location
  }
}

<Route component={Comp}/>
```

根据不同的实现，可能会出现其他属性。更多详情请参考 [history 文档](https:github.comReactTraininghistory)。