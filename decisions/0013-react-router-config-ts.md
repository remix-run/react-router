# `react-router.config.ts`

Date: 2024-11-21

Status: accepted

## Context

Previously in Remix and earlier pre-releases of React Router, framework config was passed directly to the Vite plugin as an options object. While this has worked well so far when limited to Vite-specific use cases or simple CLI commands, we've started to run into some limitations as our `react-router` CLI has become more advanced.

Some key issues with the current approach:

1. **Tight coupling with Vite**

   Our CLI commands (`react-router routes` and `react-router typegen`) need access to framework config but have nothing to do with Vite. We previously worked around this by using Vite to resolve `vite.config.ts` and then extracting our React Router config from the resolved Vite config object, but this approach proved to be difficult as we added more features to our CLI.

2. **Limited config watching capabilities**

   The introduction of `react-router typegen --watch` in particular highlighted the limitations of our Vite-coupled approach. We needed to not only resolve our config but also watch for changes. Having this tied to the Vite config made implementing this functionality unnecessarily complex.

3. **Heavy-handed config updates**

   Changes to Vite plugin options are treated like any other change to the Vite config, triggering a full reload of the dev server. This takes away any ability for us to handle config updates more gracefully.

4. **Difficulty with config documentation**

   Documentation of our config options was difficult since we either had to show a complete Vite config file with a lot of extra noise, or only show a call to the `reactRouter` plugin which looked a bit confusing since it was labelled as a `vite.config.ts` file. Neither approach was ideal for clearly explaining our config options while keeping code snippets to a minimum.

## Goals

1. Decouple framework config from Vite
2. Enable granular config watching for tools like `react-router typegen --watch`
3. Avoid unnecessary dev server reloads when config changes
4. Improve documentation by separating framework config from Vite config

## Decisions

### Introduce dedicated `react-router.config.ts` in the root of the project

We will introduce a dedicated config file, `react-router.config.ts/js`.

### Config is provided via a default export

To maintain consistency with other JS build tool configuration patterns, we will export the config object as the default export of the `react-router.config.ts` file.

### Change `app/routes.ts` API to use a default export rather than a named `routes` export

Now that we have multiple config files (`react-router.config.ts` and `app/routes.ts`), we should be internally consistent and use default exports for all of our config files. Now is a good time to make this change since the `routes.ts` API hasn't yet had a stable release.

### Any config APIs should be exported from `@react-router/dev/config`

The exported config object should satisfy the `Config` type from `@react-router/dev/config`. This follows our established pattern of using `@react-router/dev/*` namespaces for dev-time APIs that are scoped to particular files, e.g. `@react-router/dev/routes` and `@react-router/dev/vite`.

### Config file is optional but recommended

While the lack of a config file won't be treated as an error, we should include a blank config file in all official templates to make the config options more discoverable and self-documenting.

### Remove options from Vite plugin

The Vite plugin will no longer accept config options. All framework options will be handled through the dedicated config file.

### Improved config update handling

Config changes should no longer trigger full dev server reloads. We may re-introduce this behavior in certain cases where it makes sense.
