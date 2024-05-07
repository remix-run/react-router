---
title: Form
new: true
---

# `<Form>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function Form(props: FormProps): React.ReactElement;

interface FormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  method?: "get" | "post" | "put" | "patch" | "delete";
  encType?:
    | "application/x-www-form-urlencoded"
    | "multipart/form-data"
    | "text/plain";
  action?: string;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  fetcherKey?: string;
  navigate?: boolean;
  preventScrollReset?: boolean;
  relative?: "route" | "path";
  reloadDocument?: boolean;
  replace?: boolean;
  state?: any;
  unstable_viewTransition?: boolean;
}
```

</details>

The Form component is a wrapper around a plain HTML [form][htmlform] that emulates the browser for client side routing and data mutations. It is _not_ a form validation/state management library like you might be used to in the React ecosystem (for that, we recommend the browser's built in [HTML Form Validation][formvalidation] and data validation on your backend server).

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

```tsx
import { Form } from "react-router-dom";

function NewEvent() {
  return (
    <Form method="post" action="/events">
      <input type="text" name="title" />
      <input type="text" name="description" />
      <button type="submit">Create</button>
    </Form>
  );
}
```

<docs-info>Make sure your inputs have names or else the `FormData` will not include that field's value.</docs-info>

All of this will trigger state updates to any rendered [`useNavigation`][usenavigation] hooks so you can build pending indicators and optimistic UI while the async operations are in-flight.

If the form doesn't _feel_ like navigation, you probably want [`useFetcher`][usefetcher].

## `action`

The url to which the form will be submitted, just like [HTML form action][htmlformaction]. The only difference is the default action. With HTML forms, it defaults to the full URL. With `<Form>`, it defaults to the relative URL of the closest route in context.

Consider the following routes and components:

```jsx
function ProjectsLayout() {
  return (
    <>
      <Form method="post" />
      <Outlet />
    </>
  );
}

function ProjectsPage() {
  return <Form method="post" />;
}

<DataBrowserRouter>
  <Route
    path="/projects"
    element={<ProjectsLayout />}
    action={ProjectsLayout.action}
  >
    <Route
      path=":projectId"
      element={<ProjectsPage />}
      action={ProjectsPage.action}
    />
  </Route>
</DataBrowserRouter>;
```

If the current URL is `"/projects/123"`, the form inside the child
route, `ProjectsPage`, will have a default action as you might expect: `"/projects/123"`. In this case, where the route is the deepest matching route, both `<Form>` and plain HTML forms have the same result.

But the form inside of `ProjectsLayout` will point to `"/projects"`, not the full URL. In other words, it points to the matching segment of the URL for the route in which the form is rendered.

This helps with portability as well as co-location of forms and their action handlers when if you add some convention around your route modules.

If you need to post to a different route, then add an action prop:

```tsx
<Form action="/projects/new" method="post" />
```

**See also:**

- [Index Search Param][indexsearchparam] (index vs parent route disambiguation)

<docs-info>Please see the [Splat Paths][relativesplatpath] section on the `useResolvedPath` docs for a note on the behavior of the `future.v7_relativeSplatPath` future flag for relative `useNavigate()` behavior within splat routes</docs-info>

## `method`

This determines the [HTTP verb](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) to be used. The same as plain HTML [form method][htmlform-method], except it also supports "put", "patch", and "delete" in addition to "get" and "post". The default is "get".

### GET submissions

The default method is "get". Get submissions _will not call an action_. Get submissions are the same as a normal navigation (user clicks a link) except the user gets to supply the search params that go to the URL from the form.

```tsx
<Form method="get" action="/products">
  <input
    aria-label="search products"
    type="text"
    name="q"
  />
  <button type="submit">Search</button>
</Form>
```

Let's say the user types in "running shoes" and submits the form. React Router emulates the browser and will serialize the form into [URLSearchParams][urlsearchparams] and then navigate the user to `"/products?q=running+shoes"`. It's as if you rendered a `<Link to="/products?q=running+shoes">` as the developer, but instead you let the user supply the query string dynamically.

Your route loader can access these values most conveniently by creating a new [`URL`][url] from the `request.url` and then load the data.

```tsx
<Route
  path="/products"
  loader={async ({ request }) => {
    let url = new URL(request.url);
    let searchTerm = url.searchParams.get("q");
    return fakeSearchProducts(searchTerm);
  }}
