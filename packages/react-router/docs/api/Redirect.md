# &lt;Redirect>

渲染 `<Redirect>` 将使导航到一个新的地址。这个新的地址会覆盖 history 栈中的当前地址，类似服务器端（HTTP 3xx）的重定向。

```jsx
import { Route, Redirect } from 'react-router'

<Route exact path="/" render={() => (
  loggedIn ? (
    <Redirect to="/dashboard"/>
  ) : (
    <PublicHomePage/>
  )
)}/>
```

## to: string

重定向到的 URL，可以是任何 [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp) 能够理解有效 URL 路径。在 `to` 中使用的 URL 参数必须由 `from` 覆盖。


```jsx
<Redirect to="/somewhere/else"/>
```

## to: object

重定向到的 location，`pathname` 可以是任何 [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp) 能够理解的有效的 URL 路径。

```jsx
<Redirect to={{
  pathname: '/login',
  search: '?utm=your+face',
  state: { referrer: currentLocation }
}}/>
```

## push: bool

当 `true` 时，重定向会将新地址推入 history 中，而不是替换当前地址。

```jsx
<Redirect push to="/somewhere/else"/>
```

## from: string

重定向 from 的路径名。可以是任何 [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp) 能够识别的有效的 URL 路径。
所有匹配的 URL 参数都提供给 `to` 中的模式。必须包含在 `to` 中使用的所有参数。 `to ` 未使用的其他参数将被忽略。

这只能用于在 `<Redirect>` 内部渲染 `<Switch>` 时匹配地址。有关更多详情，请查阅参阅 [`<Switch children>`](./Switch.md#children-node)。

```jsx
<Switch>
  <Redirect from='/old-path' to='/new-path'/>
  <Route path='/new-path' component={Place}/>
</Switch>
```

```jsx
// Redirect with matched parameters
<Switch>
  <Redirect from='/users/:id' to='/users/profile/:id'/>
  <Route path='/users/profile/:id' component={Profile}/>
</Switch>
```

## exact: bool

完全匹配 `from`；相当于 [Route.exact](./Route.md#exact-bool)。

## strict: bool

严格匹配  `from`；相当于 [Route.strict](./Route.md#strict-bool)。
