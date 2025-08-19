import { createRequestHandler } from "../../lib/server-runtime/server";
import { mockServerBuild } from "./utils";

describe("createRequestHandler", () => {
  it("retains request headers when stripping body off for loaders", async () => {
    let build = mockServerBuild({
      root: {
        path: "/test",
        loader: ({ request }) => Response.json(request.headers.get("X-Foo")),
      },
    });
    let handler = createRequestHandler(build);

    let response = await handler(
      new Request("http://.../test", {
        headers: {
          "X-Foo": "bar",
        },
        signal: new AbortController().signal,
      }),
    );

    expect(await response.json()).toBe("bar");
  });
});
