---
title: Picking a Router
order: 1
new: true
---

# Picking a Router

<form action="/foo">
  <input type="text"  formAction="/bar" />
</form>

<docs-warning>This doc is a work in progress</docs-warning>

React Router ships with several "routers" depending on the environment you're app is running in and the use cases you have. This document should help you figure out which one to use.

- We recommend using [DataBrowserRouter][databrowserrouter] for all web projects. It keeps your UI and data in sync with the URL.
- For server rendering your web app, you'll use [StaticRouter][staticrouter]
- For testing, you'll want to use [MemoryRouter][memoryrouter]
- For React Native apps, use [NativeRouter][nativerouter]

[databrowserrouter]: ./data-browser-router
[staticrouter]: ./static-router
[memoryrouter]: ./memory-router
[nativerouter]: ./native-router

```jsx
<Route
  path="/"
  errorElement={<FancyBoundaryDoesEverything />}
>
  <Route
    path="projects/:projectId"
    element={<Project />}
    errorElement={<OnlyKnows401s />}
    loader={() => {
      let project = getProject();
      if (!useHasAccess(project)) {
        throw { contactEmail };
      }
      return project;
    }}
  />
</Route>;

import { isErrorResponse } from "react-router-dom";

function OnlyKnows401s() {
  let error = useRouteError();

  if (!error.contactEmail) {
    throw error;
  }

  return <div>Contact {error.data.contactEmail}</div>;
}

// unwrapped response to make rendering boundaries easy
// don't want async react code/state/effects to unwrap .json()
class ErrorResponse {
  // constructor(@status, @statusText, @data) {}
}

function isRouteErrorResponse(thing) {
  return thing instanceof ErrorResponse;
}

function Project() {
  let data = useLoaderData();
  return (
    <div>
      <h1>Project</h1>
      {data.project.title}
    </div>
  );
}
```
