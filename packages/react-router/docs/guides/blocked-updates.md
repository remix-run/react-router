# Dealing with Update Blocking

React Router 有许多位置感知组件，它们使用当前 `location` 对象来确定它们呈现的内容。默认情况下，使用 React 的上下文模型将当前 `location` 隐式传递给组件。当 location 发生变化时，这些组件应该使用上下文中的新 `location` 对象重新渲染。

React 提供了两种方法来优化应用程序的渲染性能： `shouldComponentUpdate` 生命周期方法和 `PureComponent`。除非满足正确的条件，否则都会阻止组件的重新渲染。可惜的是，如果它们的再现被阻止的话，就意味着 React Router 的 location-aware 组件可能会与当前的 location 不同步。

### 问题的例子

我们从一个阻止更新的组件开始。

```js
class UpdateBlocker extends React.PureComponent {
  render() {
    return this.props.children;
  }
}
```

当 `<UpdateBlocker>` 挂载时，任何 location-aware 子组件都将使用当前 `location` 并 `match` 对象进行呈现。

```jsx
// location = { pathname: '/about' }
<UpdateBlocker>
  <NavLink to="/about">About</NavLink>
  // <a href="/about" class="active">
    About
  </a>
  <NavLink to="/faq">F.A.Q.</NavLink>
  // <a href="/faq">F.A.Q.</a>
</UpdateBlocker>
```

当 location 改变时，`<UpdateBlocker>` 不检测任何 prop 或 state 改变，所以其子组件不会被重新渲染。

```jsx
// location = { pathname: '/faq' }
<UpdateBlocker>
  // the links will not re-render, so they retain their previous attributes
  <NavLink to="/about">About</NavLink>
  //{" "}
  <a href="/about" class="active">
    About
  </a>
  <NavLink to="/faq">F.A.Q.</NavLink>
  // <a href="/faq">F.A.Q.</a>
</UpdateBlocker>
```

### `shouldComponentUpdate`

为了使实现 `shouldComponentUpdate` 的组件知道它应该在 location 更改时进行更新，它的 `shouldComponentUpdate` 方法需要能够检测 location 更改。

如果你自己实现了 `shouldComponentUpdate` ，你可以比较当前和下一个 `context.router` 对象的 location 。但是，作为用户，你不应该直接使用上下文。 相反，如果您可以在不触及上下文的情况下比较当前地址和下一个 `location` ，这将是理想的。

#### 第三方代码

尽管没有自己调用 `shouldComponentUpdate` ，但你可能会遇到组件更新后仍未更新组件的问题。这很可能是因为 `shouldComponentUpdate` 被第三方代码调用，比如 `react-redux` 的 `connect` 和 `mobx-react` 的 `observer`。

```js
// react-redux
const MyConnectedComponent = connect(mapStateToProps)(MyComponent);

// mobx-react
const MyObservedComponent = observer(MyComponent);
```

使用第三方代码，你甚至可能无法控制 `shouldComponentUpdate` 的实现。相反，你必须构造代码以使这些方法的地址变得明显。

`connect` 和 `observer` 都要创建组件，其 `shouldComponentUpdate` 方法对其当前 `props` 和其下一个 `props` 进行浅层比较。这些组件只有在至少有一个属性发生了变化时才会重新渲染。这意味着为了确保他们在 location 发生变化时进行更新，他们需要在 location 发生变化时获得更改的属性。

### `PureComponent`

React 的 `PureComponent` 没有实现 `shouldComponentUpdate`，但它采取了类似的方法来防止更新。当一个“纯”组件更新时，它会对其当前的 `props` 和 `state` 与下一个 `props` 和 `state` 进行浅层比较。如果比较没有检测到任何差异，则组件不会更新。与 `shouldComponentUpdate` 一样，这意味着为了在地址更改时强制更新“纯”组件，它需要具有已更改的属性或状态。

### 解决方案

#### 快速解决方案

如果您在使用高级组件 `connect`（如 react-redux ）或 `observer` （来自 Mobx ）时遇到此问题，则可以将该组件包装在 withRouter 中以删除被阻塞的更新。

