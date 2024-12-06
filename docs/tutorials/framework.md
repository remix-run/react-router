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
import type { LinksFunction } from "react-router";
// existing imports

import appStylesHref from "./app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];
```

Every route can export a [`links`][links] function. They will be collected and rendered into the `<Links />` component we rendered in `app/root.tsx`.

If you prefer, you can also import CSS files directly into JavaScript modules. Vite will fingerprint the asset, save it to your build's client directory, and provide your module with the publicly accessible href.

The app should look something like this now:

<!-- <img class="tutorial" loading="lazy" src="/_docs/v7_framework_tutorial/03.webp" /> -->

## The Contact Route UI

If you click on one of the sidebar items you'll get the default 404 page. Let's create a route that matches the url `/contacts/1`.

👉 **Create a contact route module**

```shellscript nonumber
mkdir app/pages
touch app/pages/contact.tsx
```

We could put this file anywhere we want, but to make things a bit more organized, we'll put all our routes inside the `app/pages` directory.

You can also use [file-based routing if you prefer][file-route-conventions].

👉 **Configure the route**

We need to tell React Router about our new route. `routes.ts` is a special file where we can configure all our routes.

```tsx filename=routes.ts lines=[3,7]
import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  route("contacts/:contactId", "pages/contact.tsx"),
] satisfies RouteConfig;
```

In the React Router `:` makes a segment dynamic. We just made the following urls match the `pages/contact.tsx` route module:

- `/contacts/123`
- `/contacts/abc`

👉 **Add the contact component UI**

It's just a bunch of elements, feel free to copy/paste.

```tsx filename=app/pages/contact.tsx
import { Form } from "react-router";
import type { FunctionComponent } from "react";

import type { ContactRecord } from "../data";

export default function Contact() {
  const contact = {
    first: "Your",
    last: "Name",
    avatar: "https://placecats.com/200/200",
    twitter: "your_handle",
    notes: "Some notes",
    favorite: true,
  };

  return (
    <div id="contact">
      <div>
        <img
          alt={`${contact.first} ${contact.last} avatar`}
          key={contact.avatar}
          src={contact.avatar}
        />
      </div>

      <div>
        <h1>
          {contact.first || contact.last ? (
            <>
              {contact.first} {contact.last}
            </>
          ) : (
            <i>No Name</i>
          )}{" "}
          <Favorite contact={contact} />
        </h1>

        {contact.twitter ? (
          <p>
            <a
              href={`https://twitter.com/${contact.twitter}`}
            >
              {contact.twitter}
            </a>
          </p>
        ) : null}

        {contact.notes ? <p>{contact.notes}</p> : null}

        <div>
          <Form action="edit">
            <button type="submit">Edit</button>
          </Form>

          <Form
            action="destroy"
            method="post"
            onSubmit={(event) => {
              const response = confirm(
                "Please confirm you want to delete this record."
              );
              if (!response) {
                event.preventDefault();
              }
            }}
          >
            <button type="submit">Delete</button>
          </Form>
        </div>
      </div>
    </div>
  );
}

