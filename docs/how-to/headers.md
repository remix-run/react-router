---
title: Setting HTTP Headers and Status
hidden: true
---

# HTTP Headers and Status

<!-- look in the old route-module.md for some extra info here -->

<!-- copy pasted from data-loading.md, go a bit more in depth, with multiple steps -->

If you need to return a custom HTTP status code or custom headers from your `loader`, use [`data`][data]:

```tsx filename=app/product.tsx lines=[3,6-8,14,17-21]
// route("products/:pid", "./product.tsx");
import type { Route } from "./+types/product";
import { data } from "react-router";
import { fakeDb } from "../db";

export function headers({ loaderHeaders }: HeadersArgs) {
  return loaderHeaders;
}

export async function loader({ params }: Route.LoaderArgs) {
  const product = await fakeDb.getProduct(params.pid);

  if (!product) {
    throw data(null, { status: 404 });
  }

  return data(product, {
    headers: {
      "Cache-Control": "public; max-age=300",
    },
  });
}
```

<!-- copy pasted from actions.md -->

If you need to return a custom HTTP status code or custom headers from your `action`, you can do so using the [`data`][data] utility:

```tsx filename=app/project.tsx lines=[3,11-14,19]
// route('/projects/:projectId', './project.tsx')
import type { Route } from "./+types/project";
import { data } from "react-router";
import { fakeDb } from "../db";

export async function action({
  request,
}: Route.ActionArgs) {
  let formData = await request.formData();
  let title = await formData.get("title");
  if (!title) {
    throw data(
      { message: "Invalid title" },
      { status: 400 }
    );
  }

  if (!projectExists(title)) {
    let project = await fakeDb.createProject({ title });
    return data(project, { status: 201 });
  } else {
    let project = await fakeDb.updateProject({ title });
    return project;
  }
}
```
