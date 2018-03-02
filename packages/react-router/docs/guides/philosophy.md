# Philosophy

本指南的目的是解释在使用 React Router 时的构思模型。 我们称之为“动态路由”，它与可能更熟悉的“静态路由”截然不同。

## 静态路由

如果使用过 Rails，Express，Ember，Angular 等，那么应该熟悉静态路由。 在这些框架中，的路由声明应该为程序初始化中的一部分，在任何渲染之前。 React Router pre-v4 也是静态的（主要是）。 我们来看看如何用 express 来配置路由：

```js
app.get("/", handleIndex);
app.get("/invoices", handleInvoices);
app.get("/invoices/:id", handleInvoice);
app.get("/invoices/:id/edit", handleInvoiceEdit);

app.listen();
```

请注意路由在应用程序监听之前是如何声明的。 我们使用的客户端路由器类似。 在 Angular 中，你先声明你的路由，然后在渲染之前将它们导入到顶层 `AppModule`：

```js
const appRoutes: Routes = [
  {
    path: "crisis-center",
    component: CrisisListComponent
  },
  {
    path: "hero/:id",
    component: HeroDetailComponent
  },
  {
    path: "heroes",
    component: HeroListComponent,
    data: { title: "Heroes List" }
  },
  {
    path: "",
    redirectTo: "/heroes",
    pathMatch: "full"
  },
  {
    path: "**",
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)]
})
export class AppModule {}
```

Ember 在的应用程序中构建并读取一个常规的 `routes.js` 文件。 同样，这发生在的应用程序渲染之前。

```js
Router.map(function() {
  this.route("about");
  this.route("contact");
  this.route("rentals", function() {
    this.route("show", { path: "/:rental_id" });
  });
});

export default Router;
```

虽然 API 不同，但它们的模式都是“静态路由”。 React Router 也一直保持这种模式，直到升级至 v4 版本。

要成功的使用 React Router，需要忘记这种模式！：o

## 背景故事

坦率地说，我们对我们在第 2 版采用 React Router 的方向感到非常沮丧。 我们（ Michael 和 Ryan ）受 API 的限制，在我们重构 React（生命周期等）的部分内容时，都认为它与 React 编写 UI 的构思模型不匹配。

在研讨会讨论如何处理之前，我们正走在一家旅馆的走廊， 我们互相问：“如果我们使用在研讨会上研讨的模式构建路由器，看起来会是什么样子？”

开发过程只有几个小时，我们就有了一个概念证明，我们知道这是我们希望的路由的未来。我们最终得到的 API 不在 React 的“外部”，这是一个与 React 的其余部分组成或自然放置到位的 API。我们想你会喜欢的。

## 动态路由

当我们说动态路由时，我们指的是在**应用程序渲染时**发生的路由，而不是在运行应用程序之外的配置或约定中发生的路由。这意味着几乎所有一切都是 React 路由器中的一个组件。下面是对 API 的 60 秒钟回顾，以了解其工作原理:

首先，在目标环境中获取一个 `Router` 组件，并将其渲染在应用的顶部。

```jsx
// react-native
import { NativeRouter } from "react-router-native";

// react-dom (what we'll use here)
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  el
);
```

接下来，将 link 组件链接到新位置:

```jsx
const App = () => (
  <div>
    <nav>
      <Link to="/dashboard">Dashboard</Link>
    </nav>
  </div>
);
```

最后，渲染 `Route` 以在用户访问 `/dashboard` 时渲染一些用户界面。

```jsx
const App = () => (
  <div>
    <nav>
      <Link to="/dashboard">Dashboard</Link>
    </nav>
    <div>
      <Route path="/dashboard" component={Dashboard} />
    </div>
  </div>
);
```

`Route` 将渲染 `<Dashboard {...props}/>`，其中`props`是一些路由器特有的东西，看起来像 `{ match, location, history }`。如果用户不在 `/dashboard` 处，则 `Route` 将渲染 `null`。这就是它的全部内容。

## 嵌套路由

很多路由器都有一些“嵌套路由”的概念。 如果使用 v4 之前版本的 React Router，也会知道它也是如此！ 当你从静态路由配置移动到动态渲染路由时，你如何“嵌套路由”？ 那么，你如何嵌入 `div`？

```jsx
const App = () => (
  <BrowserRouter>
    {/* here's a div */}
    <div>
      {/* here's a Route */}
      <Route path="/tacos" component={Tacos} />
    </div>
  </BrowserRouter>
);

// when the url matches `/tacos` this component renders
const Tacos = ({ match }) => (
  // here's a nested div
  <div>
    {/* here's a nested Route,
            match.url helps us make a relative path */}
    <Route path={match.url + "/carnitas"} component={Carnitas} />
  </div>
);
```

