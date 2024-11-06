---
title: File Uploads
---

# File Uploads

Handle file uploads in your React Router applications using form data parsing and storage.

_Thank you to David Adams for [his original guide](https://programmingarehard.com/2024/09/06/remix-file-uploads-updated.html/) on how to implement file uploads in Remix. Please check it out for more details and examples._

## Basic File Upload

👉 **Install the form data parser:**

```shellscript
npm i @mjackson/form-data-parser
```

👉 **Create a route with an upload action:**

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

👉 **Add the storage package:**

```shellscript
npm i @mjackson/file-storage
```

👉 **Create a storage configuration:**

```ts filename=file-storage.server.ts
import { LocalFileStorage } from "@mjackson/file-storage/local";

export const fileStorage = new LocalFileStorage(
  "./uploads/avatars"
);

export function getStorageKey(userId: string) {
  return `user-${userId}-avatar`;
}
```

👉 **Implement the upload handler:**

```tsx filename=routes/user.$id.tsx
import {
  FileUpload,
  parseFormData,
} from "@mjackson/form-data-parser";
import {
  fileStorage,
  getStorageKey,
} from "~/file-storage.server";

export async function action({
  request,
  params,
}: Route.ActionArgs) {
  async function uploadHandler(fileUpload: FileUpload) {
    if (fileUpload.fieldName === "avatar") {
      const storageKey = getStorageKey(params.id);
      await fileStorage.set(storageKey, fileUpload);
      return fileStorage.get(storageKey);
    }
  }

  try {
    const formData = await parseFormData(
      request,
      uploadHandler
    );
    return { success: true };
  } catch (error) {
    throw new Response("Failed to upload file", {
      status: 500,
    });
  }
}
```

👉 **Add a route to serve the uploaded file:**

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
