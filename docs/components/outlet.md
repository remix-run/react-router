---
title: Outlet
---

# `<Outlet>`

<details>
  <summary>Déclaration de type</summary>

```tsx
interface OutletProps {
  context?: unknown;
}
declare function Outlet(
  props: OutletProps
): React.ReactElement | null;
```

</details>



Un `<Outlet>` est fait pour être utilisé dans les routes parentes afin d'afficher leurs routes filles. This allows nested UI to show up when child routes are rendered. If the parent route matched exactly, it will render a child index route or nothing if there is no index route.

```tsx
function Dashboard() {
  return (
    <div>
      <h1>Tableau de bord</h1>

      {/* Cet élément affiche tour à tour <DashboardMessages> quand l'URL est
          "/messages", <DashboardTasks> sur "/tasks", ou null sur "/"
      */}
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route
          path="messages"
          element={<DashboardMessages />}
        />
        <Route path="tasks" element={<DashboardTasks />} />
      </Route>
    </Routes>
  );
}
```
