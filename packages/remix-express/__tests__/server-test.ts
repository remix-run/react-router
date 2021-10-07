import express from "express";
import supertest from "supertest";
import { createRequest } from "node-mocks-http";
import { createRequestHandler as createRemixRequestHandler } from "@remix-run/server-runtime";

import {
  createRemixHeaders,
  createRemixRequest,
  createRequestHandler
} from "../server";


// We don't want to test that the remix server works here (that's what the
// puppetteer tests do), we just want to test the express adapter
jest.mock("@remix-run/server-runtime/server");
let mockedCreateRequestHandler = createRemixRequestHandler as jest.MockedFunction<
  typeof createRemixRequestHandler
>;

function createApp() {
  let app = express();

  app.all(
    "*",
    createRequestHandler({
      // We don't have a real app to test, but it doesn't matter. We
      // won't ever call through to the real createRequestHandler
      build: undefined
    })
  );

  return app;
}

describe("express createRequestHandler", () => {
  describe("basic requests", () => {
    afterEach(() => {
      mockedCreateRequestHandler.mockReset();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it("handles requests", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async req => {
        return new Response(`URL: ${new URL(req.url).pathname}`);
      });

      let request = supertest(createApp());
      let res = await request.get("/foo/bar");

      expect(res.status).toBe(200);
      expect(res.text).toBe("URL: /foo/bar");
      expect(res.headers["x-powered-by"]).toBe("Express");
    });

    it("handles null body", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async () => {
        return new Response(null, { status: 200 });
      });

      let request = supertest(createApp());
      let res = await request.get("/");

      expect(res.status).toBe(200);
    });

    it("handles status codes", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async () => {
        return new Response("", { status: 204 });
      });

      let request = supertest(createApp());
      let res = await request.get("/");

      expect(res.status).toBe(204);
    });

    it("sets headers", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async () => {
        const headers = new Headers({ "X-Time-Of-Year": "most wonderful" });
        headers.append(
          "Set-Cookie",
          "first=one; Expires=0; Path=/; HttpOnly; Secure; SameSite=Lax"
        );
        headers.append(
          "Set-Cookie",
          "second=two; MaxAge=1209600; Path=/; HttpOnly; Secure; SameSite=Lax"
        );
        headers.append(
          "Set-Cookie",
          "third=three; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax"
        );
        return new Response("", { headers });
      });

      let request = supertest(createApp());
      let res = await request.get("/");

      expect(res.headers["x-time-of-year"]).toBe("most wonderful");
      expect(res.headers["set-cookie"]).toEqual([
        "first=one; Expires=0; Path=/; HttpOnly; Secure; SameSite=Lax",
        "second=two; MaxAge=1209600; Path=/; HttpOnly; Secure; SameSite=Lax",
        "third=three; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax"
      ]);
    });
  });
});

describe("express createRemixHeaders", () => {
  describe("creates fetch headers from express headers", () => {
    it("handles empty headers", () => {
      expect(createRemixHeaders({})).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {},
        }
      `);
    });

    it("handles simple headers", () => {
      expect(createRemixHeaders({ "x-foo": "bar" })).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-foo": Array [
              "bar",
            ],
          },
        }
      `);
    });

    it("handles multiple headers", () => {
      expect(createRemixHeaders({ "x-foo": "bar", "x-bar": "baz" }))
        .toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-bar": Array [
              "baz",
            ],
            "x-foo": Array [
              "bar",
            ],
          },
        }
      `);
    });

    it("handles headers with multiple values", () => {
      expect(createRemixHeaders({ "x-foo": "bar, baz" }))
        .toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-foo": Array [
              "bar, baz",
            ],
          },
        }
      `);
    });

    it("handles headers with multiple values and multiple headers", () => {
      expect(createRemixHeaders({ "x-foo": "bar, baz", "x-bar": "baz" }))
        .toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-bar": Array [
              "baz",
            ],
            "x-foo": Array [
              "bar, baz",
            ],
          },
        }
      `);
    });

    it("handles multiple set-cookie headers", () => {
      expect(
        createRemixHeaders({
          "set-cookie": [
            "__session=some_value; Path=/; Secure; HttpOnly; MaxAge=7200; SameSite=Lax",
            "__other=some_other_value; Path=/; Secure; HttpOnly; MaxAge=3600; SameSite=Lax"
          ]
        })
      ).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "set-cookie": Array [
              "__session=some_value; Path=/; Secure; HttpOnly; MaxAge=7200; SameSite=Lax",
              "__other=some_other_value; Path=/; Secure; HttpOnly; MaxAge=3600; SameSite=Lax",
            ],
          },
        }
      `);
    });
  });
});

describe("express createRemixRequest", () => {
  it("creates a request with the correct headers", async () => {
    const expressRequest = createRequest({
      url: "/foo/bar",
      method: "GET",
      protocol: "http",
      hostname: "localhost",
      headers: {
        "Cache-Control": "max-age=300, s-maxage=3600",
        Host: "localhost:3000"
      }
    });

    expect(createRemixRequest(expressRequest)).toMatchInlineSnapshot(`
      Request {
        "agent": undefined,
        "compress": true,
        "counter": 0,
        "follow": 20,
        "size": 0,
        "timeout": 0,
        Symbol(Body internals): Object {
          "body": null,
          "disturbed": false,
          "error": null,
        },
        Symbol(Request internals): Object {
          "headers": Headers {
            Symbol(map): Object {
              "cache-control": Array [
                "max-age=300, s-maxage=3600",
              ],
              "host": Array [
                "localhost:3000",
              ],
            },
          },
          "method": "GET",
          "parsedURL": Url {
            "auth": null,
            "hash": null,
            "host": "localhost:3000",
            "hostname": "localhost",
            "href": "http://localhost:3000/foo/bar",
            "path": "/foo/bar",
            "pathname": "/foo/bar",
            "port": "3000",
            "protocol": "http:",
            "query": null,
            "search": null,
            "slashes": true,
          },
          "redirect": "follow",
          "signal": null,
        },
      }
    `);
  });
});
