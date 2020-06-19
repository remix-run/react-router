<a name="top"></a>

# Getting Started with React Router

React Router is a fully-featured client and server-side routing library for React, a JavaScript library for building user interfaces. React Router runs anywhere React runs; on the web, on the server with node.js, and on React Native.

<a name="create"></a>

## Create a new React Router app

If you're just getting started with React, we recommend you follow [the excellent Getting Started guide](https://reactjs.org/docs/getting-started.html) in the official docs. There is plenty of information there to get you up and running. React Router is compatible with React >= 16.8.

If you're just getting started with React Router, we recommend you read our guide about how to [add React and React Router to your website](add-to-a-website.md) or how to [add React Router to your React Native app](add-to-react-native.md) if you're building something with [React Native](https://facebook.github.io/react-native/).

Once you have React Router installed and running, come back and continue with this guide.

<a name="intro"></a>

## Introduction

The heart of React Router is the concept of a *route*. A route represents a "page" in your app (or a "view" if you're on React Native). React Router represents routes internally with URLs, also called "locations". React Router lets you declare React elements that it renders when the user visits a route. 

A simple web app with two pages, "home" and "about" might look something like this:

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

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

ReactDOM.render((
  <Router>
    <App />
  </Router>
), document.getElementById('app'));
```

The [`<Router>` element](../api-reference.md#router) provides information about the current [location](../api-reference.md#location) to the rest of its descendants. This example uses a [`<BrowserRouter>`](../api-reference.md#browserrouter). You should only ever render a single `<Router>` at or near the root of your component hierarchy.

The [`<Routes>` element](../api-reference.md#routes) is where you declare what routes you have and what element each [`<Route>` element](../api-reference.md#route) renders when the location matches its `path`.

The remaining examples in this guide assume you are importing React and rendering an `<App>` element inside a `<Router>`, but to be brief we'll just show the `<Routes>` you'll need for that example. 

<a name="navigation"></a>

## Navigation

React Router provides [a `Link` component](../api-reference.md#link) that you can use to let the user [navigate](../api-reference.md#navigation) around the app.

```tsx
import { Routes, Route, Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>Home</h1>
      <nav>
        <Link to="/">Home</Link> |{' '}
        <Link to="about">About</Link>
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

<a name="params"></a>

## Reading URL Parameters

You can use dynamic `:id`-style segments in your `<Route path>` to extract values that you can use to fetch data or render something in your app. The [`useParams` hook](../api-reference.md#useparams) returns an object of key/value pairs of URL parameters.

```tsx
import { Routes, Route, useParams } from 'react-router-dom';

function Invoice() {
  let { invoiceId } = useParams();
  return <h1>Invoice {invoiceId}</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="invoices/:invoiceId" element={<Invoice />} />
    </Routes>
  );
}
```

<a name="ranking"></a>

## Ambiguous Paths and Ranking

When determining which route to render, the `Routes` element picks the route with the path that best matches the current location, which is usually the path that is the most specific.

For example, a route with `path="invoices/sent"` may match only `/invoices/sent`, so it is more specific than `path="invoices/:invoiceId"` which matches any URL that begins with `/invoices` (`/invoices/123`, `/invoices/cupcakes`, etc). You can organize your code however you'd like and put the routes in whatever order makes the most sense to you.

```tsx
import { Routes, Route, useParams } from 'react-router-dom';

function Invoice() {
  let { invoiceId } = useParams();
  return <h1>Invoice {invoiceId}</h1>;
}

function SentInvoices() {
  return <h1>Sent Invoices</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="invoices/:invoiceId" element={<Invoice />} />
      <Route path="invoices/sent" element={<SentInvoices />} />
    </Routes>
  );
}
```

<a name="nesting"></a>

## Nested Routes

Routes may be nested inside one another, and their paths will nest too. Components that are used higher in the route hierarchy may render [an `<Outlet>` element](../api-reference.md#outlet) to render their child routes.

```tsx
import { Routes, Route, Outlet } from 'react-router-dom';

function Invoices() {
  return (
    <div>
      <h1>Invoices</h1>

      {/*
        This element renders the element for the child route, which in
        this case will be either <SentInvoices> or <IndividualInvoice>
      */}
      <Outlet />
    </div>
  );
}

function IndividualInvoice() {
  let { invoiceId } = useParams();
  return <h1>Invoice {invoiceId}</h1>;
}

function SentInvoices() {
  return <h1>Sent Invoices</h1>;
}

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

Notice in the example above how nested route paths build on their parent path. This nesting behavior can be really useful for creating [navigation](../api-reference.md#navigation) and layouts where the surrounding UI remains consistent while the inner content changes between routes.

```tsx
import { Routes, Route, Link, Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <h1>Welcome to the app!</h1>
      <nav>
        <Link to="invoices">Invoices</Link> |{' '}
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
```

<a name="relative-links"></a>

## Relative Links

Relative `<Link to>` values (that do not begin with a `/`) are relative to the path of the route that rendered them. The two links below will link to `/dashboard/invoices` and `/dashboard/team` because they're rendered inside of `<Dashboard>`. This is really nice when you change a parent's URL or re-arrange your components because all of your links automatically update.

```tsx
import { Routes, Route, Link, Outlet } from 'react-router-dom';

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

<a name="index-routes"></a>

## Index Routes

Nested routes may use `path="/"` to indicate they should render at the path of the parent component. You can think about these routes like index pages for the rest of the child routes.

```tsx
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="dashboard" element={<Dashboard />}>
        <Route path="/" element={<DashboardHome />} />
        <Route path="invoices" element={<DashboardInvoices />} />
      </Route>
    </Routes>
  );
}
```

<a name="not-found-routes"></a>

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

<a name="multiple-sets-of-routes"></a>

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

<a name="descendant-routes"></a>

## Descendant Routes

You can render [a `<Routes>` element](../api-reference.md#routes) anywhere you need one, including deep within the component tree of another `<Routes>`. These will work just the same as any other `<Routes>`, except they will automatically build on the path of the route that rendered them. If you do this, *make sure to put a \* at the end of the parent route's path*. Otherwise the parent route won't match the URL when it is longer than the parent route's path, and your descendant `<Routes>` won't ever show up.


```tsx
function Dashboard(){
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="dashboard/*" element={<Dashboard />} />
    </Routes>
  );
}
```

<a name="navigating"></a>

## Navigating Programmatically

If you need to navigate programmatically (like after the user submits a form),
use [the `useNavigate` hook](../api-reference.md#usenavigate) to get a function you can use to navigate.

```tsx
import { useNavigate } from "react-router-dom";

function Invoices() {
  let navigate = useNavigate();
  return (
    <div>
      <NewInvoiceForm
        onSubmit={async event => {
          let newInvoice = await createInvoice(event.target)
          navigate(`/invoices/${newInvoice.id}`)
        }}
      />
    </div>
  );
}
```

And that's just about it! We haven't covered every API here, but these are definitely the most common ones you'll use. If you'd like to learn more, go ahead and follow [our tutorial](../tutorial) or browse [the full API reference](../api-reference.md).
