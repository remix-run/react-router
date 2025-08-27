import type * as Vite from "vite";

export function hmrInvalidateClientOnlyModulesInRsc(): Vite.Plugin {
  return {
    name: "react-router/rsc/hmr/invalidate-client-only-modules-in-rsc",
    hotUpdate(ctx) {
      // We only want to invalidate ancestors of client-only modules in the RSC
      // graph, so bail out if we're not in the RSC environment
      if (this.environment.name !== "rsc") {
        return;
      }

      const updatedServerModules =
        this.environment.moduleGraph.getModulesByFile(ctx.file);

      // If this file is in the RSC graph, it's not a client-only module and
      // changes will already be picked up, so bail out
      if (updatedServerModules && updatedServerModules.size > 0) {
        return;
      }

      // Find the corresponding client modules for this file so we can walk the
      // module graph looking for ancestors in the RSC graph
      const updatedClientModules =
        ctx.server.environments.client.moduleGraph.getModulesByFile(ctx.file);
      if (!updatedClientModules) {
        return;
      }

      for (const updatedClientModule of updatedClientModules) {
        const visited = new Set<Vite.EnvironmentModuleNode>();
        const walk = (module: Vite.EnvironmentModuleNode) => {
          if (visited.has(module) || !module.id) {
            return;
          }

          visited.add(module);

          // Try to find this module in the RSC graph
          const serverModule = this.environment.moduleGraph.getModuleById(
            module.id,
          );

          // If this module is in the RSC graph, invalidate it and stop walking
          if (serverModule) {
            this.environment.moduleGraph.invalidateModule(serverModule);
            return;
          }

          // If we haven't found a corresponding RSC module, walk importers
          if (module.importers) {
            for (const importer of module.importers) {
              walk(importer);
            }
          }
        };

        walk(updatedClientModule);
      }
    },
  };
}
