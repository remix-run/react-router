import path from "path";
import type { Plugin } from "rollup";

import type { RemixConfig } from "../../config";
import { readConfig } from "../../config";
import invariant from "../../invariant";
import { purgeModuleCache } from "../../modules";

export type { RemixConfig };

export default function remixConfigPlugin({
  rootDir
}: {
  rootDir: string;
}): Plugin {
  let configPromise: Promise<RemixConfig> | null = null;

  return {
    name: "remixConfig",

    options(options) {
      configPromise = null;
      return options;
    },

    buildStart() {
      this.addWatchFile(path.join(rootDir, "remix.config.js"));
    },

    api: {
      getConfig(): Promise<RemixConfig> {
        if (!configPromise) {
          // Purge the cache in case remix.config.js loads any other files.
          purgeModuleCache(rootDir);
          configPromise = readConfig(rootDir);
        }

        return configPromise;
      }
    }
  };
}

export function findConfigPlugin(plugins?: Plugin[]): Plugin | undefined {
  return plugins && plugins.find(plugin => plugin.name === "remixConfig");
}

export function getRemixConfig(plugins?: Plugin[]): Promise<RemixConfig> {
  let plugin = findConfigPlugin(plugins);
  invariant(plugin, `Missing remixConfig plugin`);
  return plugin.api.getConfig();
}
