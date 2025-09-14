---
title: "@react-router/serve"
---

# React Router App Server

React Router is designed for you to own your server, but if you don't want to set one up, you can use the React Router App Server instead. It's a production-ready but basic Node.js server built with [Express][express].

By design, we do not provide options to customize the React Router App Server because if you need to customize the underlying `express` server, we'd rather you manage the server completely instead of creating an abstraction to handle all the possible customizations you may require. If you find you want to customize it, you can [migrate to the `@react-router/express` adapter][migrate-to-express].

You can see the underlying `express` server configuration in [packages/react-router-serve/cli.ts][rr-serve-code]. By default, it uses the following Express middlewares (please refer to their documentation for default behaviors):

- [`compression`][compression]
- [`express.static`][express-static] (and thus [`serve-static`][serve-static])
- [`morgan`][morgan]

## `HOST` environment variable

You can configure the hostname for your Express app via `process.env.HOST` and that value will be passed to the internal [`app.listen`][express-listen] method when starting the server.

```shellscript nonumber
HOST=127.0.0.1 npx react-router-serve build/index.js
```

```shellscript nonumber
react-router-serve <server-build-path>
# e.g.
react-router-serve build/index.js
```

## `PORT` environment variable

You can change the port of the server with an environment variable.

```shellscript nonumber
PORT=4000 npx react-router-serve build/index.js
```

## Development Environment

Depending on `process.env.NODE_ENV`, the server will boot in development or production mode.

The `server-build-path` needs to point to the `serverBuildPath` defined in [`react-router.config.ts`][rr-config].

Because only the build artifacts (`build/`, `public/build/`) need to be deployed to production, the `react-router.config.ts` is not guaranteed to be available in production, so you need to tell React Router where your server build is with this option.

In development, `react-router-serve` will ensure the latest code is run by purging the `require` cache for every request. This has some effects on your code you might need to be aware of:

- Any values in the module scope will be "reset"

  ```tsx lines=[1-3]
  // this will be reset for every request because the module cache was
  // cleared and this will be required brand new
  const cache = new Map();

  export async function loader({
    params,
  }: Route.LoaderArgs) {
    if (cache.has(params.foo)) {
      return cache.get(params.foo);
    }

    const record = await fakeDb.stuff.find(params.foo);
    cache.set(params.foo, record);
    return record;
  }
  ```

  If you need a workaround for preserving cache in development, you can set up a singleton in your server.

- Any **module side effects** will remain in place! This may cause problems but should probably be avoided anyway.

  ```tsx lines=[1-4]
  // this starts running the moment the module is imported
  setInterval(() => {
    console.log(Date.now());
  }, 1000);

  export async function loader() {
    // ...
  }
  ```

  If you need to write your code in a way that has these types of module side effects, you should set up your own [@react-router/express][rr-express] server and a tool in development like [`pm2-dev`][pm2-dev] or [`nodemon`][nodemon] to restart the server on file changes instead.

In production, this doesn't happen. The server boots up, and that's the end of it.

[rr-express]: ./adapter#react-routerexpress
[express-listen]: https://expressjs.com/en/api.html#app.listen
[rr-config]: ../framework-conventions/react-router.config.ts
[rr-serve-code]: https://github.com/remix-run/react-router/blob/main/packages/react-router-serve/cli.ts
[compression]: https://expressjs.com/en/resources/middleware/compression.html
[express-static]: https://expressjs.com/en/4x/api.html#express.static
[serve-static]: https://expressjs.com/en/resources/middleware/serve-static.html
[morgan]: https://expressjs.com/en/resources/middleware/morgan.html
[express]: https://expressjs.com
[migrate-to-express]: ./adapter#migrating-from-the-react-router-app-server
[pm2-dev]: https://npm.im/pm2-dev
[nodemon]: https://npm.im/nodemon
