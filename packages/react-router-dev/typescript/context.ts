import type ts from "typescript/lib/tsserverlibrary";
import type { RouteManifest } from "../config/routes";

export type Context = {
  config: {
    rootDirectory: string;
    appDirectory: string;
  };
  routes: RouteManifest;
  languageService: ts.LanguageService;
  languageServiceHost: ts.LanguageServiceHost;
  ts: typeof ts;
  logger?: {
    info: (message: string) => void;
  };
};
