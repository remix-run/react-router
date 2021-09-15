---
title: Overview
order: 2
---

React Router is a fully-featured client and server-side routing library for React, a JavaScript library for building user interfaces. React Router runs anywhere React runs; on the web, on the server with node.js, and on React Native.

If you're just getting started with React generally, we recommend you follow [the excellent Getting Started guide](https://reactjs.org/docs/getting-started.html) in the official docs. There is plenty of information there to get you up and running. React Router is compatible with React >= 16.8.

If you're just getting started with React Router, we recommend you read the [installation guide](./installation) guide first. Once you have React Router installed and running, come back and continue with this guide.

## Introduction

The heart of React Router is the concept of a _route_. Routes in React Router might a little different than you're used to. Let's get some vocabulary figured out to help us understand them better:

- **URL** - The URL in the address bar. A lot of people use the term "url" and "route" interchangeably, but this is not a "route" in React Router, it's just a url.
- **History Stack** - As the user navigates around, the browser puts entries in the history stack. Think about when you click and hold the back button in a browser, you can see the history stack right there.
- **Location** - When the user visits a URL, this becomes a "location" entry in the history stack. The same url can have multiple locations in the stack. The user could have clicked "/home", "/messages", and "/home" again: three entries, only two URLs.
- **URL Segment** - URLs are made up of segments divided by `/`. Sometimes you want to match dynamically on specific segments of the url, like getting the user id out of `"/users/123"`.
- **Path Pattern** - These look like URLs but can have special characters for matching urls to routes, like dynamic params (`"/users/:userId"`) or catchall (`"/docs/\*"`). They aren't URLs, they're url path patterns that React Router will match.

Alright, so what is a route? A Route is a React component that conditionally renders its **element** when **URL segments** match the route's **path pattern** as the user navigates to **locations** in the **history stack**.

A simple web app with two pages, "home" and "about" might look something like this:

```tsx
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <div>
      <h1>Welcome</h1>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="about" element={<About />} />
      </Routes>
    </div>
  );
}

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById("app")
);
```

