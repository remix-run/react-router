/**
 * Benchmark: passThroughRequests flag
 *
 * Measures the overhead of creating new Request objects on each server handler
 * invocation (default behavior) vs passing the original request through.
 *
 * Tests three request types:
 *   1. Document requests (GET /)
 *   2. Single-fetch loader requests (GET /_root.data)
 *   3. Single-fetch action requests (POST /_root.data)
 *
 * Usage: pnpm vitest bench scripts/bench/passthrough-requests.mjs
 */

import { bench, describe } from "vitest";
import { createRequestHandler } from "react-router";

// ---------------------------------------------------------------------------
// Minimal server build factory
// ---------------------------------------------------------------------------

function mockServerBuild(future = {}) {
  const routeId = "root";

  return {
    ssr: true,
    future,
    prerender: [],
    isSpaMode: false,
    routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" },
    assetsBuildDirectory: "",
    publicPath: "",
    assets: {
      entry: { imports: [""], module: "" },
      routes: {
        [routeId]: {
          hasAction: true,
          hasErrorBoundary: false,
          hasLoader: true,
          hasClientAction: false,
          hasClientLoader: false,
          hasClientMiddleware: false,
          clientActionModule: undefined,
          clientLoaderModule: undefined,
          clientMiddlewareModule: undefined,
          hydrateFallbackModule: undefined,
          id: routeId,
          module: "",
          index: undefined,
          path: "",
          parentId: undefined,
        },
      },
      url: "",
      version: "v1",
    },
    entry: {
      module: {
        default: async (_request, statusCode, headers) =>
          new Response(null, { status: statusCode, headers }),
        handleDataRequest: async (response) => response,
      },
    },
    routes: {
      [routeId]: {
        id: routeId,
        index: undefined,
        path: "",
        parentId: undefined,
        module: {
          default: () => null,
          ErrorBoundary: undefined,
          action: () => new Response("action"),
          loader: () => new Response("loader"),
          middleware: undefined,
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

const handlerDefault = createRequestHandler(
  mockServerBuild({ v8_passThroughRequests: false }),
  "production",
);

const handlerPassThrough = createRequestHandler(
  mockServerBuild({ v8_passThroughRequests: true }),
  "production",
);

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

describe("GET / (document request)", () => {
  bench("passThroughRequests: false", async () => {
    await handlerDefault(new Request("http://localhost:3000/"));
  });

  bench("passThroughRequests: true", async () => {
    await handlerPassThrough(new Request("http://localhost:3000/"));
  });
});

describe("GET /_root.data (single-fetch loaders)", () => {
  bench("passThroughRequests: false", async () => {
    await handlerDefault(new Request("http://localhost:3000/_root.data"));
  });

  bench("passThroughRequests: true", async () => {
    await handlerPassThrough(new Request("http://localhost:3000/_root.data"));
  });
});

describe("POST /_root.data (single-fetch action)", () => {
  bench("passThroughRequests: false", async () => {
    await handlerDefault(
      new Request("http://localhost:3000/_root.data", { method: "POST" }),
    );
  });

  bench("passThroughRequests: true", async () => {
    await handlerPassThrough(
      new Request("http://localhost:3000/_root.data", { method: "POST" }),
    );
  });
});
