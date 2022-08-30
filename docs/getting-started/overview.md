---
title: Feature Overview
order: 1
---

# Feature Overview

<docs-info>This doc is a WIP</docs-info>

## Client Side Routing

React Router enables "client side routing".

In traditional websites, the browser requests a document from a web server, downloads and evaluates CSS and JavaScript assets, and renders the HTML sent from the server. When the user clicks a link, it starts the process all over again for a new page.

Client side routing allows your app to update the URL from a link click without making another request for another document from the server. Instead, your app can immediately render some new UI and make data requests with `fetch` to update the page with new information.

This enables faster user experiences because the browser doesn't need to request an entirely new document or re-evaluate CSS and JavaScript assets for the next page. It also enables more dynamic user experiences with things like animation.

Client side routing is enabled by rendering a `Router` and linking/submitting to pages with `Link` and `<Form>`:

```jsx [10,16]
import React from "react";
import { createRoot } from "react-dom/client";
import {
  DataBrowserRouter,
  Route,
  Link,
} from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <DataBrowserRouter>
    <Route
      path="/"
      element={
        <div>
          <h1>Hello World</h1>
          <Link to="about">About Us</Link>
        </div>
      }
    />
    <Route path="/about" element={<div>About</div>} />
  </DataBrowserRouter>
);
```

## Nested Routes

Nested Routing is the general idea of coupling segments of the URL to component hierarchy and data. React Router's nested routes were inspired by the routing system in Ember.js circa 2014. The Ember team realized that in nearly every case, segments of the URL determine:

- The layouts to render on the page
- The code split JavaScript bundles to load
- The data dependencies of those layouts

React Router embraces this convention with APIs for creating nested layouts coupled to URL segments and data.

```jsx
<DataBrowserRouter>
  <Route path="/" element={<Root />}>
    <Route path="contact" element={<Contact />} />
    <Route
      path="dashboard"
      element={<Dashboard />}
      loader={() => fetch("/api/dashboard.json")}
    />
    <Route element={<AuthLayout />}>
      <Route
        path="login"
        element={<Login />}
        loader={redirectIfUser}
      />
      <Route path="logout" />
    </Route>
  </Route>
</DataBrowserRouter>
```

