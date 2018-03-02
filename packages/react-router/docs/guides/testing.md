# Testing

React Router 依赖于 React 。这会影响你如何通过使用我们的组件来测试你的组件。

## Context

如果你尝试单元测试呈现 `<Link>` 或者 `<Router>` 组件，你会得到一些上下文的错误信息和警告信息。虽然你可能会试图自己去掉路由器上下文，但我们建议你将你的单元测试包裹在 `<StaticRouter>` 或者 `<MemoryRouter>` 中。让我们来看一下：

```jsx
class Sidebar extends Component {
  // ...
  render() {
    return (
      <div>
        <button onClick={this.toggleExpand}>
          expand
        </button>
        <ul>
          {users.map(user => (
            <li>
               <Link to={user.path}>
                 {user.name}
               </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

// 断开
test('it expands when the button is clicked', () => {
  render(
    <Sidebar/>
  )
  click(theButton)
  expect(theThingToBeOpen)
})

// 固定！
test('it expands when the button is clicked', () => {
  render(
    <MemoryRouter>
      <Sidebar/>
    </MemoryRouter>
  )
  click(theButton)
  expect(theThingToBeOpen)
})
```

以上就是它的所有示例。

## 从特定的路由开始

`<MemoryRouter>` 支持 `initialEntries` 和 `initialIndex` 属性，因此你可以从一个特定的地址（location）来启动你的 app（或者是 app 的任何一个小部分）。

```jsx
test('current user is active in sidebar', () => {
  render(
    <MemoryRouter initialEntries={[ '/users/2' ]}>
      <Sidebar/>
    </MemoryRouter>
  )
  expectUserToBeActive(2)
})
```

## Navigating

当地址（location）发生变化的时候，我们会对路由进行大量的测试，因此你可能不需要测试这个东西。但是如果你必须这样做，基于一切都在渲染中发生，我们可以聪明一点这样做：

```jsx
import { render, unmountComponentAtNode } from 'react-dom'
import React from 'react'
import { Route, Link, MemoryRouter } from 'react-router-dom'
import { Simulate } from 'react-addons-test-utils'

// 把整个 app 都放在一个 MemoryRouter 里面渲染的其中一个方法是
// 把他们都放进一个要执行的步骤列表里面，
// 当地址发生变化的时候，
// 它就会连同 `match`，`location`，和 `history` 一起被回调，
// 因此，你可以控制整个流程和做断言。
const renderTestSequence = ({
  initialEntries,
  initialIndex,
  subject: Subject,
  steps
}) => {
  const div = document.createElement('div')

  class Assert extends React.Component {

    componentDidMount() {
      this.assert()
    }

    componentDidUpdate() {
      this.assert()
    }

    assert() {
      const nextStep = steps.shift()
      if (nextStep) {
        nextStep({ ...this.props, div })
      } else {
        unmountComponentAtNode(div)
      }
    }

    render() {
      return this.props.children
    }
  }

  class Test extends React.Component {
    render() {
      return (
        <MemoryRouter
          initialIndex={initialIndex}
          initialEntries={initialEntries}
        >
          <Route render={(props) => (
            <Assert {...props}>
              <Subject/>
            </Assert>
          )}/>
        </MemoryRouter>
      )
    }
  }

  render(<Test/>, div)
}

// 我们的 Subject 是这个 App，但是你也可以测试你的应用的任何子部分
const App = () => (
  <div>
    <Route exact path="/" render={() => (
      <div>
        <h1>Welcome</h1>
      </div>
    )}/>
    <Route path="/dashboard" render={() => (
      <div>
        <h1>Dashboard</h1>
        <Link to="/" id="click-me">Home</Link>
      </div>
    )}/>
  </div>
)

// 实际测试！
it('navigates around', (done) => {

  renderTestSequence({

    // 告诉它你正在测试的 subject
    subject: App,

    // 以及每次位置变化时执行的步骤
    steps: [
      
      // 初始渲染
      ({ history, div }) => {
        // 断言屏幕的输出是否如同我们期望的输出
        console.assert(div.innerHTML.match(/Welcome/))

        // 现在我们可以为我们的测试强制导航
        history.push('/dashboard')
      },

      // 从新的地址发起第二次渲染
      ({ div }) => {
        console.assert(div.innerHTML.match(/Dashboard/))

        // 或者我们可以模拟点击链接，而不使用 history.push
        Simulate.click(div.querySelector('#click-me'), {
          button: 0
        })
      },

      // 最终渲染
      ({ location }) => {
        console.assert(location.pathname === '/')
        // 你需要在这里写下 `done()`，如果你从未这样做，你的测试是失败的。
        done()
      }
    ]
  })
})
```
