---
title: Status Codes
---

# Status Codes

Set status codes from loaders and actions with `data`.

```tsx filename=app/project.tsx lines=[3,12-15,20,23]
// route('/projects/:projectId', './project.tsx')
import type { Route } from "./+types/project";
import { data } from "react-router";
import { fakeDb } from "../db";

export async function action({
  request,
}: Route.ActionArgs) {
  let formData = await request.formData();
  let title = formData.get("title");
  if (!title) {
    return data(
      { message: "Invalid title" },
      { status: 400 }
    );
  }

  if (!projectExists(title)) {
    let project = await fakeDb.createProject({ title });
    return data(project, { status: 201 });
  } else {
    let project = await fakeDb.updateProject({ title });
    // the default status code is 200, no need for `data`
    return project;
  }
}
```

See [Form Validation](./form-validation) for more information on rendering form errors like this.

Another common status code is 404:

```tsx
// route('/projects/:projectId', './project.tsx')
import type { Route } from "./+types/project";
import { data } from "react-router";
import { fakeDb } from "../db";

export async function loader({ params }: Route.ActionArgs) {
  let project = await fakeDb.getProject(params.id);
  if (!project) {
    // throw to ErrorBoundary
    throw data(null, { status: 404 });
  }
  return project;
}
```

See the [Error Boundaries](./error-boundary) for more information on thrown `data`.
