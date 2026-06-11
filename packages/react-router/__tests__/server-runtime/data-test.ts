import { decodeViaTurboStream } from "../../lib/dom/ssr/single-fetch";
import {
  ErrorResponseImpl,
  isRouteErrorResponse,
} from "../../lib/router/utils";
import { createRequestHandler } from "../../lib/server-runtime/server";
import { encodeViaTurboStream } from "../../lib/server-runtime/single-fetch";
import { ServerMode } from "../../lib/server-runtime/mode";
import { mockServerBuild } from "./utils";

describe("loaders", () => {
  // so that HTML/Fetch requests are the same, and so redirects don't hang on to
  // this param for no reason
  it("removes .data from request.url", async () => {
    let loader = async ({ request }) => {
      return new URL(request.url).pathname;
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
    expect((decoded.value as any)[routeId].data).toEqual("/random");
  });
});

describe("turbo-stream error decoding", () => {
  it("decodes ErrorResponse instances", async () => {
    let body = encodeViaTurboStream(
      {
        errors: {
          root: new ErrorResponseImpl(404, "Not Found", "Missing", true),
        },
      },
      new AbortController().signal,
      undefined,
      ServerMode.Development,
    );

    let decoded = await decodeViaTurboStream(body, global);
    let error = (decoded.value as any).errors.root;

    expect(isRouteErrorResponse(error)).toBe(true);
    expect(error.status).toBe(404);
    expect(error.statusText).toBe("Not Found");
    expect(error.data).toBe("Missing");
    expect(error.internal).toBe(false);
  });
});
