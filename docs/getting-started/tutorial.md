---
title: Quickstart Tutorial
order: 1
---

## Introduction

We'll keep this tutorial quick and to the point. By the end you'll know the APIs you deal with day-to-day with React Router. After that, you can dig into some of the other docs to get a deeper understanding.

While building a little bookeeping app we'll cover:

- Configuring Routes
- Navigating with Link
- Creating Links with active styling
- Using Nested Routes for Layout
- Navigating imperatively
- Using URL params for data loading
- Using URL Search params
- Creating your own behaviors through composition

## Installation

You can skip bundlers and use [this codesandbox](https://codesandbox) to code along in your browser.

If you prefer to do it locally, use [Create React App](https://npm.im/create-react-app) to get started:

```sh
npx create-react-app react-router-tutorial
cd react-router-tutorial
npm add react-router-dom@6 history@5
npm start
```

If you used Create React App, open up App.js and make sure it's pretty boring:

```tsx bad filename=src/App.js
export default function App() {
  return (
    <div>
      <h1>React Router!</h1>
    </div>
  );
}
```

Now go make sure `index.js` is likewise pretty boring:

```tsx filename=src/index.js
import { render } from "react-dom";
import App from "./App";

const rootElement = document.getElementById("root");
render(<App />, rootElement);
```

## Connect the URL

To connect your app to the browser's URL, import `BrowserRouter` and render it around your whole app in `src/index.js`:

```tsx lines=[2, 7-9] filename=src/index.js
import { render } from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const rootElement = document.getElementById("root");
render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  rootElement
);
```

## Add Some Links

Open up `src/App.js`, import `Link` and add some global navigation. Oh, and don't take the styling too seriously in this tutorial.

```tsx lines=[1, 7-9] filename=src/App.js
import { Link } from "react-router-dom";

export default function App() {
  return (
    <div>
      <h1>Bookkeeper</h1>
      <nav style={{ borderBottom: "solid 1px", paddingBottom: "1rem" }}>
        <Link to="/invoices">Invoices</Link> |{" "}
        <Link to="/expenses">Expenses</Link>
      </nav>
    </div>
  );
}
```

Go ahead and click the links and the back/forward button. React Router is now controlling the URL. We don't have any routes that render when the URL changes yet, but we can see that Link can change the URL without causing a full page reload.

## Add Some Routes

First add a couple new files:

- `src/routes/invoices.js`
- `src/routes/expenses.js`

(The location of the files doesn't matter, but when you decide you'd like an automatic backend API, server rendering, and code splitting bundler for this app, naming your files makes it easy to port this to our other project, [Remix](https://remix.run) 😉)

Now fill 'em up with some code:

```tsx filename=src/routes/expenses.js
export default function Expenses() {
  return <h2>Expenses</h2>;
}
```

```tsx filename=src/routes/invoices.js
export default function Invoices() {
  return <h2>Invoices</h2>;
}
```

Finally, let's create our first "route config" and teach Reach Router how to render our app at different URLs inside of `index.js`

YOU ARE ADDING STYLESCSS TO ALL OF THE CODE SAMPLES FOR INDEX>JS

```tsx lines=[2,4-5,10-14] filename=src/index.js
import { render } from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Expenses from "./routes/expenses";
import Invoices from "./routes/invoices";

const rootElement = document.getElementById("root");
render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="expenses" element={<Expenses />} />
      <Route path="invoices" element={<Invoices />} />
    </Routes>
  </BrowserRouter>,
  rootElement
);
```

Notice at `"/"` it renders `<App>`. At `"/invoices"` it render `<Invoices>`. Nice work!

<docs-warning>If you're using code sandbox the inline browser's URL bar is pretty broken. You'll want to pop out by clicking the "open in new window" button in the top right to have the real browser handle the url history</docs-warning>

## Nested Routes

You may have noticed when clicking the links that the layout in `App` disappears. Repeating shared layouts is a pain in the neck. With React Router we've learned that most UI is a series of nested layouts that almost always map to segments of the URL, so this idea is baked right into React Router.

Let's get some automatic, persistent layout handling by doing just two things:

1. Nest the routes inside of the App route
2. Render an Outlet

```jsx lines=[11-14] filename=src/index.js
import { render } from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Expenses from "./routes/expenses";
import Invoices from "./routes/invoices";

const rootElement = document.getElementById("root");
render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="expenses" element={<Expenses />} />
        <Route path="invoices" element={<Invoices />} />
      </Route>
    </Routes>
  </BrowserRouter>,
  rootElement
);
```

Notice how the expenses and invoices routes are **children** of the app route. This does two things:

1. It nests the URLs (`"/" + "expenses"`)
2. It will nest the UI components for shared layout when the child route matches

But before the second will work we need to render an `Outlet` in the parent route `App.js`

```jsx lines=[1,11] filename=src/App.js
import { Outlet, Link } from "react-router-dom";

export default function App() {
  return (
    <div>
      <h1>Bookkeeper</h1>
      <nav style={{ borderBottom: "solid 1px", paddingBottom: "1rem" }}>
        <Link to="/invoices">Invoices</Link> |{" "}
        <Link to="/expenses">Expenses</Link>
      </nav>
      <Outlet />
    </div>
  );
}
```

Now as you click around again. The parent route (`App.js`) persists while the `<Outlet>` swaps between the two child routes (`<Invoices>` and `<Expenses>`).

As we'll see later, this works at _any level_ of the route hierarchy and is incredibly powerful.

## Listing the Invoices

Normally you'd be fetching data from a server somewhere, but for this tutorail lets just hard code some fake stuff so we can focus on routing.

Make a file at `src/data.js` and copy/paste this in there:

```js filename=src/data.js
let invoices = [
  {
    name: "Santa Monica",
    number: 1995,
    amount: "$10,800",
    due: -1
  },
  {
    name: "Stankonia",
    number: 2000,
    amount: "$8,000",
    due: 0
  },
  {
    name: "Ocean Avenue",
    number: 2003,
    amount: "$9,500",
    due: 8
  },
  {
    name: "Tubthumper",
    number: 1997,
    amount: "$14,000",
    due: 10
  },
  {
    name: "Wide Open Spaces",
    number: 1998,
    amount: "$4,600",
    due: false
  }
];

export function getInvoices() {
  return invoices;
}
```

Now we can use it in the invoices route. Let's also add a bit of styling to get a sidebar nav layout going on.

```js lines=[2,5,9-13] filename=src/routes/invoices.js
import { Link } from "react-router-dom";
import { getInvoices } from "../data";

export default function Invoices() {
  let invoices = getInvoices();
  return (
    <div style={{ display: "flex" }}>
      <nav style={{ borderRight: "solid 1px", padding: "1rem" }}>
        {invoices.map(invoice => (
          <Link
            style={{ display: "block", margin: "1rem 0" }}
            to={`/invoices/${invoice.id}`}
          >
            {invoice.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

Cool! Now click an invoice link and see what happens.

## Adding a "No Match" Route

Notice as you click the links the page goes blank! That's because none of the routes we've defined match a URL like the ones we're linking to: `"/invoices/123"`.

Before we move on, it's good practice to always handle the "no match" case. Go back to your route config and add this:

```js lines=[5] filename=src/index.js
<Routes>
  <Route path="/" element={<App />}>
    <Route path="expenses" element={<Expenses />} />
    <Route path="invoices" element={<Invoices />} />
    <Route path="*" element={<p>There's nothing here!</p>} />
  </Route>
</Routes>
```

The `"*"` has special meaning here. It will match only when no other routes do.

## Reading URL Params

Alright, back to the individual invoice URLs. Let's add a route for a specific invoice. We just visted some URLs like `"/invoices/1998"` and `"/invoices/2005"`, lets make a new component at `src/routes/invoice.js` to render at those URLs:

```js filename=src/routes/invoice.js
export default function Invoice() {
  return <h2>Invoice #???</h2>;
}
```

We'd like to render the invoice number instead of `"???"`. Normally in React you'd pass this as a prop: `<Invoice invoiceId="123" />`, but you don't control that information, it comes from the URL. Let's define a route that will match these kinds of URLs and enable us to get the invoice id from it.

Create a new `<Route>` _inside_ of the "invoices" route like this:

```js lines=[4-6] filename=src/routes/index.js
<Routes>
  <Route path="/" element={<App />}>
    <Route path="expenses" element={<Expenses />} />
    <Route path="invoices" element={<Invoices />}>
      <Route path=":invoiceId" element={<Invoice />} />
    </Route>
    <Route path="*" element={<p>There's nothing here!</p>} />
  </Route>
</Routes>
```

A couple things to note:

- We just created a route that matches urls like "/invoices/2005" and "/invoices/1998". The `:invoiceId` part of the path is a "URL param", meaning it can match any value as long as the pattern is the same.
- The `<Route>` adds a second layer of route nesting when it matches: `<App><Invoices><Invoice /></Invoices></App>`. Because the `<Route>` is nested the UI will be nested too.

Alright, now go click a link to an invoice, note that the URL changes but the new invoice component doesn't show up yet. Do you know why?

That's right! We need to add an outlet to the parent layout route (we're really proud of you).

```tsx lines=[1,18] filename=src/routes/invoices.js
import { Link } from "react-router-dom";
import { getInvoices } from "../data";

export default function Invoices() {
  let invoices = getInvoices();
  return (
    <div style={{ display: "flex" }}>
      <nav style={{ borderRight: "solid 1px", padding: "1rem" }}>
        {invoices.map(invoice => (
          <Link
            style={{ display: "block", margin: "1rem 0" }}
            to={`/invoices/${invoice.id}`}
          >
            {invoice.name}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
```

Okay, let's close the circle here. Open up the invoice component again and let's get the `:invoiceId` param from the URL:

```ts lines=[1,4] filename=src/routes/invoice.js
import { useParams } from "react-router-dom";

export default function Invoice() {
  let params = useParams();
  return <h2>Invoice: {params.invoiceId}</h2>;
}
```

Note that the key of the param on the `params` object is the same as the dynamic segment in the route path:

```
:invoiceId -> params.invoiceId
```

Let's use that information to build up a more interesting invoice page. Open up `src/data.js` and add a new function to lookup invoices by their number:

```js filename=src/data.js lines=[7-9]
// ...

export function getInvoices() {
  return invoices;
}

export function getInvoice(number) {
  return invoices.find(invoice => invoice.number === number);
}
```

And now back in `invoice.js` we can display use the param to look it up and display more information:

```js filename=routes/invoice.js lines=[2,6]
import { useParams } from "react-router-dom";
import { getInvoice } from "../data";

export default function Invoice() {
  let params = useParams();
  let invoice = getInvoice(parseInt(params.invoiceId, 10));
  return (
    <main style={{ padding: "1rem" }}>
      <h2>Total Due: {invoice.amount}</h2>
      <p>
        {invoice.name}: {invoice.number}
      </p>
      <p>Due Date: {invoice.due}</p>
    </main>
  );
}
```

Note that we used `parseInt` around the param. It's very common for your data lookups to use a `number` type, but URL params are always `string`.

## Index Routes

Index routes are possibly the most difficult concept in React Router for people to understand. So if you've struggled before, we hope this can clarify it for you.

Right now you're probably looking at one of the invoices. Click on the "Invoices" link in the global nav of your app. Notice that the main content error goes blank! We can fix this with an "index" route.

```jsx filename=src/index.js lines=[5]
<Routes>
  <Route path="/" element={<App />}>
    <Route path="expenses" element={<Expenses />} />
    <Route path="invoices" element={<Invoices />}>
      <Route index element={<p>Select an invoice</p>}>
      <Route path=":invoiceId" element={<Invoice />} />
    </Route>
    <Route path="*" element={<p>There's nothing here!</p>} />
  </Route>
</Routes>
```

Awesome! Now the index route fills the space when we're at just `"/invoices"`. Notice it has the `index` prop instead of a `path`. That's because the index route shares the path of the parent. That's the whole point, it doesn't have a path. There are a few ways we try to answer the question "what is an index route?". Hopefully one of these sticks for you:

- Index routes render at the parent route's path.
- Index routes match when a parent route matches but none of the other children match.
- Index routes are the default child route for a parent route.
- Index routes render when the user hasn't clicked one of the items in a navigation list yet.

## Active Links

It's very common, especially in navigation lists, to display the link as the active link the user is looking at. Let's add this treatment to our invoices list.

```jsx lines=[1,10-17,22] filename=src/routes/invoices.js
import { NavLink, Outlet } from "react-router-dom";
import { getInvoices } from "../data";

export default function Invoices() {
  let invoices = getInvoices();
  return (
    <div style={{ display: "flex" }}>
      <nav style={{ borderRight: "solid 1px", padding: "1rem" }}>
        {invoices.map(invoice => (
          <NavLink
            style={({ isActive }) => {
              return {
                display: "block",
                margin: "1rem 0",
                color: isActive ? "red" : ""
              };
            }}
            key={invoice.number}
            to={`/invoices/${invoice.number}`}
          >
            {invoice.name}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
```

We did two three things there:

1. We swapped out `Link` for `NavLink`.
2. We changed the `style` from a simple object to a function that returns an object.
3. We changed the color of our link by looking at the `isActive` value that `NavLink` passed to our styling function.

You can do the same thing with `className` on `NavLink`:

```jsx
// normal string
<NavLink className="red" />

// function
<NavLink className={({ isActive }) => isActive ? "red" : "blue"} />
```

## Search Params

Search params are like URL params but they sit in a different position in the URL. Instead of being in the normal URL segments separated by `/`, they are at the end after a `?`. You've seen them across the web like "/login?success=1" or "/shoes?brand=nike&sort=asc&sortby=price".

React Router makes it easy to read and manipulate the search params with `useSearchParams`. It works a lot like `React.useState()` but stores and sets the state in the URL search params instead of in memory.

Let's see it in action by adding a little filter on the invoices nav list.

```jsx filename=routes/invoices.js lines=[1,6,11-20,22-27]
import { NavLink, Outlet, useSearchParams } from "react-router-dom";
import { getInvoices } from "../data";

export default function Invoices() {
  let invoices = getInvoices();
  let [searchParams, setSearchParams] = useSearchParams();

  return (
    <div style={{ display: "flex" }}>
      <nav style={{ borderRight: "solid 1px", padding: "1rem" }}>
        <input
          onChange={event => {
            let filter = event.target.value;
            if (filter) {
              setSearchParams({ filter });
            } else {
              setSearchParams({});
            }
          }}
        />
        {invoices
          .filter(invoice => {
            let filter = searchParams.get("filter");
            if (!filter) return true;
            let name = invoice.name.toLowerCase();
            return name.startsWith(filter.toLowerCase());
          })
          .map(invoice => (
            <NavLink
              style={({ isActive }) => ({
                display: "block",
                margin: "1rem 0",
                color: isActive ? "red" : ""
              })}
              key={invoice.number}
              to={`/invoices/${invoice.number}`}
            >
              {invoice.name}
            </NavLink>
          ))}
      </nav>
      <Outlet />
    </div>
  );
}
```

## Custom Behavior through Composition

If you filter the list and then click a link, you'll notice that:

- the search params in the URL go away
- the list is no longer filtered
- the input retains the filter

You might not like this state of your app. At this point it's a product decision for you to make, but there are two solid choices

1. Clear the input when the user clicks an item
2. Or persist the query string

Let's clear the input first. We can do it by simply controlling its value with the search params:

```js
<input
  value={searchParams.get("filter") || ""}
  onChange={event => {
    let filter = event.target.value;
    if (filter) {
      setSearchParams({ filter });
    } else {
      setSearchParams({});
    }
  }}
/>
```
