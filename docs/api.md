---
title: API Reference
order: 2
---

# API Reference

React Router is a collection of [React components](https://reactjs.org/docs/components-and-props.html), [hooks](https://reactjs.org/docs/hooks-intro.html) and utilities that make it easy to build multi-page applications with [React](https://reactjs.org). This reference contains the function signatures and return types of the various interfaces in React Router.

## Overview

### Packages

React Router is published to npm in three different packages:

- [`react-router`](https://npm.im/react-router) contains most of the core functionality of React Router including the route matching algorithm and most of the core components and hooks
- [`react-router-dom`](https://npm.im/react-router-dom) includes everything from `react-router` and adds a few DOM-specific APIs, including [`<BrowserRouter>`](#browserrouter), [`<HashRouter>`](#hashrouter), and [`<Link>`](#link)
- [`react-router-native`](https://npm.im/react-router-native) includes everything from `react-router` and adds a few APIs that are specific to React Native, including [`<NativeRouter>`](#nativerouter) and [a native version of `<Link>`](#link-react-native)

Both `react-router-dom` and `react-router-native` automatically include `react-router` as a dependency when you install them, and both packages re-export everything from `react-router`. **When you `import` stuff, you should always import from either `react-router-dom` or `react-router-native` and never directly from `react-router`**. Otherwise you may accidentally import mismatched versions of the library in your app.

If you [installed](./getting-started/installation.md) React Router as a global (using a `<script>` tag), you can find the library on the `window.ReactRouterDOM` object. If you installed it from npm, you can [`import`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) the pieces you need. The examples in this reference all use `import` syntax.

### Setup

To get React Router working in your app, you need to render a router element at or near the root of your element tree. We provide several different routers depending on where your app is running.

- [`<BrowserRouter>`](#browserrouter) or [`<HashRouter>`](#hashrouter) should be used when running in a web browser (which one you pick depends on the style of URL you prefer or need)
- [`<StaticRouter>`](#staticrouter) should be used when server-rendering a website
- [`<NativeRouter>`](#nativerouter) should be used in [React Native](https://reactnative.dev/) apps
- [`<MemoryRouter>`](#memoryrouter) is useful in testing scenarios and as a reference implementation for the other routers

These routers provide the context that React Router needs to operate in a particular environment. Each one renders [a `<Router>`](#router) internally, which you may also do if you need more fine-grained control for some reason. But it is highly likely that one of the built-in routers is what you need.

### Routing

Routing is the process of deciding which React elements will be rendered on a given page of your app, and how they will be nested. React Router provides two interfaces for declaring your routes.

- [`<Routes>` and `<Route>`](#routes-and-route) if you're using JSX
- [`useRoutes`](#useroutes) if you'd prefer a JavaScript object-based config

A few low-level pieces that we use internally are also exposed as public API, in case you need to build your own higher-level interfaces for some reason.

- [`matchPath`](#matchpath) - matches a path pattern against a URL pathname
- [`matchRoutes`](#matchroutes) - matches a set of routes against a [location](#location)
- [`createRoutesFromChildren`](#createroutesfromchildren) - creates a route config from a set of React elements (i.e. [`<Route>`](#routes-and-route) elements)

### Navigation

React Router's navigation interfaces let you change the currently rendered page by modifying the current [location](#location). There are two main interfaces for navigating between pages in your app, depending on what you need.

- [`<Link>`](#link) and [`<NavLink>`](#navlink) render an accessible `<a>` element, or a `TouchableHighlight` on React Native. This lets the user initiate navigation by clicking or tapping an element on the page.
- [`useNavigate`](#usenavigate) and [`<Navigate>`](#navigate) let you programmatically navigate, usually in an event handler or in response to some change in state

There are a few low-level APIs that we use internally that may also prove useful when building your own navigation interfaces.

- [`useResolvedPath`](#useresolvedpath) - resolves a relative path against the current [location](#location)
- [`useHref`](#usehref) - resolves a relative path suitable for use as a `<a href>`
- [`useLocation`](#uselocation) and [`useNavigationType`](#usenavigationtype) - these describe the current [location](#location) and how we got there
- [`useLinkClickHandler`](#uselinkclickhandler) - returns an event handler to for navigation when building a custom `<Link>` in `react-router-dom`
- [`useLinkPressHandler`](#uselinkpresshandler) - returns an event handler to for navigation when building a custom `<Link>` in `react-router-native`
- [`resolvePath`](#resolvepath) - resolves a relative path against a given URL pathname

### Search Parameters

Access to the URL [search parameters](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) is provided via [the `useSearchParams` hook](#usesearchparams).

---

## Reference

### `<BrowserRouter>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function BrowserRouter(
  props: BrowserRouterProps
): React.ReactElement;

interface BrowserRouterProps {
  basename?: string;
  children?: React.ReactNode;
  window?: Window;
}
```

</details>

`<BrowserRouter>` is the recommended interface for running React Router in a web browser. A `<BrowserRouter>` stores the current location in the browser's address bar using clean URLs and navigates using the browser's built-in history stack.

`<BrowserRouter window>` defaults to using the current [document's `defaultView`](https://developer.mozilla.org/en-US/docs/Web/API/Document/defaultView), but it may also be used to track changes to another window's URL, in an `<iframe>`, for example.

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
  <BrowserRouter>
    {/* The rest of your app goes here */}
  </BrowserRouter>,
  root
);
```

### `<HashRouter>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function HashRouter(
  props: HashRouterProps
): React.ReactElement;

interface HashRouterProps {
  basename?: string;
  children?: React.ReactNode;
  window?: Window;
}
```

</details>

`<HashRouter>` is for use in web browsers when the URL should not (or cannot) be sent to the server for some reason. This may happen in some shared hosting scenarios where you do not have full control over the server. In these situations, `<HashRouter>` makes it possible to store the current location in the `hash` portion of the current URL, so it is never sent to the server.

`<HashRouter window>` defaults to using the current [document's `defaultView`](https://developer.mozilla.org/en-US/docs/Web/API/Document/defaultView), but it may also be used to track changes to another window's URL, in an `<iframe>`, for example.

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";

ReactDOM.render(
  <HashRouter>
    {/* The rest of your app goes here */}
  </HashRouter>,
  root
);
```

<docs-warning>We strongly recommend you do not use `HashRouter` unless you absolutely have to.</docs-warning>

### `<NativeRouter>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function NativeRouter(
  props: NativeRouterProps
): React.ReactElement;

interface NativeRouterProps extends MemoryRouterProps {}
```

</details>

`<NativeRouter>` is the recommended interface for running React Router in a [React Native](https://reactnative.dev) app.

- `<NativeRouter initialEntries>` defaults to `["/"]` (a single entry at the root `/` URL)
- `<NativeRouter initialIndex>` defaults to the last index of `initialEntries`

```tsx
import * as React from "react";
import { NativeRouter } from "react-router-native";

function App() {
  return (
    <NativeRouter>
      {/* The rest of your app goes here */}
    </NativeRouter>
  );
}
```

### `<MemoryRouter>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function MemoryRouter(
  props: MemoryRouterProps
): React.ReactElement;

interface MemoryRouterProps {
  basename?: string;
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
}
```

</details>

A `<MemoryRouter>` stores its locations internally in an array. Unlike `<BrowserHistory>` and `<HashHistory>`, it isn't tied to an external source, like the history stack in a browser. This makes it ideal for scenarios where you need complete control over the history stack, like testing.

- `<MemoryRouter initialEntries>` defaults to `["/"]` (a single entry at the root `/` URL)
- `<MemoryRouter initialIndex>` defaults to the last index of `initialEntries`

> **Tip:**
>
> Most of React Router's tests are written using a `<MemoryRouter>` as the
> source of truth, so you can see some great examples of using it by just
> [browsing through our tests](https://github.com/remix-run/react-router/tree/main/packages/react-router/__tests__).

```tsx
import * as React from "react";
import { create } from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route
} from "react-router-dom";

describe("My app", () => {
  it("renders correctly", () => {
    let renderer = create(
      <MemoryRouter initialEntries={["/users/mjackson"]}>
        <Routes>
          <Route path="users" element={<Users />}>
            <Route path=":id" element={<UserProfile />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });
});
```

### `<Link>`

> **Note:**
>
> This is the web version of `<Link>`. For the React Native version,
> [go here](#link-react-native).

<details>
  <summary>Type declaration</summary>

```tsx
declare function Link(props: LinkProps): React.ReactElement;

interface LinkProps
  extends Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  > {
  replace?: boolean;
  state?: any;
  to: To;
  reloadDocument?: boolean;
}

type To = Partial<Location> | string;
```

</details>

A `<Link>` is an element that lets the user navigate to another page by clicking or tapping on it. In `react-router-dom`, a `<Link>` renders an accessible `<a>` element with a real `href` that points to the resource it's linking to. This means that things like right-clicking a `<Link>` work as you'd expect. You can use `<Link reloadDocument>` to skip client side routing and let the browser handle the transition normally (as if it were an `<a href>`).

```tsx
import * as React from "react";
import { Link } from "react-router-dom";

function UsersIndexPage({ users }) {
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <Link to={user.id}>{user.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

A relative `<Link to>` value (that does not begin with `/`) resolves relative to the parent route, which means that it builds upon the URL path that was matched by the route that rendered that `<Link>`. It may contain `..` to link to routes further up the hierarchy. In these cases, `..` works exactly like the command-line `cd` function; each `..` removes one segment of the parent path.

> **Note:**
>
> `<Link to>` with a `..` behaves differently from a normal `<a href>` when the
> current URL ends with `/`. `<Link to>` ignores the trailing slash, and removes
> one URL segment for each `..`. But an `<a href>` value handles `..`
> differently when the current URL ends with `/` vs when it does not.

### `<Link>` (React Native)

> **Note:**
>
> This is the React Native version of `<Link>`. For the web version,
> [go here](#link).

<details>
  <summary>Type declaration</summary>

```tsx
declare function Link(props: LinkProps): React.ReactElement;

interface LinkProps extends TouchableHighlightProps {
  children?: React.ReactNode;
  onPress?(event: GestureResponderEvent): void;
  replace?: boolean;
  state?: State;
  to: To;
}
```

</details>

A `<Link>` is an element that lets the user navigate to another view by tapping it, similar to how `<a>` elements work in a web app. In `react-router-native`, a `<Link>` renders a `TouchableHighlight`. To override default styling and behaviour, please refer to the [Props reference for `TouchableHighlight`](https://reactnative.dev/docs/touchablehighlight#props).

```tsx
import * as React from "react";
import { View, Text } from "react-native";
import { Link } from "react-router-native";

function Home() {
  return (
    <View>
      <Text>Welcome!</Text>
      <Link to="/profile">Visit your profile</Link>
    </View>
  );
}
```

### `<NavLink>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function NavLink(
  props: NavLinkProps
): React.ReactElement;

interface NavLinkProps
  extends Omit<
    LinkProps,
    "className" | "style" | "children"
  > {
  caseSensitive?: boolean;
  children?:
    | React.ReactNode
    | ((props: { isActive: boolean }) => React.ReactNode);
  className?:
    | string
    | ((props: { isActive: boolean }) => string);
  end?: boolean;
  style?:
    | React.CSSProperties
    | ((props: {
        isActive: boolean;
      }) => React.CSSProperties);
}
```

</details>

A `<NavLink>` is a special kind of [`<Link>`](#link) that knows whether or not it is "active". This is useful when building a navigation menu such as a breadcrumb or a set of tabs where you'd like to show which of them is currently selected. It also provides useful context for assistive technology like screen readers.

By default, an `active` class is added to a `<NavLink>` component when it is active. This provides the same simple styling mechanism for most users who are upgrading from v5. One difference as of `v6.0.0-beta.3` is that `activeClassName` and `activeStyle` have been removed from `NavLinkProps`. Instead, you can pass a function to either `style` or `className` that will allow you to customize the inline styling or the class string based on the component's active state. you can also pass a function as children to customize the content of the `<NavLink>` component based on their active state, specially useful to change styles on internal elements.

```tsx
import * as React from "react";
import { NavLink } from "react-router-dom";

function NavList() {
  // This styling will be applied to a <NavLink> when the
  // route that it links to is currently selected.
  let activeStyle = {
    textDecoration: "underline"
  };

  let activeClassName = "underline"

  return (
    <nav>
      <ul>
        <li>
          <NavLink
            to="messages"
            style={({ isActive }) =>
              isActive ? activeStyle : undefined
            }
          >
            Messages
          </NavLink>
        </li>
        <li>
          <NavLink
            to="tasks"
            className={({ isActive }) =>
              isActive ? activeClassName : undefined
            }
          >
            Tasks
          </NavLink>
        </li>
        <li>
          <NavLink
            to="tasks"
          >
            {({ isActive }) => (
              <span className={isActive ? activeClassName : undefined}>
                Tasks
              </span>
            ))}
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
```

If you prefer the v5 API, you can create your own `<NavLink />` as a wrapper component:

```tsx
import * as React from "react";
import { NavLink as BaseNavLink } from "react-router-dom";

const NavLink = React.forwardRef(
  ({ activeClassName, activeStyle, ...props }, ref) => {
    return (
      <BaseNavLink
        ref={ref}
        {...props}
        className={({ isActive }) =>
          [
            props.className,
            isActive ? activeClassName : null
          ]
            .filter(Boolean)
            .join(" ")
        }
        style={({ isActive }) => ({
          ...props.style,
          ...(isActive ? activeStyle : null)
        })}
      />
    );
  }
);
```

If the `end` prop is used, it will ensure this component isn't matched as "active" when its descendant paths are matched. For example, to render a link that is only active at the website root and not any other URLs, you can use:

```tsx
<NavLink to="/" end>
  Home
</NavLink>
```

### `<Navigate>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function Navigate(props: NavigateProps): null;

interface NavigateProps {
  to: To;
  replace?: boolean;
  state?: State;
}
```

</details>

A `<Navigate>` element changes the current location when it is rendered. It's a component wrapper around [`useNavigate`](#usenavigate), and accepts all the same arguments as props.

> **Note:**
>
> Having a component-based version of the `useNavigate` hook makes it easier to
> use this feature in a [`React.Component`](https://reactjs.org/docs/react-component.html)
> subclass where hooks are not able to be used.

```tsx
import * as React from "react";
import { Navigate } from "react-router-dom";

class LoginForm extends React.Component {
  state = { user: null, error: null };

  async handleSubmit(event) {
    event.preventDefault();
    try {
      let user = await login(event.target);
      this.setState({ user });
    } catch (error) {
      this.setState({ error });
    }
  }

  render() {
    let { user, error } = this.state;
    return (
      <div>
        {error && <p>{error.message}</p>}
        {user && (
          <Navigate to="/dashboard" replace={true} />
        )}
        <form onSubmit={event => this.handleSubmit(event)}>
          <input type="text" name="username" />
          <input type="password" name="password" />
        </form>
      </div>
    );
  }
}
```

### `<Outlet>`

<details>
  <summary>Type declaration</summary>

```tsx
interface OutletProps {
  context?: unknown;
}
declare function Outlet(
  props: OutletProps
): React.ReactElement | null;
```

</details>

An `<Outlet>` should be used in parent route elements to render their child route elements. This allows nested UI to show up when child routes are rendered. If the parent route matched exactly, it will render a child index route or nothing if there is no index route.

```tsx
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* This element will render either <DashboardMessages> when the URL is
          "/messages", <DashboardTasks> at "/tasks", or null if it is "/"
      */}
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route
          path="messages"
          element={<DashboardMessages />}
        />
        <Route path="tasks" element={<DashboardTasks />} />
      </Route>
    </Routes>
  );
}
```

### `useOutletContext`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useOutletContext<
  Context = unknown
>(): Context;
```

</details>

Often parent routes manage state or other values you want shared with child routes. You can create your own [context provider](https://reactjs.org/docs/context.html) if you like, but this is such a common situation that it's built-into `<Outlet />`:

```tsx lines=[3]
function Parent() {
  const [count, setCount] = React.useState(0);
  return <Outlet context={[count, setCount]} />;
}
```

```tsx lines=[2]
function Child() {
  const [count, setCount] = useOutletContext();
  const increment = () => setCount(c => c + 1);
  return <button onClick={increment}>{count}</button>;
}
```

If you're using TypeScript, we recommend the parent component provide a custom hook for accessing the context value. This makes it easier for consumers to get nice typings, control consumers, and know who's consuming the context value. Here's a more realistic example:

```tsx filename=src/routes/dashboard.tsx lines=[12,17-19]
import * as React from "react";
import type { User } from "./types";

type ContextType = { user: User | null };

export default function Dashboard() {
  const [user, setUser] = React.useState<User | null>(null);

  return (
    <div>
      <h1>Dashboard</h1>
      <Outlet context={user} />
    </div>
  );
}

export function useUser() {
  return useOutletContext<ContextType>();
}
```

```tsx filename=src/routes/dashboard/messages.tsx lines=[1,4]
import { useUser } from "../dashboard";

export default function DashboardMessages() {
  const user = useUser();
  return (
    <div>
      <h2>Messages</h2>
      <p>Hello, {user.name}!</p>
    </div>
  );
}
```

### `<Router>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function Router(
  props: RouterProps
): React.ReactElement | null;

interface RouterProps {
  basename?: string;
  children?: React.ReactNode;
  location: Partial<Location> | string;
  navigationType?: NavigationType;
  navigator: Navigator;
  static?: boolean;
}
```

</details>

`<Router>` is the low-level interface that is shared by all router components ([`<BrowserRouter>`](#browserrouter), [`<HashRouter>`](#hashrouter), [`<StaticRouter>`](#staticrouter), [`<NativeRouter>`](#nativerouter), and [`<MemoryRouter>`](#memoryrouter)). In terms of React, `<Router>` is a [context provider](https://reactjs.org/docs/context.html#contextprovider) that supplies routing information to the rest of the app.

You probably never need to render a `<Router>` manually. Instead, you should use one of the higher-level routers depending on your environment. You only ever need one router in a given app.

The `<Router basename>` prop may be used to make all routes and links in your app relative to a "base" portion of the URL pathname that they all share. This is useful when rendering only a portion of a larger app with React Router or when your app has multiple entry points. Basenames are not case-sensitive.

<a name="routes"></a>
<a name="route"></a>
<a name="routes-and-route"></a>

### `<Routes>` and `<Route>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function Routes(
  props: RoutesProps
): React.ReactElement | null;

interface RoutesProps {
  children?: React.ReactNode;
  location?: Partial<Location> | string;
}

declare function Route(
  props: RouteProps
): React.ReactElement | null;

interface RouteProps {
  caseSensitive?: boolean;
  children?: React.ReactNode;
  element?: React.ReactElement | null;
  index?: boolean;
  path?: string;
}
```

</details>

`<Routes>` and `<Route>` are the primary ways to render something in React Router based on the current [`location`](#location). You can think about a `<Route>` kind of like an `if` statement; if its `path` matches the current URL, it renders its `element`! The `<Route caseSensitive>` prop determines if the matching should be done in a case-sensitive manner (defaults to `false`).

Whenever the location changes, `<Routes>` looks through all its `children` `<Route>` elements to find the best match and renders that branch of the UI. `<Route>` elements may be nested to indicate nested UI, which also correspond to nested URL paths. Parent routes render their child routes by rendering an [`<Outlet>`](#outlet).

```tsx
<Routes>
  <Route path="/" element={<Dashboard />}>
    <Route
      path="messages"
      element={<DashboardMessages />}
    />
    <Route path="tasks" element={<DashboardTasks />} />
  </Route>
  <Route path="about" element={<AboutPage />} />
</Routes>
```

> **Note:**
>
> If you'd prefer to define your routes as regular JavaScript objects instead
> of using JSX, [try `useRoutes` instead](#useroutes).

The default `<Route element>` is an [`<Outlet>`](#outlet). This means the route will still render its children even without an explicit `element` prop, so you can nest route paths without nesting UI around the child route elements.

For example, in the following config the parent route renders an `<Outlet>` by default, so the child route will render without any surrounding UI. But the child route's path is `/users/:id` because it still builds on its parent.

```tsx
<Route path="users">
  <Route path=":id" element={<UserProfile />} />
</Route>
```

### `<StaticRouter>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function StaticRouter(
  props: StaticRouterProps
): React.ReactElement;

interface StaticRouterProps {
  basename?: string;
  children?: React.ReactNode;
  location?: Path | LocationPieces;
}
```

</details>

`<StaticRouter>` is used to render a React Router web app in [node](https://nodejs.org). Provide the current location via the `location` prop.

- `<StaticRouter location>` defaults to `"/"`

```tsx
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import http from "http";

function requestHandler(req, res) {
  let html = ReactDOMServer.renderToString(
    <StaticRouter location={req.url}>
      {/* The rest of your app goes here */}
    </StaticRouter>
  );

  res.write(html);
  res.end();
}

http.createServer(requestHandler).listen(3000);
```

### `createRoutesFromChildren`

<details>
  <summary>Type declaration</summary>

```tsx
declare function createRoutesFromChildren(
  children: React.ReactNode
): RouteObject[];

interface RouteObject {
  caseSensitive?: boolean;
  children?: RouteObject[];
  element?: React.ReactNode;
  index?: boolean;
  path?: string;
}
```

</details>

`createRoutesFromChildren` is a helper that creates route objects from `<Route>` elements. It is used internally in a [`<Routes>` element](#routes-and-route) to generate a route config from its [`<Route>`](#routes-and-route) children.

### `generatePath`

<details>
  <summary>Type declaration</summary>

```tsx
declare function generatePath(
  path: string,
  params?: Params
): string;
```

</details>

`generatePath` interpolates a set of params into a route path string with `:id` and `*` placeholders. This can be useful when you want to eliminate placeholders from a route path so it matches statically instead of using a dynamic parameter.

```tsx
generatePath("/users/:id", { id: 42 }); // "/users/42"
generatePath("/files/:type/*", {
  type: "img",
  "*": "cat.jpg"
}); // "/files/img/cat.jpg"
```

### `Location`

The term "location" in React Router refers to [the `Location` interface](https://github.com/remix-run/history/blob/main/docs/api-reference.md#location) from the [history](https://github.com/remix-run/history) library.

> **Note:**
>
> The `history` package is React Router's only dependency and many of the
> core types in React Router come directly from that library including
> `Location`, `To`, `Path`, `State`, and others. You can read more about
> the history library in [its documentation](https://github.com/remix-run/history/tree/main/docs).

### `matchRoutes`

<details>
  <summary>Type declaration</summary>

```tsx
declare function matchRoutes(
  routes: RouteObject[],
  location: Partial<Location> | string,
  basename?: string
): RouteMatch[] | null;

interface RouteMatch<ParamKey extends string = string> {
  params: Params<ParamKey>;
  pathname: string;
  route: RouteObject;
}
```

</details>

`matchRoutes` runs the route matching algorithm for a set of routes against a given [`location`](#location) to see which routes (if any) match. If it finds a match, an array of `RouteMatch` objects is returned, one for each route that matched.

This is the heart of React Router's matching algorithm. It is used internally by [`useRoutes`](#useroutes) and the [`<Routes>` component](#routes-and-route) to determine which routes match the current location. It can also be useful in some situations where you want to manually match a set of routes.

### `renderMatches`

<details>
  <summary>Type declaration</summary>

```tsx
declare function renderMatches(
  matches: RouteMatch[] | null
): React.ReactElement | null;
```

</details>

`renderMatches` renders the result of `matchRoutes()` into a React element.

### `matchPath`

<details>
  <summary>Type declaration</summary>

```tsx
declare function matchPath<
  ParamKey extends string = string
>(
  pattern: PathPattern | string,
  pathname: string
): PathMatch<ParamKey> | null;

interface PathMatch<ParamKey extends string = string> {
  params: Params<ParamKey>;
  pathname: string;
  pattern: PathPattern;
}

interface PathPattern {
  path: string;
  caseSensitive?: boolean;
  end?: boolean;
}
```

</details>

`matchPath` matches a route path pattern against a URL pathname and returns information about the match. This is useful whenever you need to manually run the router's matching algorithm to determine if a route path matches or not. It returns `null` if the pattern does not match the given pathname.

The [`useMatch` hook](#usematch) uses this function internally to match a route path relative to the current location.

### `resolvePath`

<details>
  <summary>Type declaration</summary>

```tsx
declare function resolvePath(
  to: To,
  fromPathname?: string
): Path;

type To = Partial<Location> | string;

interface Path {
  pathname: string;
  search: string;
  hash: string;
}
```

</details>

`resolvePath` resolves a given `To` value into an actual `Path` object with an absolute `pathname`. This is useful whenever you need to know the exact path for a relative `To` value. For example, the `<Link>` component uses this function to know the actual URL it points to.

The [`useResolvedPath` hook](#useresolvedpath) uses `resolvePath` internally to resolve the pathname. If `to` contains a pathname, it is resolved against the current route pathname. Otherwise, it is resolved against the current URL (`location.pathname`).

### `useHref`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useHref(to: To): string;
```

</details>

The `useHref` hook returns a URL that may be used to link to the given `to` location, even outside of React Router.

> **Tip:**
>
> You may be interested in taking a look at the source for the `<Link>`
> component in `react-router-dom` to see how it uses `useHref` internally to
> determine its own `href` value.

### `useLinkClickHandler`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useLinkClickHandler<
  E extends Element = HTMLAnchorElement,
  S extends State = State
>(
  to: To,
  options?: {
    target?: React.HTMLAttributeAnchorTarget;
    replace?: boolean;
    state?: S;
  }
): (event: React.MouseEvent<E, MouseEvent>) => void;
```

</details>

The `useLinkClickHandler` hook returns a click event handler to for navigation when building a custom `<Link>` in `react-router-dom`.

```tsx
import {
  useHref,
  useLinkClickHandler
} from "react-router-dom";

const StyledLink = styled("a", { color: "fuchsia" });

const Link = React.forwardRef(
  (
    {
      onClick,
      replace = false,
      state,
      target,
      to,
      ...rest
    },
    ref
  ) => {
    let href = useHref(to);
    let handleClick = useLinkClickHandler(to, {
      replace,
      state,
      target
    });

    return (
      <StyledLink
        {...rest}
        href={href}
        onClick={event => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            handleClick(event);
          }
        }}
        ref={ref}
        target={target}
      />
    );
  }
);
```

### `useLinkPressHandler`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useLinkPressHandler<
  S extends State = State
>(
  to: To,
  options?: {
    replace?: boolean;
    state?: S;
  }
): (event: GestureResponderEvent) => void;
```

</details>

The `react-router-native` counterpart to `useLinkClickHandler`, `useLinkPressHandler` returns a press event handler for custom `<Link>` navigation.

```tsx
import { TouchableHighlight } from "react-native";
import { useLinkPressHandler } from "react-router-native";

function Link({
  onPress,
  replace = false,
  state,
  to,
  ...rest
}) {
  let handlePress = useLinkPressHandler(to, {
    replace,
    state
  });

  return (
    <TouchableHighlight
      {...rest}
      onPress={event => {
        onPress?.(event);
        if (!event.defaultPrevented) {
          handlePress(event);
        }
      }}
    />
  );
}
```

### `useInRouterContext`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useInRouterContext(): boolean;
```

</details>

The `useInRouterContext` hooks returns `true` if the component is being rendered in the context of a `<Router>`, `false` otherwise. This can be useful for some 3rd-party extensions that need to know if they are being rendered in the context of a React Router app.

### `useLocation`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useLocation(): Location;

interface Location<S extends State = object | null>
  extends Path {
  state: S;
  key: Key;
}
```

</details>

This hook returns the current [`location`](#location) object. This can be useful if you'd like to perform some side effect whenever the current location changes.

```tsx
import * as React from 'react';
import { useLocation } from 'react-router-dom';

function App() {
  let location = useLocation();

  React.useEffect(() => {
    ga('send', 'pageview');
  }, [location]);

  return (
    // ...
  );
}
```

### `useNavigationType`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useNavigationType(): NavigationType;

type NavigationType = "POP" | "PUSH" | "REPLACE";
```

</details>

This hook returns the current type of navigation or how the user came to the current page; either via a pop, push, or replace action on the history stack.

### `useMatch`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useMatch<ParamKey extends string = string>(
  pattern: PathPattern | string
): PathMatch<ParamKey> | null;
```

</details>

Returns match data about a route at the given path relative to the current location.

See [`matchPath`](#matchpath) for more information.

### `useNavigate`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useNavigate(): NavigateFunction;

interface NavigateFunction {
  (
    to: To,
    options?: { replace?: boolean; state?: any }
  ): void;
  (delta: number): void;
}
```

</details>

The `useNavigate` hook returns a function that lets you navigate programmatically, for example after a form is submitted.

```tsx
import { useNavigate } from "react-router-dom";

function SignupForm() {
  let navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    await submitForm(event.target);
    navigate("../success", { replace: true });
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

The `navigate` function has two signatures:

- Either pass a `To` value (same type as `<Link to>`) with an optional second `{ replace, state }` arg or
- Pass the delta you want to go in the history stack. For example, `navigate(-1)` is equivalent to hitting the back button.

### `useOutlet`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useOutlet(): React.ReactElement | null;
```

</details>

Returns the element for the child route at this level of the route hierarchy. This hook is used internally by [`<Outlet>`](#outlet) to render child routes.

### `useParams`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useParams<
  K extends string = string
>(): Readonly<Params<K>>;
```

</details>

The `useParams` hook returns an object of key/value pairs of the dynamic params from the current URL that were matched by the `<Route path>`. Child routes inherit all params from their parent routes.

```tsx
import * as React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';

function ProfilePage() {
  // Get the userId param from the URL.
  let { userId } = useParams();
  // ...
}

function App() {
  return (
    <Routes>
      <Route path="users">
        <Route path=":userId" element={<ProfilePage />} />
        <Route path="me" element={...} />
      </Route>
    </Routes>
  );
}
```

### `useResolvedPath`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useResolvedPath(to: To): Path;
```

</details>

This hook resolves the `pathname` of the location in the given `to` value against the pathname of the current location.

This is useful when building links from relative values. For example, check out the source to [`<NavLink>`](#navlink) which calls `useResolvedPath` internally to resolve the full pathname of the page being linked to.

See [`resolvePath`](#resolvepath) for more information.

### `useRoutes`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useRoutes(
  routes: RouteObject[],
  location?: Partial<Location> | string;
): React.ReactElement | null;
```

</details>

The `useRoutes` hook is the functional equivalent of [`<Routes>`](#routes), but it uses JavaScript objects instead of `<Route>` elements to define your routes. These objects have the same properties as normal [`<Route>` elements](#routes-and-route), but they don't require JSX.

The return value of `useRoutes` is either a valid React element you can use to render the route tree, or `null` if nothing matched.

```tsx
import * as React from "react";
import { useRoutes } from "react-router-dom";

function App() {
  let element = useRoutes([
    {
      path: "/",
      element: <Dashboard />,
      children: [
        {
          path: "messages",
          element: <DashboardMessages />
        },
        { path: "tasks", element: <DashboardTasks /> }
      ]
    },
    { path: "team", element: <AboutPage /> }
  ]);

  return element;
}
```

### `useSearchParams`

> **Note:**
>
> This is the web version of `useSearchParams`. For the React Native version,
> [go here](#usesearchparams-react-native).

<details>
  <summary>Type declaration</summary>

```tsx
declare function useSearchParams(
  defaultInit?: URLSearchParamsInit
): [URLSearchParams, URLSearchParamsSetter];

type ParamKeyValuePair = [string, string];

type URLSearchParamsInit =
  | string
  | ParamKeyValuePair[]
  | Record<string, string | string[]>
  | URLSearchParams;

interface URLSearchParamsSetter {
  (
    nextInit: URLSearchParamsInit,
    navigateOptions?: { replace?: boolean; state?: State }
  ): void;
}
```

</details>

The `useSearchParams` hook is used to read and modify the query string in the URL for the current location. Like React's own [`useState` hook](https://reactjs.org/docs/hooks-reference.html#usestate), `useSearchParams` returns an array of two values: the current location's [search params](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) and a function that may be used to update them.

```tsx
import * as React from "react";
import { useSearchParams } from "react-router-dom";

function App() {
  let [searchParams, setSearchParams] = useSearchParams();

  function handleSubmit(event) {
    event.preventDefault();
    // The serialize function here would be responsible for
    // creating an object of { key: value } pairs from the
    // fields in the form that make up the query.
    let params = serializeFormQuery(event.target);
    setSearchParams(params);
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>{/* ... */}</form>
    </div>
  );
}
```

> **Note:**
>
> The `setSearchParams` function works like [`navigate`](#usenavigate), but
> only for the [search portion](https://developer.mozilla.org/en-US/docs/Web/API/Location/search)
> of the URL. Also note that the second arg to `setSearchParams` is
> the same type as the second arg to `navigate`.

### `useSearchParams` (React Native)

> **Note:**
>
> This is the React Native version of `useSearchParams`. For the web version,
> [go here](#usesearchparams).

<details>
  <summary>Type declaration</summary>

```tsx
declare function useSearchParams(
  defaultInit?: URLSearchParamsInit
): [URLSearchParams, URLSearchParamsSetter];

type ParamKeyValuePair = [string, string];

type URLSearchParamsInit =
  | string
  | ParamKeyValuePair[]
  | Record<string, string | string[]>
  | URLSearchParams;

interface URLSearchParamsSetter {
  (
    nextInit: URLSearchParamsInit,
    navigateOptions?: { replace?: boolean; state?: State }
  ): void;
}
```

</details>

The `useSearchParams` hook is used to read and modify the query string in the URL for the current location. Like React's own [`useState` hook](https://reactjs.org/docs/hooks-reference.html#usestate), `useSearchParams` returns an array of two values: the current location's [search params](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) and a function that may be used to update them.

```tsx
import * as React from "react";
import { View, SearchForm, TextInput } from "react-native";
import { useSearchParams } from "react-router-native";

function App() {
  let [searchParams, setSearchParams] = useSearchParams();
  let [query, setQuery] = React.useState(
    searchParams.get("query")
  );

  function handleSubmit() {
    setSearchParams({ query });
  }

  return (
    <View>
      <SearchForm onSubmit={handleSubmit}>
        <TextInput value={query} onChangeText={setQuery} />
      </SearchForm>
    </View>
  );
}
```

### `createSearchParams`

<details>
  <summary>Type declaration</summary>

```tsx
declare function createSearchParams(
  init?: URLSearchParamsInit
): URLSearchParams;
```

</details>

`createSearchParams` is a thin wrapper around [`new URLSearchParams(init)`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams) that adds support for using objects with array values. This is the same function that `useSearchParams` uses internally for creating `URLSearchParams` objects from `URLSearchParamsInit` values.
