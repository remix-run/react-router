---
title: Sessions and Cookies
---

# Sessions and Cookies

## Sessions

Sessions are an important part of websites that allow the server to identify requests coming from the same person, especially when it comes to server-side form validation or when JavaScript is not on the page. Sessions are a fundamental building block of many sites that let users "log in", including social, e-commerce, business, and educational websites.

When using React Router as your framework, sessions are managed on a per-route basis (rather than something like express middleware) in your `loader` and `action` methods using a "session storage" object (that implements the [`SessionStorage`][session-storage] interface). Session storage understands how to parse and generate cookies, and how to store session data in a database or filesystem.

### Using Sessions

This is an example of a cookie session storage:

```ts filename=app/sessions.server.ts
import { createCookieSessionStorage } from "react-router";

type SessionData = {
  userId: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>(
    {
      // a Cookie from `createCookie` or the CookieOptions to create one
      cookie: {
        name: "__session",

        // all of these are optional
        domain: "reactrouter.com",
        // Expires can also be set (although maxAge overrides it when used in combination).
        // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
        //
        // expires: new Date(Date.now() + 60_000),
        httpOnly: true,
        maxAge: 60,
        path: "/",
        sameSite: "lax",
        secrets: ["s3cret1"],
        secure: true,
      },
    }
  );

export { getSession, commitSession, destroySession };
```

We recommend setting up your session storage object in `app/sessions.server.ts` so all routes that need to access session data can import from the same spot.

The input/output to a session storage object are HTTP cookies. `getSession()` retrieves the current session from the incoming request's `Cookie` header, and `commitSession()`/`destroySession()` provide the `Set-Cookie` header for the outgoing response.

You'll use methods to get access to sessions in your `loader` and `action` functions.

After retrieving a session with `getSession`, the returned session object has a handful of methods and properties:

```tsx
export async function action({
  request,
}: ActionFunctionArgs) {
  const session = await getSession(
    request.headers.get("Cookie")
  );
  session.get("foo");
  session.has("bar");
  // etc.
}
```

See the [Session API][session-api] for more all the methods available on the session object.

### Login form example

A login form might look something like this:

```tsx filename=app/routes/login.tsx lines=[4-7,12-14,16,22,25,33-35,46,51,56,61]
import { data, redirect } from "react-router";
import type { Route } from "./+types/login";

import {
  getSession,
  commitSession,
} from "../sessions.server";

export async function loader({
  request,
}: Route.LoaderArgs) {
  const session = await getSession(
    request.headers.get("Cookie")
  );

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }

  return data(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export async function action({
  request,
}: Route.ActionArgs) {
  const session = await getSession(
    request.headers.get("Cookie")
  );
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");

  const userId = await validateCredentials(
    username,
    password
  );

  if (userId == null) {
    session.flash("error", "Invalid username/password");

    // Redirect back to the login page with errors.
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  session.set("userId", userId);

  // Login succeeded, send them to the home page.
  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Login({
  loaderData,
}: Route.ComponentProps) {
  const { error } = loaderData;

  return (
    <div>
      {error ? <div className="error">{error}</div> : null}
      <form method="POST">
        <div>
          <p>Please sign in</p>
        </div>
        <label>
          Username: <input type="text" name="username" />
        </label>
        <label>
          Password:{" "}
          <input type="password" name="password" />
        </label>
      </form>
    </div>
  );
}
```

And then a logout form might look something like this:

```tsx filename=app/routes/logout.tsx
import {
  getSession,
  destroySession,
} from "../sessions.server";
import type { Route } from "./+types/logout";

export async function action({
  request,
}: Route.ActionArgs) {
  const session = await getSession(
    request.headers.get("Cookie")
  );
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export default function LogoutRoute() {
  return (
    <>
      <p>Are you sure you want to log out?</p>
      <Form method="post">
        <button>Logout</button>
      </Form>
      <Link to="/">Never mind</Link>
    </>
  );
}
```

<docs-warning>It's important that you logout (or perform any mutation for that matter) in an `action` and not a `loader`. Otherwise you open your users to [Cross-Site Request Forgery][csrf] attacks.</docs-warning>

### Session Gotchas

