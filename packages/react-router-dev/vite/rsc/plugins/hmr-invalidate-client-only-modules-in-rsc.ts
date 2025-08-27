import type * as Vite from "vite";

export function hmrInvalidateClientOnlyModulesInRsc(): Vite.Plugin {
  return {
    name: "react-router/rsc/hmr/invalidate-client-only-modules-in-rsc",
    async hotUpdate(ctx) {
      // We only want to invalidate ancestors of client-only modules in the RSC
      // graph, so bail out if we're not in the RSC environment
      if (this.environment.name !== "rsc") {
        return;
      }

      const updatedServerModule = this.environment.moduleGraph.getModuleById(
        ctx.file,
      );

      // If this file is in the RSC graph, it's not a client-only module and
      // changes will already be picked up, so bail out
      if (updatedServerModule) {
        return;
      }

      // Find the corresponding client module for this file so we can walk the
      // module graph
      const updatedClientModule =
        ctx.server.environments.client.moduleGraph.getModuleById(ctx.file);

      // If this file is not in the client graph, it's not a client-only module
      // and we don't need to invalidate anything, so bail out
      if (!updatedClientModule) {
        return;
      }

      const visited = new Set<Vite.EnvironmentModuleNode>();
      const walk = (module: Vite.EnvironmentModuleNode) => {
        if (!module || visited.has(module) || !module.id) {
          return;
        }

        visited.add(module);

        // If this module is in the RSC graph, invalidate it and stop walking
        const serverModule = this.environment.moduleGraph.getModuleById(
          module.id,
        );
        if (serverModule) {
          this.environment.moduleGraph.invalidateModule(serverModule);
          return;
        }

        if (module.importers) {
          for (const importer of module.importers) {
            walk(importer);
          }
        }
      };

      walk(updatedClientModule);
    },
  };
}