/>
```

### Mutation Submissions

All other methods are "mutation submissions", meaning you intend to change something about your data with POST, PUT, PATCH, or DELETE. Note that plain HTML forms only support "post" and "get", we tend to stick to those two as well.

When the user submits the form, React Router will match the `action` to the app's routes and call the `<Route action>` with the serialized [`FormData`][formdata]. When the action completes, all of the loader data on the page will automatically revalidate to keep your UI in sync with your data.

The method will be available on [`request.method`][requestmethod] inside the route action that is called. You can use this to instruct your data abstractions about the intent of the submission.

```tsx
<Route
  path="/projects/:id"
  element={<Project />}
  loader={async ({ params }) => {
    return fakeLoadProject(params.id);
  }}
  action={async ({ request, params }) => {
    switch (request.method) {
      case "PUT": {
        let formData = await request.formData();
        let name = formData.get("projectName");
        return fakeUpdateProject(name);
      }
      case "DELETE": {
        return fakeDeleteProject(params.id);
      }
      default: {
        throw new Response("", { status: 405 });
      }
    }
  }}
/>;

function Project() {
  let project = useLoaderData();

  return (
    <>
      <Form method="put">
        <input
          type="text"
          name="projectName"
          defaultValue={project.name}
        />
        <button type="submit">Update Project</button>
      </Form>

      <Form method="delete">
        <button type="submit">Delete Project</button>
      </Form>
    </>
  );
}
```

As you can see, both forms submit to the same route but you can use the `request.method` to branch on what you intend to do. After the actions completes, the `loader` will be revalidated and the UI will automatically synchronize with the new data.

## `navigate`

You can tell the form to skip the navigation and use a [fetcher][usefetcher] internally by specifying `<Form navigate={false}>`. This is essentially a shorthand for `useFetcher()` + `<fetcher.Form>` where you don't care about the resulting data and only want to kick off a submission and access the pending state via [`useFetchers()`][usefetchers].

## `fetcherKey`

When using a non-navigating `Form`, you may also optionally specify your own fetcher key to use via `<Form navigate={false} fetcherKey="my-key">`.

## `replace`

Instructs the form to replace the current entry in the history stack, instead of pushing the new entry.

```tsx
<Form replace />
```

The default behavior is conditional on the form behavior:

- `method=get` forms default to `false`
- submission methods depend on the `formAction` and `action` behavior:
  - if your `action` throws, then it will default to `false`
  - if your `action` redirects to the current location, it defaults to `true`
  - if your `action` redirects elsewhere, it defaults to `false`
  - if your `formAction` is the current location, it defaults to `true`
  - otherwise it defaults to `false`

We've found with `get` you often want the user to be able to click "back" to see the previous search results/filters, etc. But with the other methods the default is `true` to avoid the "are you sure you want to resubmit the form?" prompt. Note that even if `replace={false}` React Router _will not_ resubmit the form when the back button is clicked and the method is post, put, patch, or delete.

In other words, this is really only useful for GET submissions and you want to avoid the back button showing the previous results.

## `relative`

By default, paths are relative to the route hierarchy, so `..` will go up one `Route` level. Occasionally, you may find that you have matching URL patterns that do not make sense to be nested, and you're prefer to use relative _path_ routing. You can opt into this behavior with `<Form to="../some/where" relative="path">`

## `reloadDocument`

Instructs the form to skip React Router and submit the form with the browser's built in behavior.

```tsx
<Form reloadDocument />
```

This is recommended over `<form>` so you can get the benefits of default and relative `action`, but otherwise is the same as a plain HTML form.

Without a framework like [Remix][remix], or your own server handling of posts to routes, this isn't very useful.

See also:

- [`useNavigation`][usenavigation]
- [`useActionData`][useactiondata]
- [`useSubmit`][usesubmit]

## `state`

The `state` property can be used to set a stateful value for the new location which is stored inside [history state][history-state]. This value can subsequently be accessed via `useLocation()`.

```tsx
<Form
  method="post"
  action="new-path"
  state={{ some: "value" }}