Because of nested routes, multiple loaders can be called to construct a single page. When using `session.flash()` or `session.unset()`, you need to be sure no other loaders in the request are going to want to read that, otherwise you'll get race conditions. Typically if you're using flash, you'll want to have a single loader read it, if another loader wants a flash message, use a different key for that loader.

### Creating custom session storage

React Router makes it easy to store sessions in your own database if needed. The [`createSessionStorage()`][create-session-storage] API requires a `cookie` (for options for creating a cookie, see [cookies][cookies]) and a set of create, read, update, and delete (CRUD) methods for managing the session data. The cookie is used to persist the session ID.

- `createData` will be called from `commitSession` on the initial session creation when no session ID exists in the cookie
- `readData` will be called from `getSession` when a session ID exists in the cookie
- `updateData` will be called from `commitSession` when a session ID already exists in the cookie
- `deleteData` is called from `destroySession`

The following example shows how you could do this using a generic database client:

```ts
import { createSessionStorage } from "react-router";

function createDatabaseSessionStorage({
  cookie,
  host,
  port,
}) {
  // Configure your database client...
  const db = createDatabaseClient(host, port);

  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      // `expires` is a Date after which the data should be considered
      // invalid. You could use it to invalidate the data somehow or
      // automatically purge this record from your database.
      const id = await db.insert(data);
      return id;
    },
    async readData(id) {
      return (await db.select(id)) || null;
    },
    async updateData(id, data, expires) {
      await db.update(id, data);
    },
    async deleteData(id) {
      await db.delete(id);
    },
  });
}
```

And then you can use it like this:

```ts
const { getSession, commitSession, destroySession } =
  createDatabaseSessionStorage({
    host: "localhost",
    port: 1234,
    cookie: {
      name: "__session",
      sameSite: "lax",
    },
  });
```

The `expires` argument to `createData` and `updateData` is the same `Date` at which the cookie itself expires and is no longer valid. You can use this information to automatically purge the session record from your database to save on space, or to ensure that you do not otherwise return any data for old, expired cookies.

### Additional session utils

There are also several other session utilities available if you need them:

- [`isSession`][is-session]
- [`createMemorySessionStorage`][create-memory-session-storage]
- [`createSession`][create-session] (custom storage)
- [`createFileSessionStorage`][create-file-session-storage] (node)
- [`createWorkersKVSessionStorage`][create-workers-kv-session-storage] (Cloudflare Workers)
- [`createArcTableSessionStorage`][create-arc-table-session-storage] (architect, Amazon DynamoDB)

## Cookies

A [cookie][cookie] is a small piece of information that your server sends someone in a HTTP response that their browser will send back on subsequent requests. This technique is a fundamental building block of many interactive websites that adds state so you can build authentication (see [sessions][sessions]), shopping carts, user preferences, and many other features that require remembering who is "logged in".

React Router's [`Cookie` interface][cookie-api] provides a logical, reusable container for cookie metadata.

### Using cookies

While you may create these cookies manually, it is more common to use a [session storage][sessions].

In React Router, you will typically work with cookies in your `loader` and/or `action` functions, since those are the places where you need to read and write data.

Let's say you have a banner on your e-commerce site that prompts users to check out the items you currently have on sale. The banner spans the top of your homepage, and includes a button on the side that allows the user to dismiss the banner so they don't see it for at least another week.

First, create a cookie:

```ts filename=app/cookies.server.ts
import { createCookie } from "react-router";

export const userPrefs = createCookie("user-prefs", {
  maxAge: 604_800, // one week
});
```

Then, you can `import` the cookie and use it in your `loader` and/or `action`. The `loader` in this case just checks the value of the user preference so you can use it in your component for deciding whether to render the banner. When the button is clicked, the `<form>` calls the `action` on the server and reloads the page without the banner.

### User preferences example

```tsx filename=app/routes/home.tsx lines=[4,9-11,18-20,29]
import { Link, Form, redirect } from "react-router";
import type { Route } from "./+types/home";

import { userPrefs } from "../cookies.server";

export async function loader({
  request,
}: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie =
    (await userPrefs.parse(cookieHeader)) || {};
  return { showBanner: cookie.showBanner };
}

export async function action({
  request,
}: Route.ActionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie =
    (await userPrefs.parse(cookieHeader)) || {};
  const bodyParams = await request.formData();

  if (bodyParams.get("bannerVisibility") === "hidden") {
    cookie.showBanner = false;
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": await userPrefs.serialize(cookie),
    },
  });
}

export default function Home({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div>
      {loaderData.showBanner ? (
        <div>
          <Link to="/sale">Don't miss our sale!</Link>
          <Form method="post">
            <input
              type="hidden"
              name="bannerVisibility"
              value="hidden"
            />
            <button type="submit">Hide</button>
          </Form>
        </div>
      ) : null}
      <h1>Welcome!</h1>
    </div>
  );
}
```

