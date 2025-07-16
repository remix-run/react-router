---
title: Quick Start
order: 1
---

# Quick Start

[MODES: framework]

<br />
<br />

This guide will familiarize you with the basic plumbing required to run a React Router app as quickly as possible. While there are many starter templates with different runtimes, deploy targets, and databases, we're going to create a bare-bones project from scratch.

## Installation

If you prefer to initialize a batteries-included React Router project, you can use the `create-react-router` CLI to get started with any of our [templates][templates]:

```shellscript nonumber
npx create-react-router@latest
```

However, this guide will explain everything the CLI does to set up your project. Instead of using the CLI, you can follow these steps. If you're just getting started with React Router, we recommend following this guide to understand all the different pieces that make up a React Router app.

```shellscript nonumber
mkdir my-react-router-app
cd my-react-router-app
npm init -y

# install runtime dependencies
npm i react-router @react-router/node @react-router/serve isbot react react-dom

# install dev dependencies
npm i -D @react-router/dev vite
```

## Vite Config

```shellscript nonumber
touch vite.config.js
```

Since React Router uses [Vite], you'll need to provide a [Vite config][vite-config] with the React Router Vite plugin. Here's the basic configuration you'll need:

```js filename=vite.config.js
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
});
```

## The Root Route

```shellscript nonumber
mkdir app
touch app/root.jsx
```

`app/root.jsx` is what we call the "Root Route". It's the root layout of your entire app. Here's the basic set of elements you'll need for any project:

```jsx filename=app/root.jsx
import { Outlet, Scripts } from "react-router";

export default function App() {
  return (
    <html>
      <head>
        <link
          rel="icon"
          href="data:image/x-icon;base64,AA"
        />
      </head>
      <body>
        <h1>Hello world!</h1>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```

## Additional Routes

```shellscript nonumber
touch app/routes.js
```

`app/routes.js` is where you define your routes. This guide focuses on the minimal setup to get a React Router app up and running, so we don't need to define any routes and can just export an empty array:

```js filename=app/routes.js
export default [];
```

The existence of `routes.js` is required to build a React Router app; if you're using React Router, we assume you'll want to do some routing eventually. You can read more about defining routes in our [Routing][routing] guide.

## Build and Run

First, you will need to specify the type as `module` in `package.json` to satisfy ES module requirements for `react-router` and future versions of Vite.

```shellscript nonumber
npm pkg set type="module"
```

Next build the app for production:

```shellscript nonumber
npx react-router build
```

You should now see a `build` folder containing a `server` folder (the server version of your app) and a `client` folder (the browser version) with some build artifacts in them. (This is all [configurable][react-router-config].)

👉 **Run the app with `react-router-serve`**

Now you can run your app with `react-router-serve`:

```shellscript nonumber
npx react-router-serve build/server/index.js
```

