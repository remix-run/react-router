---
title: "@react-router/dev (CLI)"
---

# React Router CLI

The React Router CLI comes from the `@react-router/dev` package. Make sure it is in your `package.json` `devDependencies` so it doesn't get deployed to your server.

To get a full list of available commands and flags, run:

```shellscript nonumber
npx @react-router/dev -h
```

## `react-router build`

Builds your app for production with [Vite][vite]. This command will set `process.env.NODE_ENV` to `production` and minify the output for deployment.

```shellscript nonumber
react-router build
```

| Flag                  | Description                                             | Type                                                | Default     |
| --------------------- | ------------------------------------------------------- | --------------------------------------------------- | ----------- |
| `--assetsInlineLimit` | Static asset base64 inline threshold in bytes           | `number`                                            | `4096`      |
| `--clearScreen`       | Allow/disable clear screen when logging                 | `boolean`                                           |             |
| `--config`, `-c`      | Use specified config file                               | `string`                                            |             |
| `--emptyOutDir`       | Force empty outDir when it's outside of root            | `boolean`                                           |             |
| `--logLevel`, `-l`    | Use specified log level                                 | `"info" \| "warn" \| "error" \| "silent" \| string` |             |
| `--minify`            | Enable/disable minification, or specify minifier to use | `boolean \| "terser" \| "esbuild"`                  | `"esbuild"` |
| `--mode`, `-m`        | Set env mode                                            | `string`                                            |             |
| `--profile`           | Start built-in Node.js inspector                        |                                                     |             |
| `--sourcemapClient`   | Output source maps for client build                     | `boolean \| "inline" \| "hidden"`                   | `false`     |
| `--sourcemapServer`   | Output source maps for server build                     | `boolean \| "inline" \| "hidden"`                   | `false`     |

## `react-router dev`

Runs your app in development mode with HMR and Hot Data Revalidation (HDR), powered by [Vite][vite].

```shellscript nonumber
react-router dev
```

<docs-info>

What is "Hot Data Revalidation"?

Like HMR, HDR is a way of hot updating your app without needing to refresh the page.
That way you can keep your app state as your edits are applied in your app.
HMR handles client-side code updates like when you change the components, markup, or styles in your app.
Likewise, HDR handles server-side code updates.

That means any time you make a change to the current page (or any code that your current page depends on), React Router will re-fetch data from your [loaders][loaders].
That way your app is _always_ up to date with the latest code changes, client-side or server-side.

</docs-info>

| Flag               | Description                                           | Type                                                | Default |
| ------------------ | ----------------------------------------------------- | --------------------------------------------------- | ------- |
| `--clearScreen`    | Allow/disable clear screen when logging               | `boolean`                                           |         |
| `--config`, `-c`   | Use specified config file                             | `string`                                            |         |
| `--cors`           | Enable CORS                                           | `boolean`                                           |         |
| `--force`          | Force the optimizer to ignore the cache and re-bundle | `boolean`                                           |         |
| `--host`           | Specify hostname                                      | `string`                                            |         |
| `--logLevel`, `-l` | Use specified log level                               | `"info" \| "warn" \| "error" \| "silent" \| string` |         |
| `--mode`, `-m`     | Set env mode                                          | `string`                                            |         |
| `--open`           | Open browser on startup                               | `boolean \| string`                                 |         |
| `--port`           | Specify port                                          | `number`                                            |         |
| `--profile`        | Start built-in Node.js inspector                      |                                                     |         |
| `--strictPort`     | Exit if specified port is already in use              | `boolean`                                           |         |

## `react-router reveal`

React Router handles the entry points of your application by default.

If you want to have control over these entry points, you can run `npx react-router reveal` to generate the [`entry.client.tsx`][entry-client] and [`entry.server.tsx`][entry-server] files in your `app` directory. When these files are present, React Router will use them instead of the defaults.

```shellscript nonumber
npx react-router reveal
```

| Flag              | Description                     | Type      | Default |
| ----------------- | ------------------------------- | --------- | ------- |
| `--config`, `-c`  | Use specified config file       | `string`  |         |
| `--mode`, `-m`    | Set env mode                    | `string`  |         |
| `--no-typescript` | Generate plain JavaScript files | `boolean` | `false` |
| `--typescript`    | Generate TypeScript files       | `boolean` | `true`  |

## `react-router routes`

Prints the routes in your app to the terminal.

```shellscript nonumber
react-router routes
```

Your route tree will be in a JSX format by default. You can also use the `--json` flag to get the routes in a JSON format.

```shellscript nonumber
react-router routes --json
```

| Flag             | Description                  | Type      | Default |
| ---------------- | ---------------------------- | --------- | ------- |
| `--config`, `-c` | Use specified config file    | `string`  |         |
| `--json`         | Output routes in JSON format | `boolean` | `false` |
| `--mode`, `-m`   | Set env mode                 | `string`  |         |

## `react-router typegen`

Generates TypeScript types for your routes. This happens automatically during development, but you can manually run it when needed, e.g., to generate types in CI before running `tsc`.  See [Type Safety][type-safety] for more information.

```shellscript nonumber
react-router typegen
```

| Flag             | Description               | Type      | Default |
| ---------------- | ------------------------- | --------- | ------- |
| `--config`, `-c` | Use specified config file | `string`  |         |
| `--mode`, `-m`   | Set env mode              | `string`  |         |
| `--watch`        | Watch for changes         | `boolean` | `false` |

[loaders]: ../../start/framework/data-loading
[vite]: https://vite.dev
[entry-server]: ../framework-conventions/entry.server.tsx
[entry-client]: ../framework-conventions/entry.client.tsx
[type-safety]: ../../explanation/type-safety
