// For compatibility with the TS language service plugin API, this entrypoint:
// - MUST only export the typescript plugin as its default export
// - MUST be compiled to CJS
// - MUST be listed as `main` in `package.json`

import type ts from "typescript/lib/tsserverlibrary";
import * as Path from "pathe";

import * as Typegen from "./typegen";

export default function init(modules: { typescript: typeof ts }) {
  function create(info: ts.server.PluginCreateInfo) {
    const { logger } = info.project.projectService;
    logger.info("[react-router] setup");

    const rootDirectory = Path.normalize(info.project.getCurrentDirectory());
    Typegen.watch({
      rootDirectory,
      appDirectory: Path.join(rootDirectory, "app"),
    });

    return info.languageService;
  }
  return { create };
}