You should be able to open up [http://localhost:3000][http-localhost-3000] and see the "hello world" page.

Aside from the unholy amount of code in `node_modules`, our React Router app is just four files:

```
├── app/
│   ├── root.jsx
│   └── routes.js
├── package.json
└── vite.config.js
```

## Bring Your Own Server

The `build/server` directory created by `react-router build` is just a module that you run inside a server like Express, Cloudflare Workers, Netlify, Vercel, Fastly, AWS, Deno, Azure, Fastify, Firebase, ... anywhere.

<docs-info>

You can also use React Router as a Single Page Application with no server. For more information, see our guide on [Single Page Apps][spa].

</docs-info>

If you don't care to set up your own server, you can use `react-router-serve`. It's a simple `express`-based server maintained by the React Router maintainers. However, React Router is specifically designed to run in _any_ JavaScript environment so that you own your stack. It is expected many —if not most— production apps will have their own server.

Just for kicks, let's stop using `react-router-serve` and use `express` instead.

👉 **Install Express, the React Router Express adapter, and [cross-env] for running in production mode**

```shellscript nonumber
npm i express @react-router/express cross-env

# not going to use this anymore
npm uninstall @react-router/serve
```

👉 **Create an Express server**

```shellscript nonumber
touch server.js
```

```js filename=server.js
import { createRequestHandler } from "@react-router/express";
import express from "express";

const app = express();
app.use(express.static("build/client"));

// notice that your app is "just a request handler"
app.use(
  createRequestHandler({
    // and the result of `react-router build` is "just a module"
    build: await import("./build/server/index.js"),
  }),
);

app.listen(3000, () => {
  console.log("App listening on http://localhost:3000");
});
```

👉 **Run your app with `express`**

```shellscript nonumber
node server.js
```

Now that you own your server, you can debug your app with whatever tooling your server has. For example, you can inspect your app with Chrome DevTools using the [Node.js inspect flag][inspect]:

```shellscript nonumber
node --inspect server.js
```

## Development Workflow

Instead of stopping, rebuilding, and starting your server all the time, you can run React Router in development using [Vite in middleware mode][vite-middleware]. This enables instant feedback to changes in your app with React Refresh (Hot Module Replacement) and React Router Hot Data Revalidation.

First, as a convenience, add `dev` and `start` commands in `package.json` that will run your server in development and production modes respectively:

👉 **Add a "scripts" entry to `package.json`**

```jsonc filename=package.json lines=[2-4] nocopy
{
  "scripts": {
    "dev": "node ./server.js",
    "start": "cross-env NODE_ENV=production node ./server.js",
  },
  // ...
}
```

👉 **Add Vite development middleware to your server**

Vite middleware is not applied if `process.env.NODE_ENV` is set to `"production"`, in which case you'll still be running the regular build output as you did earlier.

```js filename=server.js lines=[6,13-28]
import { createRequestHandler } from "@react-router/express";
import express from "express";

const app = express();

if (process.env.NODE_ENV === "production") {
  app.use(express.static("build/client"));
  app.use(
    createRequestHandler({
      build: await import("./build/server/index.js"),
    }),
  );
} else {
  const viteDevServer = await import("vite").then((vite) =>
    vite.createServer({
      server: { middlewareMode: true },
    }),
  );
  app.use(viteDevServer.middlewares);
  app.use(
    createRequestHandler({
      build: () =>
        viteDevServer.ssrLoadModule(
          "virtual:react-router/server-build",
        ),
    }),
  );
}

app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000`);
});
```

👉 **Start the dev server**

```shellscript nonumber
npm run dev
```

Now you can work on your app with immediate feedback. Give it a try by changing the text in `root.jsx` and watch the changes appear instantly!

## Controlling Server and Browser Entries

There are default magic files React Router is using that most apps don't need to mess with, but if you want to customize React Router's entry points to the server and browser you can run `react-router reveal` and they'll get dumped into your project.

```shellscript nonumber
npx react-router reveal
```

```
Entry file entry.client created at app/entry.client.tsx.
Entry file entry.server created at app/entry.server.tsx.
```

## Summary

Congrats, you can add React Router to your resume! Summing things up, we've learned:

- React Router framework mode compiles your app into two things:
  - A request handler that you add to your own JavaScript server
  - A pile of static assets in your public directory for the browser
- You can bring your own server with adapters to deploy anywhere
- You can set up a development workflow with HMR built-in

In general, React Router is a bit "guts out". It requires a few minutes of boilerplate, but now you own your stack.

What's next?

- [Address Book Tutorial][address-book-tutorial]

[templates]: ../start/framework/deploying#templates
[spa]: ../how-to/spa
[inspect]: https://nodejs.org/en/docs/guides/debugging-getting-started/
[vite-config]: https://vite.dev/config
[routing]: ../start/framework/routing
[http-localhost-3000]: http://localhost:3000
[vite]: https://vitejs.dev
[react-router-config]: https://api.reactrouter.com/v7/types/_react_router_dev.config.Config.html
[vite-middleware]: https://vitejs.dev/guide/ssr#setting-up-the-dev-server
[cross-env]: https://www.npmjs.com/package/cross-env
[address-book-tutorial]: ./address-book
