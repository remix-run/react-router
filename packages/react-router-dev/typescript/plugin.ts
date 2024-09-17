import type ts from "typescript/lib/tsserverlibrary";

export default function init(modules: { typescript: typeof ts }) {
  function create(info: ts.server.PluginCreateInfo) {
    const { logger } = info.project.projectService;
    logger.info("[react-router] setup");
    return info.languageService;
  }
  return { create };
}