### Cookie attributes

Cookies have [several attributes][cookie-attrs] that control when they expire, how they are accessed, and where they are sent. Any of these attributes may be specified either in `createCookie(name, options)`, or during `serialize()` when the `Set-Cookie` header is generated.

```ts
const cookie = createCookie("user-prefs", {
  // These are defaults for this cookie.
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: true,
  expires: new Date(Date.now() + 60_000),
  maxAge: 60,
});

// You can either use the defaults:
cookie.serialize(userPrefs);

// Or override individual ones as needed:
cookie.serialize(userPrefs, { sameSite: "strict" });
```

Please read [more info about these attributes][cookie-attrs] to get a better understanding of what they do.

### Signing cookies

It is possible to sign a cookie to automatically verify its contents when it is received. Since it's relatively easy to spoof HTTP headers, this is a good idea for any information that you do not want someone to be able to fake, like authentication information (see [sessions][sessions]).

To sign a cookie, provide one or more `secrets` when you first create the cookie:

```ts
const cookie = createCookie("user-prefs", {
  secrets: ["s3cret1"],
});
```

Cookies that have one or more `secrets` will be stored and verified in a way that ensures the cookie's integrity.

Secrets may be rotated by adding new secrets to the front of the `secrets` array. Cookies that have been signed with old secrets will still be decoded successfully in `cookie.parse()`, and the newest secret (the first one in the array) will always be used to sign outgoing cookies created in `cookie.serialize()`.

```ts filename=app/cookies.server.ts
export const cookie = createCookie("user-prefs", {
  secrets: ["n3wsecr3t", "olds3cret"],
});
```

```tsx filename=app/routes/my-route.tsx
import { data } from "react-router";
import { cookie } from "../cookies.server";
import type { Route } from "./+types/my-route";

export async function loader({
  request,
}: Route.LoaderArgs) {
  const oldCookie = request.headers.get("Cookie");
  // oldCookie may have been signed with "olds3cret", but still parses ok
  const value = await cookie.parse(oldCookie);

  return data("...", {
    headers: {
      // Set-Cookie is signed with "n3wsecr3t"
      "Set-Cookie": await cookie.serialize(value),
    },
  });
}
```

### Additional cookie utils

There are also several other cookie utilities available if you need them:

- [`isCookie`][is-cookie]
- [`createCookie`][create-cookie]

To learn more about each attribute, please see the [MDN Set-Cookie docs][cookie-attrs].

[csrf]: https://developer.mozilla.org/en-US/docs/Glossary/CSRF
[cookies]: #cookies
[sessions]: #sessions
[session-storage]: https://api.reactrouter.com/v7/interfaces/react_router.SessionStorage
[session-api]: https://api.reactrouter.com/v7/interfaces/react_router.Session
[is-session]: https://api.reactrouter.com/v7/functions/react_router.isSession
[cookie-api]: https://api.reactrouter.com/v7/interfaces/react_router.Cookie
[create-session-storage]: https://api.reactrouter.com/v7/functions/react_router.createSessionStorage
[create-session]: https://api.reactrouter.com/v7/functions/react_router.createSession
[create-memory-session-storage]: https://api.reactrouter.com/v7/functions/react_router.createMemorySessionStorage
[create-file-session-storage]: https://api.reactrouter.com/v7/functions/_react_router_node.createFileSessionStorage
[create-workers-kv-session-storage]: https://api.reactrouter.com/v7/functions/_react_router_cloudflare.createWorkersKVSessionStorage
[create-arc-table-session-storage]: https://api.reactrouter.com/v7/functions/_react_router_architect.createArcTableSessionStorage
[cookie]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
[cookie-attrs]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
[is-cookie]: https://api.reactrouter.com/v7/functions/react_router.isCookie
[create-cookie]: https://api.reactrouter.com/v7/functions/react_router.createCookie
