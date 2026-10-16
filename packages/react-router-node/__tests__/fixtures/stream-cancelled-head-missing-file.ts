import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ServerBuild } from "react-router";
import { createRequestHandler } from "react-router";

import { createReadableStreamFromReadable } from "../../stream.ts";

let missingFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "does-not-exist.txt",
);

let build = {
  ssr: true,
  future: {},
  prerender: [],
  isSpaMode: false,
  routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" },
  assetsBuildDirectory: "",
  publicPath: "",
  assets: {
    entry: { imports: [], module: "" },
    routes: {
      file: {
        id: "file",
        path: "/file",
        module: "",
        hasAction: false,
        hasLoader: true,
        hasClientAction: false,
        hasClientLoader: false,
        hasClientMiddleware: false,
        hasErrorBoundary: false,
      },
    },
    url: "",
    version: "",
  },
  entry: {
    module: {
      default: () => new Response(null, { status: 500 }),
    },
  },
  routes: {
    file: {
      id: "file",
      path: "/file",
      module: {
        // A resource route streaming a file that fails to open
        loader: () =>
          new Response(
            createReadableStreamFromReadable(createReadStream(missingFile)),
          ),
      },
    },
  },
} as unknown as ServerBuild;

let handler = createRequestHandler(build, "production");
let response = await handler(
  new Request("http://localhost/file", { method: "HEAD" }),
);

if (response.body !== null) {
  throw new Error("Expected a HEAD response without a body");
}

// Let the file open fail after the body was cancelled
await new Promise((resolve) => setTimeout(resolve, 50));
console.log("process survived");
