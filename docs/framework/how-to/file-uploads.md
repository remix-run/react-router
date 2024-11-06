---
title: File Uploads
---

# File Uploads

Handle file uploads in your React Router applications. This guide uses some packages from the [Remix The Web][remix-the-web] project to make file uploads easier.

_Thank you to David Adams for [his original guide](https://programmingarehard.com/2024/09/06/remix-file-uploads-updated.html/) on how to implement file uploads in Remix. You can refer to it for even more examples._

## Basic File Upload

👉 **Add the form data parser**

`form-data-parser` is a wrapper around `request.formData()` that provides streaming support for handling file uploads.

```shellscript
npm i @mjackson/form-data-parser
```

[See the `form-data-parser` docs for more information][form-data-parser]

👉 **Create a route with an upload action**

The `parseFormData` function takes an `uploadHandler` function as an argument. This function will be called for each file upload in the form.

<docs-warning>

You must set the form's `enctype` to `multipart/form-data` for file uploads to work.

</docs-warning>

```tsx filename=routes/user.$id.tsx
import {
  type FileUpload,
  parseFormData,
} from "@mjackson/form-data-parser";

export async function action({
  request,
}: ActionFunctionArgs) {
  const uploadHandler = async (fileUpload: FileUpload) => {
    if (fileUpload.fieldName === "avatar") {
      // process the upload and return a File
    }
  };

  const formData = await parseFormData(
    request,
    uploadHandler
  );
  // 'avatar' has already been processed at this point
  const file = formData.get("avatar");
}

export default function Component() {
  return (
    <Form method="post" encType="multipart/form-data">
      <input type="file" name="avatar" />
      <button>Submit</button>
    </Form>
  );
}
```

## Local Storage Implementation

👉 **Add the storage package**

`file-storage` is a key/value interface for storing [File objects][file] in JavaScript. Similar to how `localStorage` allows you to store key/value pairs of strings in the browser, file-storage allows you to store key/value pairs of files on the server.

```shellscript
npm i @mjackson/file-storage
```

[See the `file-storage` docs for more information][file-storage]

👉 **Create a storage configuration**

Create a file that exports a `LocalFileStorage` instance to be used by different routes.

```ts filename=file-storage.server.ts
import { LocalFileStorage } from "@mjackson/file-storage/local";

export const fileStorage = new LocalFileStorage(
  "./uploads/avatars"
);

export function getStorageKey(userId: string) {
  return `user-${userId}-avatar`;
}
```

👉 **Implement the upload handler**

Update the form's `action` to store files in the `fileStorage` instance.

```tsx filename=routes/user.$id.tsx
import {
  FileUpload,
  parseFormData,
} from "@mjackson/form-data-parser";
import {
  fileStorage,
  getStorageKey,
} from "~/file-storage.server";
import type { Route } from "./+types.user";

export async function action({
  request,
  params,
}: Route.ActionArgs) {
  async function uploadHandler(fileUpload: FileUpload) {
    if (
      fileUpload.fieldName === "avatar" &&
      fileUpload.type.startsWith("image/")
    ) {
      let storageKey = getStorageKey(params.id);

      // FileUpload objects are not meant to stick around for very long (they are
      // streaming data from the request.body); store them as soon as possible.
      await fileStorage.set(storageKey, fileUpload);

      // Return a File for the FormData object. This is a LazyFile that knows how
      // to access the file's content if needed (using e.g. file.stream()) but
      // waits until it is requested to actually read anything.
      return fileStorage.get(storageKey);
    }
  }

  const formData = await parseFormData(
    request,
    uploadHandler
  );
}

export default function UserPage({
  actionData,
  params,
}: Route.ComponentProps) {
  return (
    <div>
      <h1>User {params.id}</h1>
      <form
        method="post"
        // The form's enctype must be set to "multipart/form-data" for file uploads
        encType="multipart/form-data"
      >
        <input type="file" name="avatar" accept="image/*" />
        <button>Submit</button>
      </form>

      <img
        src={`/user/${params.id}/avatar`}
        alt="user avatar"
      />
    </div>
  );
}
```

👉 **Add a route to serve the uploaded file**

Create a [resource route][resource-route] that streams the file as a response.

```tsx filename=routes/user.$id.avatar.tsx
import {
  fileStorage,
  getStorageKey,
} from "~/file-storage.server";

export async function loader({ params }: Route.LoaderArgs) {
  const storageKey = getStorageKey(params.id);
  const file = await fileStorage.get(storageKey);

  if (!file) {
    throw new Response("User avatar not found", {
      status: 404,
    });
  }

  return new Response(file, {
    headers: {
      "Content-Type": file.type,
      "Content-Disposition": `attachment; filename=${storageKey}`,
    },
  });
}
```

[remix-the-web]: https://github.com/mjackson/remix-the-web
[form-data-parser]: https://github.com/mjackson/remix-the-web/tree/main/packages/form-data-parser
[file-storage]: https://github.com/mjackson/remix-the-web/tree/main/packages/file-storage
[file]: https://developer.mozilla.org/en-US/docs/Web/API/File
[resource-route]: ../how-to/resource-routes.md
