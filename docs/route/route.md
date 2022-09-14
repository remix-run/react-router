---
title: Route
new: true
order: 1
---

# `Route`

Routes are perhaps the most important part of a React Router app. They couple URL segments to components, data loading and data mutations. Through route nesting, complex application layouts and data dependencies become simple and declarative.

Routes are objects passed to the router creation functions:

```jsx
const router = createBrowserRouter([
  {
    // it renders this element
    element: <Team />,

    // when the URL matches this segment
    path: "teams/:teamId",

    // with this data loaded before rendering
    loader: async ({ request, params }) => {
      return fetch(
        `/fake/api/teams/${params.teamId}.json`,
        { signal: request.signal }
      );
    },

    // performing this mutation when data is submitted to it
    action: async ({ request }) => {
      return updateFakeTeam(await request.formData());
    },

    // and renders this element in case something went wrong
    errorElement: <ErrorBoundary />,
  },
]);
```

You can also declare your routes with JSX and [`createRoutesFromElements`][createroutesfromelements], the props to the element are identical to the properties of the route objects:

```jsx
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={<Team />}
      path="teams/:teamId"
      loader={async ({ params }) => {
        return fetch(
          `/fake/api/teams/${params.teamId}.json`
        );
      }}
      action={async ({ request }) => {
        return updateFakeTeam(await request.formData());
      }}
      errorElement={<ErrorBoundary />}
    />
  )
);
```

Neither style is discouraged and behavior is identical. For the majority of this doc we will use the JSX style because that's what most people are accustomed to in the context of React Router.

## Type declaration

```tsx
interface RouteObject {
  path?: string;
  index?: boolean;
  children?: React.ReactNode;
  caseSensitive?: boolean;
  id?: string;
  loader?: LoaderFunction;
  action?: ActionFunction;
  element?: React.ReactNode | null;
  errorElement?: React.ReactNode | null;
  handle?: RouteObject["handle"];
  shouldRevalidate?: ShouldRevalidateFunction;
}
```

## `path`

The path pattern to match against the URL to determine if this route matches a URL, link href, or form action.

### Dynamic Segments

If a path segment starts with `:` then it becomes a "dynamic segment". When the route matches the URL, the dynamic segment will be parsed from the URL and provided as `params` to other router APIs.

```tsx
<Route
  // this path will match URLs like
  // - /teams/hotspur
  // - /teams/real
  path="/teams/:teamId"
  // the matching param will be available to the loader
  loader={({ params }) => {
    console.log(params.teamId); // "hotspur"
  }}
  // and the action
  action={({ params }) => {}}
  element={<Team />}
/>;

// and the element through `useParams`
function Team() {
  let params = useParams();
  console.log(params.teamId); // "hotspur"
}
```

You can have multiple dynamic segments in one route path:

```tsx
<Route path="/c/:categoryId/p/:productId" />;
// both will be available
params.categoryId;
params.productId;
```

Dynamic segments cannot be "partial":

- 🚫 `"/teams-:teamId"`
- ✅ `"/teams/:teamId"`
- 🚫 `"/:category--:productId"`
- ✅ `"/:productSlug"`

You can still support URL patterns like that, you just have to do a bit of your own parsing:

```tsx
function Product() {
  const { productSlug } = useParams();
  const [category, product] = productSlug.split("--");
  // ...
}
```

### Splats

Also known as "catchall" and "star" segments. If a route path pattern ends with `/*` then it will match any characters following the `/`, including other `/` characters.

```tsx
<Route
  // this path will match URLs like
  // - /files
  // - /files/one
  // - /files/one/two
  // - /files/one/two/three
  path="/files/*"
  // the matching param will be available to the loader
  loader={({ params }) => {
    console.log(params["*"]); // "one/two"
  }}
  // and the action
  action={({ params }) => {}}
  element={<Team />}
/>;

// and the element through `useParams`
function Team() {
  let params = useParams();
  console.log(params["*"]); // "one/two"
}
```

You can destructure the `*`, you just have to assign it a new name. A common name is `splat`:

```tsx
let { org, "*": splat } = params;
```

### Layout Routes

<docs-info>TODO: expand with example</docs-info>

Omitting the path makes this route a "layout route". It participates in UI nesting, but it does not add any segments to the URL.

## `index`

Determines if the route is an index route. Index routes render into their parent's [Outlet][outlet] at their parent's URL (like a default child route).

```jsx [2]
<Route path="/teams" element={<Teams />}>
  <Route index element={<TeamsIndex />} />
  <Route path=":teamId" element={<Team />} />
</Route>
```

These special routes can be confusing to understand at first, so we have a guide dedicated to them here: [Index Route][indexroute].

## `children`

<docs-warning>(TODO: need to talk about nesting, maybe even a separate doc)</docs-warning>

## `caseSensitive`

Instructs the route to match case or not:

```jsx
<Route caseSensitive path="/wEll-aCtuA11y" />
```

- Will match `"wEll-aCtuA11y"`
- Will not match `"well-actua11y"`

## `loader`

The route loader is called before the route renders and provides data for the element through [`useLoaderData`][useloaderdata].

```tsx [3-5]
<Route
  path="/teams/:teamId"
  loader={({ params }) => {
    return fetchTeam(params.teamId);
  }}
/>;

function Team() {
  let team = useLoaderData();
  // ...
}
```

<docs-warning>If you are not using a data router like [`createBrowserRouter`][createbrowserrouter], this will do nothing</docs-warning>

Please see the [loader][loader] documentation for more details.

## `action`

The route action is called when a submission is sent to the route from a [Form][form], [fetcher][fetcher], or [submission][usesubmit].

```tsx [3-5]
<Route
  path="/teams/:teamId"
  action={({ request }) => {
    const formData = await request.formData();
    return updateTeam(formData);
  }}
/>
```

<docs-warning>If you are not using a data router like [`createBrowserRouter`][createbrowserrouter], this will do nothing</docs-warning>

Please see the [action][action] documentation for more details.

## `element`

The element to render when the route matches the URL.

```tsx
<Route path="/for-sale" element={<Properties />} />
```

## `errorElement`

When a route throws an exception while rendering, in a `loader` or in an `action`, this element will render instead of the normal `element`.

```tsx
<Route
  path="/for-sale"
  // if this throws an error while rendering
  element={<Properties />}
  // or this while loading properties
  loader={() => loadProperties()}
  // or this while creating a property
  action={async ({ request }) =>
    createProperty(await request.formData())
  }
  // then this element will render
  errorElement={<ErrorBoundary />}
/>
```

<docs-warning>If you are not using a data router like [`createBrowserRouter`][createbrowserrouter], this will do nothing</docs-warning>

Please see the [errorElement][errorelement] documentation for more details.

[outlet]: ./outlet
[remix]: https://remix.run
[indexroute]: ../guides/index-route
[outlet]: ../components/outlet
[useloaderdata]: ../hooks/use-loader-data
[loader]: ./loader
[action]: ./action
[errorelement]: ./error-element
[form]: ../components/form
[fetcher]: ../hooks/use-fetcher
[usesubmit]: ../hooks/use-submit
[createroutesfromelements]: ../utils/create-routes-from-elements
[createbrowserrouter]: ../routers/create-browser-router
