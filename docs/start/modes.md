---
title: Picking a Mode
order: 1
---

# Picking a Mode

React Router is a multi-strategy router for React. There are three primary ways, or "modes", to use it in your app. Across the docs you'll see these icons indicating which mode the content is relevant to:

[MODES: framework, data, declarative]

<p></p>

The features available in each mode are additive, so moving from Declarative to Data to Framework simply adds more features at the cost of architectural control. So pick your mode based on how much control or how much help you want from React Router.

The mode depends on which "top level" router API you're using:

**Declarative**

Declarative mode enables basic routing features like matching URLs to components, navigating around the app, and providing active states with APIs like `<Link>`, `useNavigate`, and `useLocation`.

```tsx
import { BrowserRouter } from "react-router";

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

**Data**

By moving route configuration outside of React rendering, Data Mode adds data loading, actions, pending states and more with APIs like `loader`, `action`, and `useFetcher`.

```tsx
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

let router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    loader: loadRootData,
  },
]);

ReactDOM.createRoot(root).render(
  <RouterProvider router={router} />
);
```

**Framework**

Framework Mode wraps Data Mode with a Vite plugin to add the full React Router experience with:

- typesafe `href`
- typesafe Route Module API
- intelligent code splitting
- SPA, SSR, and static rendering strategies
- and more

```ts filename=routes.ts
import { index, route } from "@react-router/dev/routes";

export default [
  index("./home.tsx"),
  route("products/:pid", "./product.tsx"),
];
```

You'll then have access to the Route Module API with typesafe params, loaderData, code splitting, SPA/SSR/SSG strategies, and more.

```ts filename=product.tsx
import { Route } from "+./types/product.tsx";

export async function loader({ params }: Route.LoaderArgs) {
  let product = await getProduct(params.pid);
  return { product };
}

export default function Product({
  loaderData,
}: Route.ComponentProps) {
  return <div>{loaderData.product.name}</div>;
}
```

## Decision Advice

Every mode supports any architecture and deployment target, so the question isn't really about if you want SSR, SPA, etc. It's about how much you want to do yourself.

**Use Framework Mode if you:**

- are too new to have an opinion
- are considering Next.js, Solid Start, SvelteKit, Astro, TanStack Start, etc. and want to compare
- just want to build something with React
- might want to server render, might not
- are coming from Remix (React Router v7 is the "next version" after Remix v2)
- are migrating from Next.js

[→ Get Started with Framework Mode](./framework/installation).

**Use Data Mode if you:**

- want data features but also want to have control over bundling, data, and server abstractions
- started a data router in v6.4 and are happy with it

[→ Get Started with Data Mode](./data/custom).

**Use Declarative Mode if you:**

- want to use React Router as simply as possible
- are coming from v6 and are happy with the `<BrowserRouter>`
- have a data layer that either skips pending states (like local first, background data replication/sync) or has its own abstractions for them
- are coming from Create React App (you may want to consider framework mode though)

[→ Get Started with Declarative Mode](./declarative/installation).

## API + Mode Availability Table

This is mostly for the LLMs, but knock yourself out:

| API                            | Framework | Data | Declarative |
| ------------------------------ | --------- | ---- | ----------- |
| Await                          | ✅        | ✅   |             |
| Form                           | ✅        | ✅   |
| Link                           | ✅        | ✅   | ✅          |
| `<Link discover>`              | ✅        |      |             |
| `<Link prefetch>`              | ✅        |      |             |
| `<Link preventScrollReset>`    | ✅        | ✅   |             |
| Links                          | ✅        |      |             |
| Meta                           | ✅        |      |             |
| NavLink                        | ✅        | ✅   | ✅          |
| `<NavLink discover>`           | ✅        |      |             |
| `<NavLink prefetch>`           | ✅        |      |             |
| `<NavLink preventScrollReset>` | ✅        | ✅   |             |
| NavLink `isPending`            | ✅        | ✅   |             |
| Navigate                       | ✅        | ✅   | ✅          |
| Outlet                         | ✅        | ✅   | ✅          |
| PrefetchPageLinks              | ✅        |      |             |
| Route                          | ✅        | ✅   | ✅          |
| Routes                         | ✅        | ✅   | ✅          |
| Scripts                        | ✅        |      |             |
| ScrollRestoration              | ✅        | ✅   |             |
| ServerRouter                   | ✅        |      |             |
| usePrompt                      | ✅        | ✅   | ✅          |
| useActionData                  | ✅        | ✅   |             |
| useAsyncError                  | ✅        | ✅   |             |
| useAsyncValue                  | ✅        | ✅   |             |
| useBeforeUnload                | ✅        | ✅   | ✅          |
| useBlocker                     | ✅        | ✅   | ✅          |
| useFetcher                     | ✅        | ✅   |             |
| useFetchers                    | ✅        | ✅   |             |
| useFormAction                  | ✅        | ✅   |             |
| useHref                        | ✅        | ✅   | ✅          |
| useInRouterContext             | ✅        | ✅   | ✅          |
| useLinkClickHandler            | ✅        | ✅   | ✅          |
| useLoaderData                  | ✅        | ✅   |             |
| useLocation                    | ✅        | ✅   | ✅          |
| useMatch                       | ✅        | ✅   | ✅          |
| useMatches                     | ✅        | ✅   |             |
| useNavigate                    | ✅        | ✅   | ✅          |
| useNavigation                  | ✅        | ✅   |             |
| useNavigationType              | ✅        | ✅   | ✅          |
| useOutlet                      | ✅        | ✅   | ✅          |
| useOutletContext               | ✅        | ✅   | ✅          |
| useParams                      | ✅        | ✅   | ✅          |
| useResolvedPath                | ✅        | ✅   | ✅          |
| useRevalidator                 | ✅        | ✅   |             |
| useRouteError                  | ✅        | ✅   |             |
| useRouteLoaderData             | ✅        | ✅   |             |
| useRoutes                      | ✅        | ✅   | ✅          |
| useSearchParams                | ✅        | ✅   | ✅          |
| useSubmit                      | ✅        | ✅   |             |
| useViewTransitionState         | ✅        | ✅   |             |
| isCookieFunction               | ✅        | ✅   |             |
| isSessionFunction              | ✅        | ✅   |             |
| createCookie                   | ✅        | ✅   |             |
| createCookieSessionStorage     | ✅        | ✅   |             |
| createMemorySessionStorage     | ✅        | ✅   |             |
| createPath                     | ✅        | ✅   | ✅          |
| createRoutesStub               | ✅        | ✅   |             |
| createSearchParams             | ✅        | ✅   | ✅          |
| data                           | ✅        | ✅   |             |
| generatePath                   | ✅        | ✅   | ✅          |
| href                           | ✅        |      |             |
| isCookie                       | ✅        | ✅   |             |
| isRouteErrorResponse           | ✅        | ✅   |             |
| isSession                      | ✅        | ✅   |             |
| matchPath                      | ✅        | ✅   | ✅          |
| matchRoutes                    | ✅        | ✅   | ✅          |
| parsePath                      | ✅        | ✅   | ✅          |
| redirect                       | ✅        | ✅   |             |
| redirectDocument               | ✅        | ✅   |             |
| renderMatches                  | ✅        | ✅   | ✅          |
| replace                        | ✅        | ✅   |             |
| resolvePath                    | ✅        | ✅   | ✅          |
