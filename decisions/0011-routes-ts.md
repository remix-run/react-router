# routes.ts

Date: 2024-09-18

Status: accepted

## Context

Now that Remix is being merged upstream into React Router, we have an opportunity to revisit our approach to route configuration for the Vite plugin.

Remix ships with a default set of file system routing conventions. While convenient for demos, examples, tutorials and simple use cases, conventions like these come with a few major drawbacks:

1. **They're highly contentious.**

   File system routing conventions are inherently subjective, with numerous possible approaches and preferences. For example, some developers prefer flat route folder structures, while others prefer deeply nested directories. Some even prefer a mix of both. These differing opinions make it challenging to create a one-size-fits-all solution.

   When we changed the default routing conventions between Remix v1 and v2, we found this caused friction for some users who didn't see the benefit in migrating and preferred the old conventions. While consumers could opt out of the new conventions, this may not have been obvious to everyone, and it made anyone using another convention feel like they were veering off the blessed path. This was especially pronounced for anyone who chose to stick with the previous convention since it was now being presented as a legacy "v1" approach.

   For those that opted out of the built-in convention, the lower level `routes` option that was provided as an escape hatch presented some challenges. It was quite tricky to use since it didn't use a nested object structure to represent the route tree. Instead, it relied on function calls with nested callbacks to define routes, and then Remix used the call stack to determine the route tree for you. This made it more difficult than it should have been to build alternative routing conventions and resulted in some less-than-ideal APIs.

   In hindsight, we feel we could have been less opinionated in this area.

2. **Advanced usage gets convoluted.**

   Filenames are more limited compared to config-based routes since they have fewer characters to work with. They not only need to include the route path and any parameters—they also need to encode further route configuration (index/layout routes, opting out of nested layouts, escaping special characters, etc.), leading to increasingly elaborate naming conventions.

   This is exacerbated by the fact that, while other aspects of the framework's configuration are based in code and provide type safety, file naming conventions provide none of this assistance.

   This also makes it difficult for those looking to move between frameworks since they'd have to learn and memorize a new set of conventions that will likely be similar but not identical.

3. **They force a directory structure on consumers.**

   File system routing conventions dictate a particular way to organize route files. This can be limiting, especially for larger applications where you may prefer to split up your directory structure by team or domain rather than by route.

## Goals

1. Default to a more flexible configuration-based approach that better aligns with React Router's philosophy.
2. Allow for easier iteration on route configuration APIs and conventions without forcing breaking changes on users.
3. Improve scalability, maintainability and legibility of complex routing scenarios.
4. Provide type safety to ensure that routes are defined correctly.
5. Maintain the option for file system routing for those who prefer it.
6. Make it easier for the community to create and adopt alternative routing conventions.
7. Provide a clear migration path for Remix users adopting React Router v7.

## Decisions

### `routes.ts` is mandatory for Vite plugin consumers

Any project using the Vite plugin must have a `routes.ts` file which exports an array of route config objects.

### `routes.ts` is in the `app` directory

There are a few reasons for this:

1. `app` is currently the only directory that is owned by React Router. If it wasn't in the app directory, we'd either need to take ownership of a `routes.ts` file at the root of the project, or introduce another directory that we own, e.g. `config`. In either case, we'd likely want to allow these paths to be configured in the same way the app directory is, adding further complexity. Instead, it's much simpler to keep the configuration in the existing configurable app directory.

2. All route file paths are resolved relative to the app directory, meaning they can also contain a leading `./`. This makes it feel natural at authoring time for these paths to be written within the app directory itself.

3. The route configuration is inherently tied to the app's specific domain rather than build concerns and framework settings. This is reflected in the rate of change within these files since consumers will regularly update their `routes.ts` file as they work on other files within `app`, whereas the rest of the framework configuration remains fairly stable.

### Route config helpers are the preferred way to define route config objects

We don't expect consumers to write the low level route configuration objects by hand. Instead, we expect them to use a set of helpers (`route`, `index` and `layout`) to define routes in a more declarative and type-safe way.

These helpers are scoped to `@react-router/dev/routes` to make it clear which parts of our API are only intended for use within a `routes.ts` context.

### File system routing is supported via a separate package

We're providing a separate `@react-router/fs-routes` package since we want to discourage consumers from thinking of file system routing as being the primary way to define routes.

This package exports a `flatRoutes` function that provides the same functionality as Remix v2's file system routing, meaning it's easy to migrate from Remix to React Router v7 without having to convert everything to config-based routes.

Since this function is asynchronous, the `RouteConfig` type supports promises so you don't need to await the result when exporting from `routes.ts`.

Note that this function is named `flatRoutes` to leave room for other conventions in the future.

### Build context is made available via helper functions

In order to keep the `RouteConfig` type simple, it doesn't provide an interface for accessing build context. Instead, any build context should be provided via helper functions.

As of the creation of this decision document, the only available build context is the app directory path, provided via the `getAppDirectory` helper, since it's required by file system routing implementations. Any future build context values should be made available in the same way.

### Remix's `routes` option has an adapter for easy migration

Some Remix consumers used the `routes` option to define config-based routes or use community file system routing conventions. To ease the migration, the `@react-router/remix-routes-option-adapter` package provides a `remixRoutesOptionAdapter` function that accepts Remix's `routes` config value as an argument.