```javascript
// redux before
const MyConnectedComponent = connect(mapStateToProps)(MyComponent);
// redux after
const MyConnectedComponent = withRouter(connect(mapStateToProps)(MyComponent));

// mobx before
const MyConnectedComponent = observer(MyComponent);
// mobx after
const MyConnectedComponent = withRouter(observer(MyComponent));
```

**这不是最有效的解决方案**, 但可以防止被阻塞的更新问题。有关此解决方案的更多信息，请阅读 [this thread](https://github.com/ReactTraining/react-router/pull/5552#issuecomment-331502281)。

#### 推荐解决方案

建议在 location 更改后避免重新呈现被阻塞的关键是将阻塞组件传递给地址 `location` 作为属性。只要 location 发生变化，就会有所不同，因此通过比较可以检测到当前地址和下一个 location 是不同的。

```jsx
// location = { pathname: '/about' }
<UpdateBlocker location={location}>
  <NavLink to='/about'>About</NavLink>
  // <a href='/about' class='active'>About</a>
  <NavLink to='/faq'>F.A.Q.</NavLink>
  // <a href='/faq'>F.A.Q.</a>
</UpdateBlocker>

// location = { pathname: '/faq' }
<UpdateBlocker location={location}>
  <NavLink to='/about'>About</NavLink>
  // <a href='/about'>About</a>
  <NavLink to='/faq'>F.A.Q.</NavLink>
  // <a href='/faq' class='active'>F.A.Q.</a>
</UpdateBlocker>
```

#### 获取地址

获取为了将当前 `location` 对象作为属性传递给组件，你必须有权访问它。组件可以通过 `<Route>` 组件访问该 `location` 的主要方式。当 `<Route>` 匹配时（或者如果你使用的是 `children` 属性），它会将当前 `location` 传递给它呈现的子元素。

```jsx
<Route path='/here' component={Here}/>
const Here = (props) => {
  // props.location = { pathname: '/here', ... }
  return <div>You are here</div>
}

<Route path='/there' render={(props) => {
  // props.location = { pathname: '/there', ... }
  return <div>You are there</div>
}}/>

<Route path='/everywhere' children={(props) => {
  // props.location = { pathname: '/everywhere', ... }
  return <div>You are everywhere</div>
}}/>
```

这意味着定义一个阻止更新的组件，你可以通过以下方式轻松地把 `location` 作为属性传递给它：

This means that given a component that blocks updates, you can easily pass it the `location` as a prop in the following ways:

```jsx
// the Blocker is a "pure" component, so it will only
// update when it receives new props
class Blocker extends React.PureComponent {
  render() {
    <div>
      <NavLink to="/oz">Oz</NavLink>
      <NavLink to="/kansas">Kansas</NavLink>
    </div>;
  }
}
```

1. 由 `<Route>` 直接呈现的组件不必担心阻止的更新，因为它将 `location` 注入为属性。

```jsx
// The <Blocker>'s location prop will change whenever
// the location changes
<Route path="/:place" component={Blocker} />
```

2. 直接由 `<Route>` 呈现的组件可以将该 location 属性传递给它创建的任何子元素。

```jsx
<Route path="/parent" component={Parent} />;

const Parent = props => {
  // <Parent> receives the location as a prop. Any child
  // element it creates can be passed the location.
  return (
    <SomeComponent>
      <Blocker location={props.location} />
    </SomeComponent>
  );
};
```

当组件未被 `<Route>` 呈现时，以及组件在其变量范围内没有 `location` 时会发生什么？你可以采取两种方法将 `location` 自动注入组件中。

1. 渲染没有路径的 `<Route>`。 虽然 `<Route>` 通常用于匹配特定路径，但没有路径的 `<Route>` 将始终匹配，因此它将始终呈现其组件。

```jsx
// pathless <Route> = <Blocker> will always be rendered
const MyComponent = () => (
  <SomeComponent>
    <Route component={Blocker} />
  </SomeComponent>
);
```

2. 你可以使用 `withRouter` 高阶组件封装组件，并将其作为其属性之一给予当前 `location` 。

```jsx
// internally, withRouter just renders a pathless <Route>
const BlockAvoider = withRouter(Blocker);

const MyComponent = () => (
  <SomeComponent>
    <BlockAvoider />
  </SomeComponent>
);
```