The [`<Router>`](../api-reference.md#router) provides information about the current [location](../api-reference.md#location) to the rest of its descendants. This example uses a [`<BrowserRouter>`](../api-reference.md#browserrouter). You should only ever render a single `<Router>` at or near the root of your component hierarchy.

The [`<Routes>`](../api-reference.md#routes) element is where you declare the routes you have and what element each [`<Route>`](../api-reference.md#route) renders when the location matches its `path` pattern.

## Navigation

React Router provides a [`Link`](../api-reference.md#link) component that you can use to let the user [navigate](../api-reference.md#navigation) around the app. Link is really just `<a href>` except it navigates without the browser making full page reloads.

```tsx
import { Routes, Route, Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Home</h1>
      <nav>
        <Link to="/">Home</Link> | <Link to="about">About</Link>
      </nav>
    </div>
  );
}

function About() {
  return <h1>About</h1>;
}

function App() {
  return (
    <div>
      <h1>Welcome</h1>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="about" element={<About />} />
      </Routes>
    </div>
  );
}
```

## Reading URL Parameters

If you use `:id`-style dynamic segments in `<Route path>`, React Router will to extract the values from the URL and make them available to you from the [`useParams`](../api-reference.md#useparams) hook. The name of the segment in the path becomes the name of the key on the params object:

```tsx [1,4,11]
import { Routes, Route, useParams } from "react-router-dom";

function Invoice() {
  let params = useParams();
  return <h1>Invoice {params.invoiceId}</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="invoices/:invoiceId" element={<Invoice />} />
    </Routes>
  );
}
```

Note that the path segment `:invoiceId` and the param's key `params.invoiceId` match up.

A very common use-case is fetching data when the component renders:

```tsx
function Invoice() {
  let { invoiceId } = useParams();
  let invoice = useFakeFetch(`/api/invoices/${invoiceId}`);
  return invoice ? (
    <div>
      <h1>{invoice.customerName}</h1>
    </div>
  ) : (
    <Loading />
  );
}
```

## Ambiguous Paths and Ranking

Sometimes multiple route paths match the URL. When determining which route to render in these situations, the route with a path that _best_ matches the url will be picked.

For example, consider these two routes:

```tsx
<Routes>
  <Route path="invoices/:invoiceId" element={<Invoice />} />
  <Route path="invoices/sent" element={<SentInvoices />} />
</Routes>
```

`<Route path="invoices/:invoiceId">` can match an infinite number of URLs like `"/invoices/123"` and `"/invoices/cupcake"`. `<Route path="/invoices/sent">`, however, can only match one URL: `"/invoices/sent"`.

So what happens when the URL is `"/invoices/sent"` and both paths match?

`<Route path="/invoices/sent">` is more specific than `<Route path="invoices/:invoiceId">` so `<SentInvoices>` will be rendered. It's the _best_ match. Unlike previous versions of React Router, this means you can organize your code however you'd like, putting the routes in whatever order makes the most sense to you.

We could render the same routes in the opposite order without changing what your app renders at `"/invoices/sent"`.

```tsx
<Routes>
  <Route path="invoices/sent" element={<SentInvoices />} />
  <Route path="invoices/:invoiceId" element={<Invoice />} />
</Routes>
```

There's a lot more to the way React Router picks the best match than just this but you don't really ever even have to think about it so we'll leave it at that.

## Nested Routes

This is one of the most powerful features of React Router making it so you don't have to mess around with complicated layout code. The vast majority of your layouts are coupled to segments of the URL and React Router embraces this fully.

Routes can be nested inside one another, and their paths will nest too (child inheriting the parent).

```tsx
function App() {
  return (
    <Routes>
      <Route path="invoices" element={<Invoices />}>
        <Route path=":invoiceId" element={<IndividualInvoice />} />
        <Route path="sent" element={<SentInvoices />} />
      </Route>
    </Routes>
  );
}
```

This route config defined three route paths:

- `"/invoices"`
- `"/invoices/sent"`
- `"/invoices/sent/:invoiceId"`

When the URL is `"/invoices/sent"` the component tree will be:

```tsx
<App>
  <Invoices>
    <SentInvoices />
  </Invoices>
</App>
```

When the URL is `"/invoices/123"`, the component tree will:

```tsx
<App>
  <Invoices>
    <Invoice />
  </Invoices>
</App>
```

Notice the inner component that changed with the URL (`<SentInvoices>` and `<Invoice>`). The parent route (`<Invoices>`) is responsible for making sure the matching child route is rendered with [`<Outlet>`](../api-reference.md#outlet). Here's the full example:

```tsx [18]
import { Routes, Route, Outlet } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="invoices" element={<Invoices />}>
        <Route path=":invoiceId" element={<Invoice />} />
        <Route path="sent" element={<SentInvoices />} />
      </Route>
    </Routes>
  );
}

function Invoices() {
  return (
    <div>
      <h1>Invoices</h1>
      <Outlet />
    </div>
  );
}

function Invoice() {
  let { invoiceId } = useParams();
  return <h1>Invoice {invoiceId}</h1>;
}

function SentInvoices() {
  return <h1>Sent Invoices</h1>;
}
```

The nested url segments map to nested component trees. This is perfect for creating UI that has persistent navigation in layouts with an inner section that changes with the URL. If you look around the web you'll notice many websites (and especially web apps) have multiple levels of layout nesting.

Here's a another example of a root layout with navigation that persists while the inner page swaps out with the URL:

```tsx
import { Routes, Route, Link, Outlet } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="invoices" element={<Invoices />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  return (
    <div>
      <h1>Welcome to the app!</h1>
      <nav>
        <Link to="invoices">Invoices</Link> |{" "}
        <Link to="dashboard">Dashboard</Link>
      </nav>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}

function Invoices() {
  return <h1>Invoices</h1>;
}

function Dashboard() {
  return <h1>Dashboard</h1>;
}
```

## Index Routes

Index routes can be thought of as "default child routes". When a parent route has multiple children, but the URL is just at the parent's path, you probably want to render something into the outlet.

Consider this example:

```tsx
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="invoices" element={<Invoices />} />
        <Route path="activity" element={<Activity />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  return (
    <div>
      <GlobalNav />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

This page looks great at "/invoices" and "/activity", but at "/" it's just a blank page in `<main>` because there is no child route to render there. For this we can add an index route:

```tsx [5]
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Activity />}>
        <Route path="invoices" element={<Invoices />} />
        <Route path="activity" element={<Activity />} />
      </Route>
    </Routes>
  );
}
```

Now at "/" the `<Activity>` element will render inside the outlet.

You can have an index route at any level of the route hierarchy that will render when the parent matches but none of it's other children do.

```tsx
function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="dashboard" element={<Dashboard />}>
        <Route index element={<DashboardHome />} />
        <Route path="invoices" element={<DashboardInvoices />} />
      </Route>
    </Routes>
  );
}
```

## Relative Links

Relative `<Link to>` values (that do not begin with a `/`) are relative to the path of the route that rendered them. The two links below will link to `/dashboard/invoices` and `/dashboard/team` because they're rendered inside of `<Dashboard>`. This is really nice when you change a parent's URL or re-arrange your components because all of your links automatically update.

```tsx
import { Routes, Route, Link, Outlet } from "react-router-dom";