/>
```

You can access this state value while on the "new-path" route:

```ts
let { state } = useLocation();
```

## `preventScrollReset`

If you are using [`<ScrollRestoration>`][scrollrestoration], this lets you prevent the scroll position from being reset to the top of the window when the form action redirects to a new location.

```tsx
<Form method="post" preventScrollReset={true} />
```

See also: [`<Link preventScrollReset>`][link-preventscrollreset]

## `unstable_viewTransition`

The `unstable_viewTransition` prop enables a [View Transition][view-transitions] for this navigation by wrapping the final state update in `document.startViewTransition()`. If you need to apply specific styles for this view transition, you will also need to leverage the [`unstable_useViewTransitionState()`][use-view-transition-state].

<docs-warning>Please note that this API is marked unstable and may be subject to breaking changes without a major release</docs-warning>

# Examples

TODO: More examples

## Large List Filtering

A common use case for GET submissions is filtering a large list, like ecommerce and travel booking sites.

```tsx
function FilterForm() {
  return (
    <Form method="get" action="/slc/hotels">
      <select name="sort">
        <option value="price">Price</option>
        <option value="stars">Stars</option>
        <option value="distance">Distance</option>
      </select>

      <fieldset>
        <legend>Star Rating</legend>
        <label>
          <input type="radio" name="stars" value="5" />{" "}
          ★★★★★
        </label>
        <label>
          <input type="radio" name="stars" value="4" /> ★★★★
        </label>
        <label>
          <input type="radio" name="stars" value="3" /> ★★★
        </label>
        <label>
          <input type="radio" name="stars" value="2" /> ★★
        </label>
        <label>
          <input type="radio" name="stars" value="1" /> ★
        </label>
      </fieldset>

      <fieldset>
        <legend>Amenities</legend>
        <label>
          <input
            type="checkbox"
            name="amenities"
            value="pool"
          />{" "}
          Pool
        </label>
        <label>
          <input
            type="checkbox"
            name="amenities"
            value="exercise"
          />{" "}
          Exercise Room
        </label>
      </fieldset>
      <button type="submit">Search</button>
    </Form>
  );
}
```

When the user submits this form, the form will be serialized to the URL with something like this, depending on the user's selections:

```
/slc/hotels?sort=price&stars=4&amenities=pool&amenities=exercise
```

You can access those values from the `request.url`

```tsx
<Route
  path="/:city/hotels"
  loader={async ({ request }) => {
    let url = new URL(request.url);
    let sort = url.searchParams.get("sort");
    let stars = url.searchParams.get("stars");
    let amenities = url.searchParams.getAll("amenities");
    return fakeGetHotels({ sort, stars, amenities });
  }}
/>
```

**See also:**

- [useSubmit][usesubmit]

[usenavigation]: ../hooks/use-navigation
[useactiondata]: ../hooks/use-action-data
[formdata]: https://developer.mozilla.org/en-US/docs/Web/API/FormData
[usefetcher]: ../hooks/use-fetcher
[usefetchers]: ../hooks/use-fetchers
[htmlform]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form
[htmlformaction]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-action
[htmlform-method]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-method
[urlsearchparams]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
[url]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[usesubmit]: ../hooks/use-submit
[requestmethod]: https://developer.mozilla.org/en-US/docs/Web/API/Request/method
[remix]: https://remix.run
[formvalidation]: https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation
[indexsearchparam]: ../guides/index-search-param
[pickingarouter]: ../routers/picking-a-router
[scrollrestoration]: ./scroll-restoration
[link-preventscrollreset]: ./link#preventscrollreset
[history-state]: https://developer.mozilla.org/en-US/docs/Web/API/History/state
[use-view-transition-state]: ../hooks//use-view-transition-state
[view-transitions]: https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
[relativesplatpath]: ../hooks/use-resolved-path#splat-paths
