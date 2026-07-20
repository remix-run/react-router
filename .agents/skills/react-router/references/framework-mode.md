# Framework Mode

Framework Mode is React Router's full-stack mode. It uses the React Router Vite plugin, route config in `app/routes.ts`, route modules, generated route types, and rendering strategies such as SSR, SPA mode, and pre-rendering.

Use this reference after the main skill identifies a Framework Mode app.

## Read the Local Docs by Mode

Start with:

```txt
react-router/docs/start/modes.md
react-router/docs/start/framework/index.md
```

Then use the Framework docs under:

```txt
react-router/docs/start/framework/
```

Those files cover installation, routing, route modules, data loading, actions, navigation, pending UI, rendering, deploying, and testing. For task-specific details, read relevant files in:

```txt
react-router/docs/how-to/
react-router/docs/explanation/
```

Always check the `[MODES: framework, ...]` marker in a doc before applying it.

## Framework Shape

Examples usually assume the default `appDirectory` of `app`. Check `react-router.config.ts` before assuming exact paths.

Look for these files and conventions:

```txt
react-router.config.ts
app/root.tsx
app/routes.ts
app/routes/**/*.tsx
route modules importing from ./+types/...
```

Typical route module:

```tsx
import type { Route } from "./+types/product";

export async function loader({ params }: Route.LoaderArgs) {
  return { product: await getProduct(params.productId) };
}

export default function Product({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.product.name}</h1>;
}
```

## Route Configuration

Framework apps use `app/routes.ts`. Many apps use file-system routing via `flatRoutes()`, but manual route config is also supported.

Before editing routes, read:

```txt
react-router/docs/start/framework/routing.md
```

If the app uses file-route conventions, read:

```txt
react-router/docs/how-to/file-route-conventions.md
```

## Route Modules

Route modules are the main unit of Framework Mode. Before adding or changing route exports, read:

```txt
react-router/docs/start/framework/route-module.md
```

Common exports include:

| Export                            | Use                                                                 |
| --------------------------------- | ------------------------------------------------------------------- |
| `default`                         | Route component rendered for the match                              |
| `loader`                          | Server data loading for SSR/pre-rendering/server data requests      |
| `clientLoader`                    | Browser-only data loading or supplementing server loader data       |
| `action`                          | Server mutation called by `<Form>`, `useSubmit`, or fetchers        |
| `clientAction`                    | Browser-only mutation or client-side wrapper around a server action |
| `ErrorBoundary`                   | UI for errors thrown by this route's loaders/actions/component      |
| `HydrateFallback`                 | Initial fallback while client loader hydration runs                 |
| `links` / `meta`                  | Route document links and metadata                                   |
| `handle`                          | Arbitrary route metadata consumed via `useMatches`                  |
| `shouldRevalidate`                | Overrides default loader revalidation behavior                      |
| `middleware` / `clientMiddleware` | Server/client request pipeline hooks when enabled                   |

Use generated `Route.*` types from `./+types/<route>` for route module args and props.

## Layout and Root Route Rules

- `app/root.tsx` is the root route and should contain global document/app shell concerns.
- Put global providers, app-wide nav, app-wide footer, scripts/meta/links, and document structure in `root.tsx` when appropriate.
- Use nested routes/layout routes for section-specific layouts.
- Do not flatten routes that should share UI or data boundaries.

Useful docs:

```txt
react-router/docs/explanation/special-files.md
react-router/docs/start/framework/routing.md
```

## Data and Mutations

Before working on route data:

```txt
react-router/docs/start/framework/data-loading.md
react-router/docs/start/framework/actions.md
```

Framework rules:

- Load route data with `loader` or `clientLoader`.
- Mutate route data with `action` or `clientAction`.
- Prefer route loaders/actions over ad hoc `useEffect` fetching for route data.
- Use `data()`/Responses and redirects according to the docs.
- Let React Router revalidate after actions unless the docs point you to `shouldRevalidate`.
- In SSR/server data routes, keep Node-only/database code in server-only modules and call it from `loader`/`action`, not from browser-rendered component code.

Common patterns:

- Validation failure from an action: return `data({ errors, values }, { status: 400 })`, then render errors from `Route.ComponentProps["actionData"]` or `fetcher.data`.
- Missing record in a loader: throw `data("Not Found", { status: 404 })` and render the route `ErrorBoundary`.
- Search/filter data: parse the route request URL/search params in the loader so the URL is shareable and bookmarkable.

## Forms, Fetchers, and Pending UI

For forms and pending UI, read:

```txt
react-router/docs/start/framework/actions.md
react-router/docs/start/framework/pending-ui.md
react-router/docs/how-to/fetchers.md
react-router/docs/explanation/form-vs-fetcher.md
```

Rules of thumb:

- Search/filter form that updates the URL: `<Form method="get">`.
- Mutation that should change URL/history or redirect after completion: `<Form method="post">`.
- Mutation that should keep the user on the same page: `useFetcher` / `<fetcher.Form>`.
- Optimistic UI: derive from `fetcher.formData` or `navigation.formData`.

## Type Safety

Before changing generated route types or typed URL behavior, read:

```txt
react-router/docs/how-to/route-module-type-safety.md
react-router/docs/explanation/type-safety.md
```

Rules:

- Import types from `./+types/<route>`.
- Use `Route.LoaderArgs`, `Route.ActionArgs`, `Route.ComponentProps`, etc.
- Use type-only imports where appropriate.
- Do not edit generated `.react-router/types` files.

## Metadata

Before changing `meta`, read:

```txt
react-router/docs/how-to/meta.md
react-router/docs/start/framework/route-module.md
```

Important: `meta` receives `loaderData`; do not use deprecated `data` args.

## Rendering Strategy

Framework Mode can be SSR, SPA, pre-rendered, or mixed depending on config and route behavior. Before changing rendering behavior, read:

```txt
react-router/docs/start/framework/rendering.md
react-router/docs/how-to/spa.md
react-router/docs/how-to/pre-rendering.md
react-router/docs/explanation/hydration.md
```

## Middleware, Sessions, and Auth

Before implementing middleware or auth/session flows, read:

```txt
react-router/docs/how-to/middleware.md
react-router/docs/explanation/sessions-and-cookies.md
```

Middleware and context APIs are version/config sensitive. Check the installed React Router version and the app's `react-router.config.ts` before implementing.

## RSC Framework

If this Framework app uses `unstable_reactRouterRSC` or `@vitejs/plugin-rsc`, also read:

```txt
references/rsc.md
react-router/docs/how-to/react-server-components.md
```