function Home() {
  return <h1>Home</h1>;
}

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <nav>
        <Link to="invoices">Invoices</Link> <Link to="team">Team</Link>
      </nav>
      <hr />
      <Outlet />
    </div>
  );
}

function Invoices() {
  return <h1>Invoices</h1>;
}

function Team() {
  return <h1>Team</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="dashboard" element={<Dashboard />}>
        <Route path="invoices" element={<Invoices />} />
        <Route path="team" element={<Team />} />
      </Route>
    </Routes>
  );
}
```

## "Not Found" Routes

When no other route matches the URL, you can render a "not found" route using `path="*"`. This route will match any URL, but will have the weakest precedence so the router will only pick it if no other routes match.

```tsx
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

## Multiple Sets of Routes

Although you should only ever have a single `<Router>` in an app, you may have as many [`<Routes>`](../api-reference.md#routes) as you need, wherever you need them. Each `<Routes>` element operates independently of the others and picks a child route to render.

```tsx
function App() {
  return (
    <div>
      <Sidebar>
        <Routes>
          <Route path="/" element={<MainNav />} />
          <Route path="dashboard" element={<DashboardNav />} />
        </Routes>
      </Sidebar>

      <MainContent>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route path="about" element={<About />} />
            <Route path="support" element={<Support />} />
          </Route>
          <Route path="dashboard" element={<Dashboard />}>
            <Route path="invoices" element={<Invoices />} />
            <Route path="team" element={<Team />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MainContent>
    </div>
  );
}
```

## Descendant `<Routes>`

You can render [a `<Routes>` element](../api-reference.md#routes) anywhere you need one, including deep within the component tree of another `<Routes>`. These will work just the same as any other `<Routes>`, except they will automatically build on the path of the route that rendered them. If you do this, _make sure to put a \* at the end of the parent route's path_. Otherwise the parent route won't match the URL when it is longer than the parent route's path, and your descendant `<Routes>` won't ever show up.

```tsx [5]
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="dashboard/*" element={<Dashboard />} />
    </Routes>
  );
}

function Dashboard() {
  return (
    <div>
      <p>Look, more routes!</p>
      <Routes>
        <Route path="/" element={<DashboardGraphs />} />
        <Route path="invoices" element={<InvoiceList />} />
      </Routes>
    </div>
  );
}
```

## Navigating Programmatically

If you need to navigate programmatically (like after the user submits a form),
use the [`useNavigate`](../api-reference.md#usenavigate) hook to get a function you can use to navigate.

```tsx
import { useNavigate } from "react-router-dom";

function Invoices() {
  let navigate = useNavigate();
  return (
    <div>
      <NewInvoiceForm
        onSubmit={async event => {
          let newInvoice = await createInvoice(event.target);
          navigate(`/invoices/${newInvoice.id}`);
        }}
      />
    </div>
  );
}
```

And that's just about it! We haven't covered every API here, but these are definitely the most common ones you'll use. If you'd like to learn more, go ahead and follow [our tutorial](../tutorial) or browse [the full API reference](../api-reference.md).
