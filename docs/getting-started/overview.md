---
title: Overview
order: 2
---

# Overview

If you're familiar with the JavaScript ecosystem, React, and React Router, this serves as a quick overview of React Router v6 with lots of code and minimal explanations.

- For a complete introduction to React Router, do the [Tutorial](tutorial.md)
- For extensive documentation on every API, see [API Reference](../api.md)
- For a deeper understanding of concepts, see [Main Concepts](concepts.md)

## Installation

```sh
npm install react-router-dom@6
```

## Configuring Routes

```jsx
import { render } from "react-dom";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
// import your route components too

render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="teams" element={<Teams />}>
          <Route path=":teamId" element={<Team />} />
          <Route path="new" element={<NewTeamForm />} />
          <Route index element={<LeagueStandings />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>,
  document.getElementById("root")
);
```

In previous versions of React Router you had to order your routes a certain way to get the right one to render when multiple routes matched an ambiguous URL. V6 is a lot smarter and will pick the most specific match so you don't have to worry about that anymore. For example, the URL `/teams/new` matches both of these route:

```jsx
<Route path="teams/:teamId" element={<Team />} />
<Route path="teams/new" element={<NewTeamForm />} />
```

But `teams/new` is a more specific match than `/teams/:teamId`, so `<NewTeamForm />` will render.

## Navigation

Use `Link` to let the user change the URL or `useNavigate` to do it yourself (like after form submissions):

```tsx
import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Home</h1>
      <nav>
        <Link to="/">Home</Link> |{" "}
        <Link to="about">About</Link>
      </nav>
    </div>
  );
}
```

```tsx
import { useNavigate } from "react-router-dom";

function Invoices() {
  let navigate = useNavigate();
  return (
    <div>
      <NewInvoiceForm
        onSubmit={async event => {
          let newInvoice = await createInvoice(
            event.target
          );
          navigate(`/invoices/${newInvoice.id}`);
        }}
      />
    </div>
  );
}
```

## Reading URL Parameters

Use `:style` syntax in your route path and `useParams()` to read them:

```tsx
import { Routes, Route, useParams } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route
        path="invoices/:invoiceId"
        element={<Invoice />}
      />
    </Routes>
  );
}

function Invoice() {
  let params = useParams();
  return <h1>Invoice {params.invoiceId}</h1>;
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

## Nested Routes

This is one of the most powerful features of React Router making it so you don't have to mess around with complicated layout code. The vast majority of your layouts are coupled to segments of the URL and React Router embraces this fully.

Routes can be nested inside one another, and their paths will nest too (child inheriting the parent).

```tsx
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
```

This route config defined three route paths:

- `"/invoices"`
- `"/invoices/sent"`
- `"/invoices/:invoiceId"`

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

Notice the inner component that changed with the URL (`<SentInvoices>` and `<Invoice>`). The parent route (`<Invoices>`) is responsible for making sure the matching child route is rendered with [`<Outlet>`](../api.md#outlet). Here's the full example:

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

Here's another example of a root layout with navigation that persists while the inner page swaps out with the URL:

```tsx
import {
  Routes,
  Route,
  Link,
  Outlet
} from "react-router-dom";

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
        <Route index element={<Activity />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="activity" element={<Activity />} />
      </Route>
    </Routes>
  );
}
```

Now at "/" the `<Activity>` element will render inside the outlet.

You can have an index route at any level of the route hierarchy that will render when the parent matches but none of its other children do.

```tsx
function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="dashboard" element={<Dashboard />}>
        <Route index element={<DashboardHome />} />
        <Route
          path="invoices"
          element={<DashboardInvoices />}
        />
      </Route>
    </Routes>
  );
}
```

## Relative Links

Relative `<Link to>` values (that do not begin with a `/`) are relative to the path of the route that rendered them. The two links below will link to `/dashboard/invoices` and `/dashboard/team` because they're rendered inside of `<Dashboard>`. This is really nice when you change a parent's URL or re-arrange your components because all of your links automatically update.

```tsx
import {
  Routes,
  Route,
  Link,
  Outlet
} from "react-router-dom";

function Home() {
  return <h1>Home</h1>;
}

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <nav>
        <Link to="invoices">Invoices</Link>{" "}
        <Link to="team">Team</Link>
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

Although you should only ever have a single `<Router>` in an app, you may have as many [`<Routes>`](../api.md#routes) as you need, wherever you need them. Each `<Routes>` element operates independently of the others and picks a child route to render.

```tsx
function App() {
  return (
    <div>
      <Sidebar>
        <Routes>
          <Route path="/" element={<MainNav />} />
          <Route
            path="dashboard"
            element={<DashboardNav />}
          />
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

You can render [a `<Routes>` element](../api.md#routes) anywhere you need one, including deep within the component tree of another `<Routes>`. These will work just the same as any other `<Routes>`, except they will automatically build on the path of the route that rendered them. If you do this, _make sure to put a \* at the end of the parent route's path_. Otherwise, the parent route won't match the URL when it is longer than the parent route's path, and your descendant `<Routes>` won't ever show up.

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

And that's just about it! We haven't covered every API here, but these are definitely the most common ones you'll use. If you'd like to learn more, go ahead and follow [our tutorial](tutorial.md) or browse [the full API reference](../api.md).
