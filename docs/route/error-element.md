---
title: errorElement
new: true
---

# `errorElement`

When exceptions are thrown in [loaders][loader], [actions][action], or component rendering, instead of the normal render path for your Routes (`<Route element>`), the error path will be rendered (`<Route errorElement>`) and the error made available with [`useRouteError`][userouteerror].

<docs-info>If you do not wish to specify a React element (i.e., `errorElement={<MyErrorBoundary />}`) you may specify an `ErrorBoundary` component instead (i.e., `ErrorBoundary={MyErrorBoundary}`) and React Router will call `createElement` for you internally.</docs-info>

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

```tsx
<Route
  path="/invoices/:id"
  // if an exception is thrown here
  loader={loadInvoice}
  // here
  action={updateInvoice}
  // or here
  element={<Invoice />}
  // this will render instead of `element`
  errorElement={<ErrorBoundary />}
/>;

function Invoice() {
  return <div>Happy {path}</div>;
}

function ErrorBoundary() {
  let error = useRouteError();
  console.error(error);
  // Uncaught ReferenceError: path is not defined
  return <div>Dang!</div>;
}
```

## Bubbling

When a route does not have an `errorElement`, errors will bubble up through parent routes. This lets you get as granular or general as you like.

Put an `errorElement` at the top of your route tree and handle nearly every error in your app in one place. Or, put them on all of your routes and allow the parts of the app that don't have errors to continue to render normally. This gives the user more options to recover from errors instead of a hard refresh and 🤞.

### Default Error Element

<docs-warning>We recommend _always_ providing at least a root-level `errorElement` before shipping your application to production, because the UI of the default `errorElement` is ugly and not intended for end-user consumption.</docs-warning>

If you do not provide an `errorElement` in your route tree to handle a given error, errors will bubble up and be handled by a default `errorElement` which will print the error message and stack trace. Some folks have questioned why the stack trace shows up in production builds. Normally, you don't want to expose stack traces on your production sites for security reasons. However, this is more applicable to server-side errors (and Remix does indeed strip stack traces from server-side loader/action responses). In the case of client-side `react-router-dom` applications the code is already available in the browser anyway so any hiding is just security through obscurity. Furthermore, we would still want to expose the error in the console, so removing it from the UI display is still not hiding any information about the stack trace. Not showing it in the UI _and_ not logging it to the console would mean that application developers have no information _at all_ about production bugs, which poses its own set of issues. So, again we recommend you always add a root level `errorElement` before deploying your site to production!

## Throwing Manually

While `errorElement` handles unexpected errors, it can also be used to handle exceptions you expect.

Particularly in loaders and actions, where you work with external data not in your control, you can't always plan on the data existing, the service being available, or the user having access to it. In these cases you can `throw` your own exceptions.

Here's a "not found" case in a [loader][loader]:

```tsx [4,7-9]
<Route
  path="/properties/:id"
  element={<PropertyForSale />}
  errorElement={<PropertyError />}
  loader={async ({ params }) => {
    const res = await fetch(`/api/properties/${params.id}`);
    if (res.status === 404) {
      throw new Response("Not Found", { status: 404 });
    }
    const home = await res.json();
    const descriptionHtml = parseMarkdown(
      data.descriptionMarkdown
    );
    return { home, descriptionHtml };
  }}
/>
```

As soon as you know you can't render the route with the data you're loading, you can throw to break the call stack. You don't have to worry about the rest of the work in the loader (like parsing the user's markdown bio) when it doesn't exist. Just throw and get out of there.

This also means you don't have to worry about a bunch of error branching code in your route component. It won't even try to render if you throw in the loader or action, since your `errorElement` will render instead.

You can throw anything from a loader or action just like you can return anything: responses (like the previous example), errors, or plain objects.

## Throwing Responses

While you can throw anything and it will be provided back to you through [`useRouteError`][userouteerror], if you throw a [Response][response], React Router will automatically parse the response data before returning it to your components.

Additionally, [`isRouteErrorResponse`][isrouteerrorresponse] lets you check for this specific type in your boundaries. Coupled with [`json`][json], you can easily throw responses with some data and render different cases in your boundary:

```tsx
import { json } from "react-router-dom";

function loader() {
  const stillWorksHere = await userStillWorksHere();
  if (!stillWorksHere) {
    throw json(
      {
        sorry: "You have been fired.",
        hrEmail: "hr@bigco.com",
      },
      { status: 401 }
    );
  }
}

function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 401) {
    // the response json is automatically parsed to
    // `error.data`, you also have access to the status
    return (
      <div>
        <h1>{error.status}</h1>
        <h2>{error.data.sorry}</h2>
        <p>
          Go ahead and email {error.data.hrEmail} if you
          feel like this is a mistake.
        </p>
      </div>
    );
  }

  // rethrow to let the parent error boundary handle it
  // when it's not a special case for this route
  throw error;
}
```

This makes it possible to create a general error boundary, usually on your root route, that handles many cases:

```tsx
function RootBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <div>This page doesn't exist!</div>;
    }

    if (error.status === 401) {
      return <div>You aren't authorized to see this</div>;
    }

    if (error.status === 503) {
      return <div>Looks like our API is down</div>;
    }

    if (error.status === 418) {
      return <div>🫖</div>;
    }
  }

  return <div>Something went wrong</div>;
}
```

## Abstractions

This pattern of throwing when you know you can't continue down the data loading path you're on makes it pretty simple to properly handle exceptional situations.

Imagine a function that gets the user's web token for authorized requests looking something like this:

```tsx
async function getUserToken() {
  const token = await getTokenFromWebWorker();
  if (!token) {
    throw new Response("", { status: 401 });
  }
  return token;
}
```

No matter which loader or action uses that function, it will stop executing code in the current call stack and send the app over to the error path instead.

Now let's add a function that fetches a project:

```tsx
function fetchProject(id) {
  const token = await getUserToken();
  const response = await fetch(`/projects/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) {
    throw new Response("Not Found", { status: 404 });
  }

  // the fetch failed
  if (!response.ok) {
    throw new Error("Could not fetch project");
  }
}
```

Thanks to `getUserToken`, this code can assume it gets a token. If there isn't one, the error path will be rendered. Then if the project doesn't exist, no matter which loader is calling this function, it will throw a 404 over to the `errorElement`. Finally, if the fetch fails completely, it will send an error.

At any time you realize "I don't have what I need", you can simply `throw`, knowing that you're still rendering something useful for the end user.

Let's put it together into a route:

```tsx
<Route
  path="/"
  element={<Root />}
  errorElement={<RootBoundary />}
>
  <Route
    path="projects/:projectId"
    loader={({ params }) => fetchProject(params.projectId)}
    element={<Project />}
  />
</Route>
```

The project route doesn't have to think about errors at all. Between the loader utility functions like `fetchProject` and `getUserToken` throwing whenever something isn't right, and the `RootBoundary` handling all of the cases, the project route gets to focus strictly on the happy path.

[loader]: ./loader
[action]: ./action
[userouteerror]: ../hooks/use-route-error
[pickingarouter]: ../routers/picking-a-router
[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[isrouteerrorresponse]: ../utils/is-route-error-response
[json]: ../fetch/json
[createbrowserrouter]: ../routers/create-browser-router