如何看待路由器没有“嵌套”API？ `Route` 只是一个组件，就像 `div` 一样。 因此，为了嵌入 `Route` 或 `div`，你只需...做到这一点。

让我们变得更机警。

## 响应式路线

考虑用户导航到 `/invoices`。 的应用程序适应不同的屏幕尺寸，它们具有较窄的视窗，因此只能向他们显示发票列表和连接到发票仪表板。 他们可以从那里进入到更深一步的导航。

```asciidoc
Small Screen
url: /invoices

+----------------------+
|                      |
|      Dashboard       |
|                      |
+----------------------+
|                      |
|      Invoice 01      |
|                      |
+----------------------+
|                      |
|      Invoice 02      |
|                      |
+----------------------+
|                      |
|      Invoice 03      |
|                      |
+----------------------+
|                      |
|      Invoice 04      |
|                      |
+----------------------+
```

在较大的屏幕上，我们希望显示一个主-详细视图，其中导航位于左侧，仪表板或特定发票显示在右侧。

```asciidoc
Large Screen
url: /invoices/dashboard

+----------------------+---------------------------+
|                      |                           |
|      Dashboard       |                           |
|                      |   Unpaid:             5   |
+----------------------+                           |
|                      |   Balance:   $53,543.00   |
|      Invoice 01      |                           |
|                      |   Past Due:           2   |
+----------------------+                           |
|                      |                           |
|      Invoice 02      |                           |
|                      |   +-------------------+   |
+----------------------+   |                   |   |
|                      |   |  +    +     +     |   |
|      Invoice 03      |   |  | +  |     |     |   |
|                      |   |  | |  |  +  |  +  |   |
+----------------------+   |  | |  |  |  |  |  |   |
|                      |   +--+-+--+--+--+--+--+   |
|      Invoice 04      |                           |
|                      |                           |
+----------------------+---------------------------+
```

现在暂停一分钟，考虑两种屏幕大小的 `/invoices` URL。它甚至是大屏幕的有效路径吗？我们应该把什么放在右边？

```asciidoc
Large Screen
url: /invoices
+----------------------+---------------------------+
|                      |                           |
|      Dashboard       |                           |
|                      |                           |
+----------------------+                           |
|                      |                           |
|      Invoice 01      |                           |
|                      |                           |
+----------------------+                           |
|                      |                           |
|      Invoice 02      |             ???           |
|                      |                           |
+----------------------+                           |
|                      |                           |
|      Invoice 03      |                           |
|                      |                           |
+----------------------+                           |
|                      |                           |
|      Invoice 04      |                           |
|                      |                           |
+----------------------+---------------------------+
```

在大屏幕上，`/invoices` 不是有效的路线，但在小屏幕上！ 为了让事情变得更有趣，可以考虑带有巨大手机的人。 他们可能会以纵向方向查看 `/invoices`，然后将手机旋转至横向。 突然之间，我们有足够的空间来显示主细节 UI，所以你应该立即重定向！

React 路由器的以前版本的静态路由并没有真正的组合答案。 但是，如果路由是动态的，则可以声明性地编写此功能。 如果开始考虑将 UI 作为 UI 进行思考，而不是静态配置，那么的直觉会将引导至以下代码：

```js
const App = () => (
  <AppLayout>
    <Route path="/invoices" component={Invoices} />
  </AppLayout>
);

const Invoices = () => (
  <Layout>
    {/* always show the nav */}
    <InvoicesNav />

    <Media query={PRETTY_SMALL}>
      {screenIsSmall =>
        screenIsSmall ? (
          // small screen has no redirect
          <Switch>
            <Route exact path="/invoices/dashboard" component={Dashboard} />
            <Route path="/invoices/:id" component={Invoice} />
          </Switch>
        ) : (
          // large screen does!
          <Switch>
            <Route exact path="/invoices/dashboard" component={Dashboard} />
            <Route path="/invoices/:id" component={Invoice} />
            <Redirect from="/invoices" to="/invoices/dashboard" />
          </Switch>
        )
      }
    </Media>
  </Layout>
);
```

当用户将电话从纵向旋转到横向时，此代码将自动将其重定向到仪表板。有效路由的集合根据用户手中的移动设备的动态特性而改变。

这只是一个例子。我们还可以讨论其他许多问题，但我们将总结为以下建议:为了使的直觉与 React Router 一致，请考虑组件，而不是静态路由。这只是一个例子。 还有很多其他的我们可以讨论，但我们总结这个建议：为了让你的直觉符合 React Router 的思想，考虑组件，而不是静态路由。考虑如何用 React 的声明式组合来解决问题，因为几乎每个 “React Router 问题” 都可能是 “React 问题”。