const Favorite: FunctionComponent<{
  contact: Pick<ContactRecord, "favorite">;
}> = ({ contact }) => {
  const favorite = contact.favorite;

  return (
    <Form method="post">
      <button
        aria-label={
          favorite
            ? "Remove from favorites"
            : "Add to favorites"
        }
        name="favorite"
        value={favorite ? "false" : "true"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </Form>
  );
};
```

Now if we click one of the links or visit [`/contacts/1`][contacts-1] we get ... nothing new?

<!-- <img class="tutorial" loading="lazy" src="/_docs/v7_framework_tutorial/04.webp" /> -->

## Nested Routes and Outlets

React Router supports nested routing. In order for child routes to render inside of parent layouts, we need to render an [`Outlet`][outlet-component] in the parent. Let's fix it, open up `app/root.tsx` and render an outlet inside.

👉 **Render an [`<Outlet />`][outlet-component]**

```tsx filename=app/root.tsx lines=[6,18-20]
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

// existing imports & exports

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

## Client Side Routing

You may or may not have noticed, but when we click the links in the sidebar, the browser is doing a full document request for the next URL instead of client side routing.

Client side routing allows our app to update the URL without requesting another document from the server. Instead, the app can immediately render new UI. Let's make it happen with [`<Link>`][link-component].

👉 **Change the sidebar `<a href>` to `<Link to>`**

```tsx filename=app/root.tsx lines=[4,22,25]
// existing imports
import {
  Form,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

// existing imports & exports

export default function App() {
  return (
    <>
      <div id="sidebar">
        {/* other elements */}
        <nav>
          <ul>
            <li>
              <Link to={`/contacts/1`}>Your Name</Link>
            </li>
            <li>
              <Link to={`/contacts/2`}>Your Friend</Link>
            </li>
          </ul>
        </nav>
      </div>
      {/* other elements */}
    </>
  );
}
```

You can open the network tab in the browser devtools to see that it's not requesting documents anymore.

## Loading Data

URL segments, layouts, and data are more often than not coupled (tripled?) together. We can see it in this app already:

| URL Segment         | Component   | Data               |
| ------------------- | ----------- | ------------------ |
| /                   | `<App>`     | list of contacts   |
| contacts/:contactId | `<Contact>` | individual contact |

Because of this natural coupling, React Router has data conventions to get data into your route components easily.

First we'll create and export a [`clientLoader`][client-loader] function in the root route and then render the data.

👉 **Export a `clientLoader` function from `app/root.tsx` and render the data**

<docs-info>The following code has a type error in it, we'll fix it in the next section</docs-info>

```tsx filename=app/root.tsx lines=[2,6-9,11-12,19-42]
// existing imports
import { getContacts } from "./data";

// existing exports

export async function clientLoader() {
  const contacts = await getContacts();
  return { contacts };
}

export default function App({ loaderData }) {
  const { contacts } = loaderData;

  return (
    <>
      <div id="sidebar">
        {/* other elements */}
        <nav>
          {contacts.length ? (
            <ul>
              {contacts.map((contact) => (
                <li key={contact.id}>
                  <Link to={`contacts/${contact.id}`}>
                    {contact.first || contact.last ? (
                      <>
                        {contact.first} {contact.last}
                      </>
                    ) : (
                      <i>No Name</i>
                    )}{" "}
                    {contact.favorite ? (
                      <span>★</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              <i>No contacts</i>
            </p>
          )}
        </nav>
      </div>
      {/* other elements */}
    </>
  );
}
```

That's it! React Router will now automatically keep that data in sync with your UI. The sidebar should now look like this:

<!-- <img class="tutorial" loading="lazy" src="/_docs/v7_framework_tutorial/06.webp" /> -->

You may be wondering why we're "client" loading data instead of loading the data on the server so we can do server-side rendering (SSR). Right now our contacts site is a [Single Page App][spa], so there's no server-side rendering. This makes it really easy to deploy to any static hosting provider, but we'll talk more about how to enable SSR later if you want to take advantage of deploying to a server.

## Type Safety

You probably noticed that we didn't assign a type to the `loaderData` prop. Let's fix that.

👉 **Add the `ComponentProps` type to the `App` component**

```tsx filename=app/root.tsx lines=[5-7]
// existing imports
import type { Route } from "./+types/root";
// existing imports & exports

export default function App({
  loaderData,
}: Route.ComponentProps) {
  const { contacts } = loaderData;

  // existing code
}
```

Wait, what? Where did these types come from?!

We didn't define them, yet somehow they already know about the `contacts` property we returned from our `clientLoader`.

That's because React Router [generates types for each route in your app][type-safety] to provide automatic type safety.

## Adding a `HydrateFallback`

We mentioned earlier that we are working on a [Single Page App][spa] with no server-side rendering. If you look inside of [`react-router.config.ts`][react-router-config] you'll see that this is configured with a simple boolean:

```tsx filename=react-router.config.ts lines=[4]
import { type Config } from "@react-router/dev/config";

export default {
  ssr: false,
} satisfies Config;
```

We'll explore more [rendering strategies][rendering-strategies] later, but a simple SPA is good enough for now.

However, you might have started noticing that whenever your refresh the page you get a flash of white before the app loads.

👉 **Add a `HydrateFallback` export**

We can provide a fallback that will show up while the app is hydrated (rendering on the client for the first time) with a [`HydrateFallback`][hydrate-fallback] export.

```tsx filename=app/root.tsx lines=[3-10]
// existing imports & exports

export function HydrateFallback() {
  return (
    <div id="loading-splash">
      <div></div>
      <p>Loading, please wait...</p>
    </div>
  );
}
```

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
[file-route-conventions]: ../how-to/file-route-conventions
[contacts-1]: http://localhost:5173/contacts/1
[link-component]: https://api.reactrouter.com/v7/functions/react_router.Link
[client-loader]: ../start/framework/route-module#clientloader
[spa]: ../how-to/spa
[type-safety]: ../explanation/type-safety
[react-router-config]: ../explanation/special-files#react-routerconfigts
[rendering-strategies]: ../start/framework/rendering
[hydrate-fallback]: ../start/framework/route-module#hydratefallback
[react-router-apis]: https://api.reactrouter.com/v7/modules/react_router
