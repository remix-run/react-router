---
title: Framework Tutorial
order: 1
---

# Framework Tutorial

We'll be building a small, but feature-rich app that lets you keep track of your contacts. There's no database or other "production ready" things, so we can stay focused on the features React Router gives you. We expect it to take about 30m if you're following along, otherwise it's a quick read.

<!-- <img class="tutorial" src="/_docs/v7_framework_tutorial/01.webp" /> -->

👉 **Every time you see this it means you need to do something in the app!**

The rest is just there for your information and deeper understanding. Let's get to it.

## Setup

👉 **Generate a basic template**

```shellscript nonumber
npx create-react-router@latest --template remix-run/react-router/tutorial
```

This uses a pretty bare-bones template but includes our css and data model, so we can focus on React Router.

👉 **Start the app**

```shellscript nonumber
# cd into the app directory
cd {wherever you put the app}

# install dependencies if you haven't already
npm install

# start the server
npm run dev
```

You should be able to open up [http://localhost:5173][http-localhost-5173] and see an unstyled screen that looks like this:

<!-- <img class="tutorial" src="/_docs/v7_framework_tutorial/02.webp" /> -->

## The Root Route

Note the file at `app/root.tsx`. This is what we call the ["Root Route"][root-route]. It's the first component in the UI that renders, so it typically contains the global layout for the page, as well as a the default [Error Boundary][error-boundaries].

<details>

<summary>Expand here to see the root component code</summary>

```tsx filename=app/root.tsx
import {
  Form,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <div id="sidebar">
        <h1>React Router Contacts</h1>
        <div>
          <Form id="search-form" role="search">
            <input
              aria-label="Search contacts"
              id="q"
              name="q"
              placeholder="Search"
              type="search"
            />
            <div
              aria-hidden
              hidden={true}
              id="search-spinner"
            />
          </Form>
          <Form method="post">
            <button type="submit">New</button>
          </Form>
        </div>
        <nav>
          <ul>
            <li>
              <a href={`/contacts/1`}>Your Name</a>
            </li>
            <li>
              <a href={`/contacts/2`}>Your Friend</a>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}

export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (
    import.meta.env.DEV &&
    error &&
    error instanceof Error
  ) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main id="error-page">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
```

</details>

## Adding Stylesheets with `links`

While there are multiple ways to style your React Router app, we're going to use a plain stylesheet that's already been written to keep things focused on React Router.

👉 **Import the app styles**

```tsx filename=app/root.tsx lines=[1,4,6-8]
import type { LinksFunction } from "@remix-run/node";
// existing imports

import appStylesHref from "./app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];
```

Every route can export a [`links`][links] function. They will be collected and rendered into the `<Links />` component we rendered in `app/root.tsx`.

If you prefer, you can also import CSS files directly into JavaScript modules. Vite will fingerprint the asset, save it to your build's client directory, and provide your module with the publicly accessible href.

The app should look something like this now.

<!-- <img class="tutorial" loading="lazy" src="/_docs/v7_framework_tutorial/03.webp" /> -->

## The Contact Route UI

NEXT

<!-- <img class="tutorial" loading="lazy" src="/_docs/v7_framework_tutorial/04.webp" /> -->

## Nested Routes and Outlets

React Router supports nested routing. In order for child routes to render inside of parent layouts, we need to render an [`Outlet`][outlet-component] in the parent. Let's fix it, open up `app/root.tsx` and render an outlet inside.

👉 **Render an [`<Outlet />`][outlet-component]**

```tsx filename=app/root.tsx lines=[6,17-19]
// existing imports
import {
  Form,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
// existing imports & code

export default function App() {
  return (
    <>
      <div id="sidebar">{/* other elements */}</div>
      <div id="detail">
        <Outlet />
      </div>
    </>
  );
}
```

Now the child route should be rendering through the outlet.

<!-- <img class="tutorial" loading="lazy" src="/_docs/v7_framework_tutorial/05.webp" /> -->

## Adding a `HydrateFallback`

note `react-router.config.ts`

## Client Side Routing

## Loading Data

## Type Safety

## URL Params in Loaders

## Validating Params and Throwing Responses

## Data Mutations

## Creating Contacts

## Updating Data

## Updating Contacts with `FormData`

## Mutation Discussion

## Redirecting new records to the edit page

## Active Link Styling

## Global Pending UI

## Deleting Records

## Index Routes

## Cancel Button

## `URLSearchParams` and `GET` Submissions

## Synchronizing URLs to Form State

## Submitting `Form`'s `onChange`

## Adding Search Spinner

## Managing the History Stack

## `Form`s Without Navigation

## Optimistic UI

## Adding an about page

- move root stuff to a layout
- add an about page

## Pre-rendering a static page

## Server Side Rendering

---

That's it! Thanks for giving React Router a shot. We hope this tutorial gives you a solid start to build great user experiences. There's a lot more you can do, so make sure to check out all the [APIs][react-router-apis] 😀

[http-localhost-5173]: http://localhost:5173
[root-route]: ../explanation/special-files#roottsx
[error-boundaries]: ../how-to/error-boundary
[links]: ../start/framework/route-module#links
[outlet-component]: https://api.reactrouter.com/v7/functions/react_router.Outlet
[react-router-apis]: https://api.reactrouter.com/v7/modules/react_router
