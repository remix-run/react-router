import { decodeViaTurboStream } from "../../lib/dom/ssr/single-fetch";
import { createRequestHandler } from "../../lib/server-runtime/server";
import { mockServerBuild } from "./utils";

describe("loaders", () => {
  it("passes the raw request through with .data suffix, and a normalized url", async () => {
    let loader = async ({ request, url }) => {
      return {
        requestPath: new URL(request.url).pathname,
        urlPath: url.pathname,
      };
    };

    let routeId = "routes/random";
    let build = mockServerBuild({
      [routeId]: {
        path: "/random",
        default: {},
        loader,
      },
    });

    let handler = createRequestHandler(build);

    let request = new Request("http://example.com/random.data", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    let res = await handler(request);
    if (!res.body) throw new Error("No body");
    const decoded = await decodeViaTurboStream(res.body, global);
    expect((decoded.value as any)[routeId].data).toEqual({
      requestPath: "/random.data",
      urlPath: "/random",
    });
  });
});
