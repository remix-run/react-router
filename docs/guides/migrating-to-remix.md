---
title: Migrating to Remix
hidden: true
---

# Migrating to Remix

<docs-info>This doc is a stub</docs-info>

With an entry like this:

```tsx filename=app.js
import { DataBrowserRouter, Route } from "react-router-dom";
import Teams, {
  loader as teamLoader,
} from "./routes/teams";

ReactDOM.render(
  <DataBrowserRouter>
    <Route
      element={<Teams />}
      path="/teams"
      loader={teamsLoader}
    />
  </DataBrowserRouter>,
  root
);
```

And routes modules that look like this, where loaders return responses:

```tsx filename=routes/teams.jsx
import { json } from "react-router-dom";

export function loader() {
  const teams = await someIsomorphicDatabase
    .from("teams")
    .select("*");
  return json(teams);
}

export default function Teams() {
  const data = useLoaderData();
  // ...
}
```

You can quite literally copy/paste them into a Remix app.