This [visualization](https://remix.run/_docs/routing) might be helpful.

## Dynamic Segments

Segments of the URL can be dynamic placeholders that are parsed and provided to various apis.

```jsx
<Route path="projects/:projectId/tasks/:taskId" />
```

The two segments with `:` are dynamic, and provided to the following APIs:

```jsx
// If the current location is /projects/abc/tasks/3
<Route
  // sent to loaders
  loader={({ params }) => {
    params.projectId; // abc
    params.taskId; // 3
  }}
  // and actions
  action={({ params }) => {
    params.projectId; // abc
    params.taskId; // 3
  }}
  element={<Task />}
/>;

function Task() {
  // returned from `useParams`
  const params = useParams();
  params.projectId; // abc
  params.taskId; // 3
}

function Random() {
  const match = useMatch("/projects/:projectId/tasks/3");
  match.params.projectId; // abc
  match.params.taskId; // 3
}
```

See:

- [`<Route path>`][path]
- [`<Route loader>`][loader]
- [`<Route action>`][action]
- [`useParams`][useparams]
- [`useMatch`][usematch]

## Ranked Route Matching

When matching URLs to routes, React Router will rank the routes according the number of segments, static segments, dynamic segments, splats, etc. and pick the _most specific_ match.

For example, consider these two routes:

```jsx
<Route path="/teams/:teamId" />
<Route path="/teams/new" />
```

Now consider the URL is http://example.com/teams/new.

Even though both routes technically match the URL (`new` could be the `:teamId`), you intuitively know that we want the second route (`/teams/new`) to be picked. React Router's matching algorithm knows that, too.

With ranked routes, you don't have to worry about route ordering.

## Active Links

Most web apps have persistent navigation sections at the top of the UI, the sidebar, and often multiple levels. Styling the active navigation items so the user knows where they are (`isActive`) or where they're going (`isPending`) in the app is done easily with `<NavLink>`.

```jsx
<NavLink
  style={({ isActive, isPending }) => {
    return {
      color: isActive ? "red" : "inherit",
    };
  }}
  className={({ isActive, isPending }) => {
    return isActive ? "active" : isPending ? "pending" : "";
  }}
/>
```

You can also [`useMatch`][usematch] for any other "active" indication outside of links.

```jsx
function SomeComp() {
  const match = useMatch("/messages");
  return <li className={Boolean(match) ? "active" : ""} />;
}
```

See:

- [`NavLink`][navlink]
- [`useMatch`][usematch]

## Relative Links

Like HTML `<a href>`, `<Link to>` and `<NavLink to>` can take relative paths, with enhanced behavior with nested routes.

Given the following route config:

```jsx
<Route path="home" element={<Home />}>
  <Route path="project/:projectId" element={<Project />}>
    <Route path=":taskId" element={<Task />} />
  </Route>
</Route>
```

Consider the url https://example.com/home/project/123, which renders the following route component hierarchy:

```jsx
<Home>
  <Project />
</Home>
```

If `<Project />` renders the following links, the hrefs of the links will resolve like so:

| In `<Project>` @ `/home/project/123` | Resolved `<a href>`      |
| ------------------------------------ | ------------------------ |
| `<Link to="abc">`                    | `/home/projects/123/abc` |
| `<Link to=".">`                      | `/home/projects/123`     |
| `<Link to="..">`                     | `/home`                  |
| `<Link to=".." relative="path">`     | `/home/projects`         |

Note that the first `..` removes both segments of the `project/:projectId` route. By default, the `..` in relative links traverse the route hierarchy, not the URL segments. Adding `relative="path"` in the next example allows you to traverse the path segments instead.

Relative links are always relative to the route path they are _rendered in_, not to the full URL. That means if the user navigates deeper with `<Link to="abc">` to `<Task />` at the URL `/home/projects/123/abc`, the hrefs in `<Project>` will not change (contrary to plain `<a href>`, a common problem with client side routers).

## Data Loading

Because URL segments usually map to your app's persistent data, React Router provides conventional data loading hooks to initiate data loading during a navigation. Combined with nested routes, all of the data for multiple layouts at a specific URL can be loaded in parallel.

```jsx
<Route
  path="/"
  loader={async () => {
    // loaders can be async functions
    const res = await fetch("/api/user.json");
    const user = await res.json();
    return user;
  }}
  element={<Root />}
>
  <Route
    path=":teamId"
    // loaders understand Fetch Responses and will automatically
    // unwrap the res.json(), so you can simply return a fetch
    loader={({ params }) => {
      return fetch(`/api/teams/${params.teamId}`);
    }}
    element={<Team />}
  >
    <Route
      path=":gameId"
      loader={({ params }) => {
        // of course you can use any data store
        return fakeSdk.getTeam(params.gameId);
      }}
      element={<Game />}
    />
  </Route>
</Route>
```

Data is made available to your components through `useLoaderData`.

```jsx
function Root() {
  const user = useLoaderData();
  // data from <Route path="/">
}

function Team() {
  const team = useLoaderData();
  // data from <Route path=":teamId">
}

function Game() {
  const game = useLoaderData();
  // data from <Route path=":gameId">
}
```

When the user visits or clicks links to https://example.com/real-salt-lake/45face3, all three route loaders will be called and loaded in parallel, before the UI for that URL renders.

## Redirects

While loading or changing data, it's common to [redirect][redirect] the user to a different route.

```jsx
<Route
  path="dashboard"
  loader={async () => {
    const user = await fake.getUser();
    if (!user) {
      // if you know you can't render the route, you can
      // throw a redirect to stop executing code here,
      // sending the user to a new route
      throw redirect("/login");
    }

    // otherwise continue
    const stats = await fake.getDashboardStats();
    return { user, stats };
  }}
/>
```

```jsx
<Route
  path="project/new"
  action={async ({ request }) => {
    const data = await request.formData();
    const newProject = await createProject(data);
    // it's common to redirect after actions complete,
    // sending the user to the new record
    return redirect(`/projects/${newProject.id}`);
  }}
/>
```

See:

- [`redirect`][redirect]
- [Throwing in Loaders][throwing]
- [`useNavigate`][usenavigate]

## Pending Navigation UI

When users navigate around the app, the data for the next page is loaded before the page is rendered. It's important to provide user feedback during this time so the app doesn't feel like it's unresponsive.

```jsx lines=[2,5]
function Root() {
  const navigation = useNavigation();
  return (
    <div>
      {navigation.state === "loading" && <GlobalSpinner />}
      <FakeSidebar />
      <Outlet />
      <FakeFooter />
    </div>
  );
}
```

See:

- [`useNavigation`][usenavigation]

## Skeleton UI with `<Suspense>`

Instead of waiting for the data for the next page, you can [`defer`][defer] data so the UI flips over to the next screen with placeholder UI immediately while the data loads.

```jsx lines=[12,23-30,32-37,43]
<Route
  path="issue/:issueId"
  element={<Issue />}
  loader={async ({ params }) => {
    // these are promises, but *not* awaited
    const comments = fake.getIssueComments(params.issueId);
    const history = fake.getIssueHistory(params.issueId);
    // the issue, however, *is* awaited
    const issue = await fake.getIssue(params.issueId);

    // defer enables suspense for the un-awaited promises
    return defer({ issue, comments, history });
  }}
  element={<Issue />}
/>;

function Issue() {
  const { issue, history, comments } = useLoaderData();
  return (
    <div>
      <IssueDescription issue={issue} />

      {/* Suspense provides the placeholder fallback */}
      <Suspense fallback={<IssueHistorySkeleton />}>
        {/* Await manages the deferred data (promise) */}
        <Await resolve={history}>
          {/* this calls back when the data is resolved */}
          {(history) => <IssueHistory history={history} />}
        </Await>
      </Suspense>

      <Suspense fallback={<IssueCommentsSkeleton />}>
        <Await resolve={comments}>
          {/* ... or you can use hooks to access the data */}
          <IssueComments />
        </Await>
      </Suspense>
    </div>
  );
}

function IssueComments() {
  const comments = useAsyncValue();
  return <div>{/* ... */}</div>;
}
```

See

- [Deferred Data Guide][deferreddata]
- [`defer`][defer]
- [`Await`][await]
- [`useAsyncValue`][useasyncvalue]

## Data Mutations

HTML forms are navigation events, just like links. React Router supports HTML form workflows with client side routing.

When a form is submitted, the normal browser navigation event is prevented and a [`Request`][request], with a body containing the [`FormData`][formdata] of the submission, is created. This request is sent to the `<Route action>` that matches the form's `<Form action>`.

Form elements's `name` prop are submitted to the action:

```jsx
<Form action="/project/new">
  <label>
    Project title
    <br />
    <input type="text" name="title" />
  </label>

  <label>
    Target Finish Date
    <br />
    <input type="date" name="due" />
  </label>
</Form>
```

The normal HTML document request is prevented and sent to the matching route's action (`<Route path>` that matches the `<form action>`), including the `request.formData`.

```jsx
<Route
  path="project/new"
  action={async ({ request }) => {
    const formData = await request.formData();
    const newProject = await createProject({
      title: formData.get("title"),
      due: formData.get("due"),
    });
    return redirect(`/projects/${newProject.id}`);
  }}
/>
```

## Data Revalidation

Decades old web conventions indicate that when a form is posted to the server, data is changing and a new page is rendered. That convention is followed in React Router's HTML-based data mutation APIs.

After route actions are called, the loaders for all of the data on the page is called again to ensure the UI stays up-to-date with the data automatically. No cache keys to expire, no context providers to reload.

See:

- [Tutorial "Creating Contacts"][creatingcontacts]

## Busy Indicators

When forms are being submitted to route actions, you have access to the navigation state to display busy indicators, disable fieldsets, etc.

```jsx lines=[2,3,6,19-21]
function NewProjectForm() {
  const navigation = useNavigation();
  const busy = navigation.state === "submitting";
  return (
    <Form action="/project/new">
      <fieldset disabled={busy}>
        <label>
          Project title
          <br />
          <input type="text" name="title" />
        </label>

        <label>
          Target Finish Date
          <br />
          <input type="date" name="due" />
        </label>
      </fieldset>
      <button type="submit" disabled={busy}>
        {busy ? "Creating..." : "Create"}
      </button>
    </Form>
  );
}
```

See:

- [`useNavigation`][usenavigation]

## Optimistic UI

## Data Fetchers

## Race Condition Handling

## Error Handling

## Scroll Restoration

## Web Standard APIs

## Search Params

## Location State

[path]: ../route/route#path
[loader]: ../route/loader
[action]: ../route/action
[useparams]: ../hooks/use-params
[usematch]: ../hooks/use-match
[navlink]: ../components/nav-link
[redirect]: ../fetch/redirect
[throwing]: ../route/loader#throwing-in-loaders
[usenavigate]: ../hooks/use-navigate
[useparams]: ../hooks/use-params
[usematch]: ../hooks/use-match
[defer]: ../utils/defer
[await]: ../components/await
[useasyncvalue]: ../hooks/use-async-value
[deferreddata]: ../guides/deferred
[usenavigation]: ../hooks/use-navigation
[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[formdata]: https://developer.mozilla.org/en-US/docs/Web/API/FormData
[creatingcontacts]: ../getting-started/tutorial#creating-contacts
