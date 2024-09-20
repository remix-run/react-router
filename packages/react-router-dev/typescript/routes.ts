import Path from "pathe";
import Pathe from "pathe/utils";

import type ts from "typescript/lib/tsserverlibrary";

import type { Context } from "./context";
import type { RouteManifestEntry } from "../config/routes";

function noext(path: string) {
  return Path.join(Path.dirname(path), Pathe.filename(path));
}

export function get(
  ctx: Context,
  fileName: string
): RouteManifestEntry | undefined {
  const routeId = noext(Path.relative(ctx.config.appDirectory, fileName));
  ctx.logger?.info(
    `Route.get filename:${fileName} routeId:${routeId} routes:${JSON.stringify(
      ctx.routes
    )}`
  );
  return ctx.routes[routeId];
}

type RouteExportInfo = {
  annotateReturnType: boolean;
  documentation: ts.SymbolDisplayPart[];
};

export const exports: Record<string, RouteExportInfo> = {
  links: {
    annotateReturnType: true,
    documentation: createDocumentation({
      name: "links",
      link: `https://remix.run/docs/en/main/route/links`,
    }),
  },
  loader: {
    annotateReturnType: false,
    documentation: createDocumentation({
      name: "serverLoader",
      link: `https://remix.run/docs/en/main/route/loader`,
    }),
  },
  clientLoader: {
    annotateReturnType: false,
    documentation: createDocumentation({
      name: "clientLoader",
      link: `https://remix.run/docs/en/main/route/client-loader`,
    }),
  },
  // TODO clientLoader.hydrate?
  HydrateFallback: {
    annotateReturnType: true,
    documentation: createDocumentation({
      name: "HydrateFallback",
      link: `https://remix.run/docs/en/main/route/hydrate-fallback`,
    }),
  },
  action: {
    annotateReturnType: false,
    documentation: createDocumentation({
      name: "serverAction",
      link: `https://remix.run/docs/en/main/route/action`,
    }),
  },
  clientAction: {
    annotateReturnType: false,
    documentation: createDocumentation({
      name: "clientAction",
      link: `https://remix.run/docs/en/main/route/client-action`,
    }),
  },
  default: {
    annotateReturnType: true,
    documentation: createDocumentation({
      name: "default",
      link: `https://remix.run/docs/en/main/route/component`,
    }),
  },
  ErrorBoundary: {
    annotateReturnType: true,
    documentation: createDocumentation({
      name: "ErrorBoundary",
      link: `https://remix.run/docs/en/main/route/error-boundary`,
    }),
  },
  // TODO handle
  // TODO meta
  // TODO shouldRevalidate
};

function createDocumentation(args: {
  name: string;
  link: string;
}): ts.SymbolDisplayPart[] {
  return [
    {
      kind: "text",
      text: `React Router \`${args.name}\` export\n\nDocs: ${args.link}`,
    },
  ];
}
