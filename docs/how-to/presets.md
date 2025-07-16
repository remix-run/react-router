---
title: Presets
---

# Presets

[MODES: framework]

<br/>
<br/>

The [React Router config][react-router-config] supports a `presets` option to ease integration with other tools and hosting providers.

[Presets][preset-type] can only do two things:

- Configure React Router config options on your behalf
- Validate the resolved config

The config returned by each preset is merged in the order the presets were defined. Any config directly specified in your React Router config will be merged last. This means that your config will always take precedence over any presets.

## Defining preset config

As a basic example, let's create a preset that configures a [server bundles function][server-bundles]:

```ts filename=my-cool-preset.ts
import type { Preset } from "@react-router/dev/config";

export function myCoolPreset(): Preset {
  return {
    name: "my-cool-preset",
    reactRouterConfig: () => ({
      serverBundles: ({ branch }) => {
        const isAuthenticatedRoute = branch.some((route) =>
          route.id.split("/").includes("_authenticated"),
        );

        return isAuthenticatedRoute
          ? "authenticated"
          : "unauthenticated";
      },
    }),
  };
}
```

## Validating config

Keep in mind that other presets and user config can still override the values returned from your preset.

In our example preset, the `serverBundles` function could be overridden with a different, conflicting implementation. If we want to validate that the final resolved config contains the `serverBundles` function from our preset, we can use the `reactRouterConfigResolved` hook:

```ts filename=my-cool-preset.ts lines=[22-27]
import type {
  Preset,
  ServerBundlesFunction,
} from "@react-router/dev/config";

const serverBundles: ServerBundlesFunction = ({
  branch,
}) => {
  const isAuthenticatedRoute = branch.some((route) =>
    route.id.split("/").includes("_authenticated"),
  );

  return isAuthenticatedRoute
    ? "authenticated"
    : "unauthenticated";
};

export function myCoolPreset(): Preset {
  return {
    name: "my-cool-preset",
    reactRouterConfig: () => ({ serverBundles }),
    reactRouterConfigResolved: ({ reactRouterConfig }) => {
      if (
        reactRouterConfig.serverBundles !== serverBundles
      ) {
        throw new Error("`serverBundles` was overridden!");
      }
    },
  };
}
```

The `reactRouterConfigResolved` hook should only be used when it would be an error to merge or override your preset's config.

## Using a preset

Presets are designed to be published to npm and used within your React Router config.

```ts filename=react-router.config.ts lines=[6]
import type { Config } from "@react-router/dev/config";
import { myCoolPreset } from "react-router-preset-cool";

export default {
  // ...
  presets: [myCoolPreset()],
} satisfies Config;
```

[react-router-config]: https://api.reactrouter.com/v7/types/_react_router_dev.config.Config.html
[preset-type]: https://api.reactrouter.com/v7/types/_react_router_dev.config.Preset.html
[server-bundles]: ./server-bundles
