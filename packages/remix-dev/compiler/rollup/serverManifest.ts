import path from "path";
import type { OutputBundle, Plugin } from "rollup";

import invariant from "../../invariant";
import { getBundleHash } from "../crypto";
import type { RemixConfig } from "./remixConfig";
import { getRemixConfig } from "./remixConfig";

/**
 * Generates a server module that loads all build artifacts.
 */
export default function serverManifestPlugin({
  fileName = "index.js"
}: {
  fileName?: string;
} = {}): Plugin {
  let config: RemixConfig;

  return {
    name: "serverManifest",

    async buildStart({ plugins }) {
      config = await getRemixConfig(plugins);
    },

    async generateBundle(_options, bundle) {
      let manifest = getServerManifest(bundle, config.routes);
      let source = getCommonjsModule(manifest);
      this.emitFile({ type: "asset", fileName, source });
    }
  };
}

interface ServerManifest {
  version: string;
  assets: {
    moduleId: string;
  };
  entry: {
    moduleId: string;
  };
  routes: {
    [routeId: string]: {
      id: string;
      parentId?: string;
      path: string;
      caseSensitive?: boolean;
      moduleId: string;
    };
  };
}

function getServerManifest(
  bundle: OutputBundle,
  routeManifest: RemixConfig["routes"]
): ServerManifest {
  let version = getBundleHash(bundle).slice(0, 8);

  let relModuleIdPrefix = "." + path.sep;
  let assets = {
    moduleId: relModuleIdPrefix + "assets.json"
  };

  let routeIds = Object.keys(routeManifest);
  let entry: ServerManifest["entry"] | undefined;
  let routes: ServerManifest["routes"] = Object.create(null);

  for (let key in bundle) {
    let chunk = bundle[key];

    if (chunk.type === "chunk") {
      if (chunk.name === "entry.server") {
        entry = {
          moduleId: relModuleIdPrefix + chunk.fileName
        };
      } else if (routeIds.includes(chunk.name)) {
        let route = routeManifest[chunk.name];

        routes[chunk.name] = {
          id: route.id,
          parentId: route.parentId,
          path: route.path,
          caseSensitive: route.caseSensitive,
          moduleId: relModuleIdPrefix + chunk.fileName
        };
      }
    }
  }

  invariant(entry, `Missing entry.server chunk`);

  return { version, assets, entry, routes };
}

function getCommonjsModule(manifest: ServerManifest): string {
  return (
    `module.exports = {
  "version": ${JSON.stringify(manifest.version)},
  "assets": require(${JSON.stringify(manifest.assets.moduleId)}),
  "entry": {
    "module": require(${JSON.stringify(manifest.entry.moduleId)})
  },
  "routes": {
    ` +
    Object.keys(manifest.routes)
      .map(key => {
        let route = manifest.routes[key];
        return `${JSON.stringify(route.id)}: {
      "id": ${JSON.stringify(route.id)},
      "parentId": ${JSON.stringify(route.parentId)},
      "path": ${JSON.stringify(route.path)},
      "caseSensitive": ${JSON.stringify(route.caseSensitive)},
      "module": require(${JSON.stringify(route.moduleId)})
    }`;
      })
      .join(",\n    ") +
    `
  }
}`
  );
}
