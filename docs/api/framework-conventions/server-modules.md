---
title: .server modules
---

# `.server` modules

[MODES: framework]

## Summary

Server-only modules that are excluded from client bundles and only run on the server.

```ts filename=auth.server.ts
// This would expose secrets on the client if not exported from a server-only module
export const JWT_SECRET = process.env.JWT_SECRET;

export function validateToken(token: string) {
  // Server-only authentication logic
}
```

`.server` modules are a good way to explicitly mark entire modules as server-only. The build will fail if any code in a `.server` file or `.server` directory accidentally ends up in the client module graph.

<docs-warning>

Route modules should not be marked as `.server` or `.client` as they have special handling and need to be referenced in both server and client module graphs. Attempting to do so will cause build errors.

</docs-warning>

<docs-info>

If you need more sophisticated control over what is included in the client/server bundles, check out the [`vite-env-only` plugin](https://github.com/pcattori/vite-env-only).

</docs-info>


## Usage Patterns

### Individual Files

Mark individual files as server-only by adding `.server` to the filename:

```txt
app/
├── auth.server.ts         👈 server-only file
├── database.server.ts
├── email.server.ts
└── root.tsx
```

### Server Directories

Mark entire directories as server-only by using `.server` in the directory name:

```txt
app/
├── .server/               👈 entire directory is server-only
│   ├── auth.ts
│   ├── database.ts
│   └── email.ts
├── components/
└── root.tsx
```

## Examples

### Database Connection

```ts filename=app/utils/db.server.ts
import { PrismaClient } from "@prisma/client";

// This would expose database credentials on the client
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export { db };
```

### Authentication Utilities

```ts filename=app/utils/auth.server.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET!;

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(
  password: string,
  hash: string
) {
  return bcrypt.compare(password, hash);
}

export function createToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as {
    userId: string;
  };
}
```

### Using Server Modules

```tsx filename=app/routes/login.tsx
import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import {
  hashPassword,
  createToken,
} from "../utils/auth.server";
import { db } from "../utils/db.server";

export async function action({
  request,
}: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Server-only operations
  const hashedPassword = await hashPassword(password);
  const user = await db.user.create({
    data: { email, password: hashedPassword },
  });

  const token = createToken(user.id);

  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": `token=${token}; HttpOnly; Secure; SameSite=Strict`,
    },
  });
}

export default function Login() {
  return (
    <form method="post">
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```
