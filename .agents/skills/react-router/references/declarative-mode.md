# Declarative Mode

Declarative Mode is React Router's simplest mode. It uses router components like `<BrowserRouter>` and JSX routes with `<Routes>`/`<Route>`. It does not provide loaders, actions, fetchers, or data-router pending UI.

Use this reference after the main skill identifies a Declarative Mode app.

## Read the Local Docs by Mode

Start with:

```txt
react-router/docs/start/modes.md
react-router/docs/start/declarative/index.md
```

Then use the Declarative docs under:

```txt
react-router/docs/start/declarative/
```

Those files cover installation, routing, navigation, and URL values. For conceptual details, read relevant files in:

```txt
react-router/docs/explanation/
```

Always check the `[MODES: declarative, ...]` marker in a doc before applying it.

## Declarative Router Shape

Typical setup:

```tsx
import { BrowserRouter, Routes, Route } from "react-router";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

Look for APIs such as:

- `<BrowserRouter>`
- `<HashRouter>`
- `<MemoryRouter>`
- `<Routes>`
- `<Route>`
- `element={<Component />}`
- `useRoutes`

## Routing

Before editing routes, read:

```txt
react-router/docs/start/declarative/routing.md
```

Rules:

- Use `<Routes>` and `<Route>` for route configuration.
- Use nested routes with `<Outlet>` for shared layout.
- Use index routes for default child UI.
- Use route params and splats according to the declarative routing docs.
- Do not add route object loaders/actions to a Declarative router.

## Navigation

Before changing navigation, read:

```txt
react-router/docs/start/declarative/navigating.md
```

Rules:

- Use `<Link>` or `<NavLink>` for user-initiated internal navigation.
- Use `NavLink` when active styling matters.
- Use `useNavigate` for imperative navigation from event handlers or effects.
- Do not use plain `<a href>` for internal navigation unless intentionally forcing a full document navigation.

## URL Values

Before changing params, search params, or location state, read:

```txt
react-router/docs/start/declarative/url-values.md
react-router/docs/explanation/location.md
```

Rules:

- Use `useParams` for dynamic route params.
- Use `useSearchParams` for query string state.
- Use `useLocation` for the current location object and navigation state.
- Validate and parse URL params; they are strings and can be absent.
- Preserve unrelated search params unless intentionally resetting them.

## Mode Boundary

Declarative Mode does not have Data/Framework APIs such as:

- `loader`
- `action`
- `<Form>`
- `useFetcher`
- `useNavigation`
- route module exports
- generated `./+types` route types

If the user asks for route data loading, DB/API-backed data, CRUD, form mutations, validation returned from submissions, revalidation, pending UI, optimistic UI, or fetchers, recommend Data Mode or Framework Mode depending on how much structure they want. Ask before migrating unless they already requested it.
