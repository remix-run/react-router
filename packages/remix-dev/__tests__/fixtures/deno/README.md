# Remix + Deno

Welcome to the Deno template for Remix! 🦕

For more, check out the [Remix docs](https://remix.run/docs).

## Install

```sh
npx create-remix@latest --template remix-run/remix/templates/deno
```

## Managing dependencies

Read about
[how we recommend to manage dependencies for Remix projects using Deno](https://github.com/remix-run/remix/blob/main/decisions/0001-use-npm-to-manage-npm-dependencies-for-deno-projects.md).

- ✅ You should use `npm` to install NPM packages
  ```sh
  npm install react
  ```
  ```ts
  import { useState } from "react";
  ```
- ✅ You may use inlined URL imports or
  [deps.ts](https://deno.land/manual/examples/manage_dependencies#managing-dependencies)
  for Deno modules.
  ```ts
  import { copy } from "https://deno.land/std@0.138.0/streams/conversion.ts";
  ```
- ❌ Do not use
  [import maps](https://deno.land/manual/linking_to_external_code/import_maps).

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

### Type hints

This template provides type hinting to VS Code via a
[dedicated import map](./.vscode/resolve_npm_imports.json).

To get types in another editor, use an extension for Deno that supports import
maps and point your editor to `./.vscode/resolve_npm_imports.json`.

For more, see
[our decision doc for interop between Deno and NPM](https://github.com/remix-run/remix/blob/main/decisions/0001-use-npm-to-manage-npm-dependencies-for-deno-projects.md#vs-code-type-hints).

## Production

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

## Deployment

Building the Deno app (`npm run build`) results in two outputs:

- `build/` (server bundle)
- `public/build/` (browser bundle)

You can deploy these bundles to any host that runs Deno, but here we'll focus on
deploying to [Deno Deploy](https://deno.com/deploy).

### Setting up Deno Deploy

1. [Sign up](https://dash.deno.com/signin) for Deno Deploy.

2. [Create a new Deno Deploy project](https://dash.deno.com/new) for this app.

3. Replace `<your deno deploy project>` in the `deploy` script in `package.json`
   with your Deno Deploy project name:

```json filename=package.json
{
  "scripts": {
    "deploy": "deployctl deploy --project=<your deno deploy project> --include=.cache,build,public ./build/index.js"
  }
}
```

4. [Create a personal access token](https://dash.deno.com/account) for the Deno
   Deploy API and export it as `DENO_DEPLOY_TOKEN`:

```sh
export DENO_DEPLOY_TOKEN=<your Deno Deploy API token>
```

You may want to add this to your `rc` file (e.g. `.bashrc` or `.zshrc`) to make
it available for new terminal sessions, but make sure you don't commit this
token into `git`. If you want to use this token in GitHub Actions, set it as a
GitHub secret.

5. Install the Deno Deploy CLI,
   [`deployctl`](https://github.com/denoland/deployctl):

```sh
deno install --allow-read --allow-write --allow-env --allow-net --allow-run --no-check -r -f https://deno.land/x/deploy/deployctl.ts
```

6. If you have previously installed the Deno Deploy CLI, you should update it to
   the latest version:

```sh
deployctl upgrade
```

### Deploying to Deno Deploy

After you've set up Deno Deploy, run:

```sh
npm run deploy
```
