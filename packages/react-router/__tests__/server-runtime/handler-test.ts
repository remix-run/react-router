import { createRequestHandler } from "../../lib/server-runtime/server";
import { mockServerBuild } from "./utils";

describe("createRequestHandler", () => {
  it("returns route metadata from request handler instrumentations", async () => {
    let meta: unknown;
    let statusCode: number | undefined;
    let build = mockServerBuild(
      {
        root: {
          default: true,
        },
        "routes/user": {
          parentId: "root",
          path: "users/:id",
          default: true,
          loader: () => null,
        },
      },
      {
        instrumentations: [
          {
            handler({ instrument }) {
              instrument({
                async request(callHandler) {
                  let result = await callHandler();
                  meta = result.meta;
                  statusCode = result.statusCode;
                },
              });
            },
          },
        ],
      },
    );
    let handler = createRequestHandler(build);

    await handler(
      new Request("http://example.com/users/123", {
        signal: new AbortController().signal,
      }),
    );

    expect(meta).toEqual({
      url: "http://example.com/users/123",
      pattern: "users/:id",
      params: { id: "123" },
    });
    expect(statusCode).toBe(200);
  });

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
