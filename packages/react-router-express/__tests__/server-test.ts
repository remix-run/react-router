import { Readable } from "node:stream";
import type { AddressInfo } from "node:net";
import http from "node:http";
import { createReadableStreamFromReadable } from "@react-router/node";
import express from "express";
import { createRequest, createResponse } from "node-mocks-http";
import supertest from "supertest";

let createRemixHeaders: typeof import("../server").createRemixHeaders;
let createRemixRequest: typeof import("../server").createRemixRequest;
let createRequestHandler: typeof import("../server").createRequestHandler;

// We don't want to test that the remix server works here (that's what the
// playwright tests do), we just want to test the express adapter
let mockedCreateRequestHandler = jest.fn() as jest.MockedFunction<
  typeof import("react-router").createRequestHandler
>;

(jest as any).unstable_mockModule("react-router", () => ({
  createRequestHandler: mockedCreateRequestHandler,
}));

beforeAll(async () => {
  ({ createRemixHeaders, createRemixRequest, createRequestHandler } =
    await import("../server"));
});

function createApp() {
  let app = express();

  app.all(
    "*",
    // We don't have a real app to test, but it doesn't matter. We won't ever
    // call through to the real createRequestHandler
    // @ts-expect-error
    createRequestHandler({ build: {} }),
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
      mockedCreateRequestHandler.mockImplementation(() => async (req) => {
        return new Response(`URL: ${new URL(req.url).pathname}`);
      });

      let request = supertest(createApp());
      let res = await request.get("/foo/bar");

      expect(res.status).toBe(200);
      expect(res.text).toBe("URL: /foo/bar");
      expect(res.headers["x-powered-by"]).toBe("Express");
    });

    it("handles root // URLs", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async (req) => {
        return new Response("URL: " + new URL(req.url).pathname);
      });

      let request = supertest(createApp());
      let res = await request.get("//");

      expect(res.status).toBe(200);
      expect(res.text).toBe("URL: //");
    });

    it("handles nested // URLs", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async (req) => {
        return new Response("URL: " + new URL(req.url).pathname);
      });

      let request = supertest(createApp());
      let res = await request.get("//foo//bar");

      expect(res.status).toBe(200);
      expect(res.text).toBe("URL: //foo//bar");
    });

    it("handles null body", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async () => {
        return new Response(null, { status: 200 });
      });

      let request = supertest(createApp());
      let res = await request.get("/");

      expect(res.status).toBe(200);
    });

    // https://github.com/node-fetch/node-fetch/blob/4ae35388b078bddda238277142bf091898ce6fda/test/response.js#L142-L148
    it("handles body as stream", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async () => {
        let readable = Readable.from("hello world");
        let stream = createReadableStreamFromReadable(readable);
        return new Response(stream, { status: 200 });
      });

      let request = supertest(createApp());
      let res = await request.get("/");
      expect(res.status).toBe(200);
      expect(res.text).toBe("hello world");
    });

    it("handles status codes", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async () => {
        return new Response(null, { status: 204 });
      });

      let request = supertest(createApp());
      let res = await request.get("/");

      expect(res.status).toBe(204);
    });

    it("sets headers", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async () => {
        let headers = new Headers({ "X-Time-Of-Year": "most wonderful" });
        headers.append(
          "Set-Cookie",
          "first=one; Expires=0; Path=/; HttpOnly; Secure; SameSite=Lax",
        );
        headers.append(
          "Set-Cookie",
          "second=two; MaxAge=1209600; Path=/; HttpOnly; Secure; SameSite=Lax",
        );
        headers.append(
          "Set-Cookie",
          "third=three; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax",
        );
        return new Response(null, { headers });
      });

      let request = supertest(createApp());
      let res = await request.get("/");

      expect(res.headers["x-time-of-year"]).toBe("most wonderful");
      expect(res.headers["set-cookie"]).toEqual([
        "first=one; Expires=0; Path=/; HttpOnly; Secure; SameSite=Lax",
        "second=two; MaxAge=1209600; Path=/; HttpOnly; Secure; SameSite=Lax",
        "third=three; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax",
      ]);
    });

    it("ignores response writes after the client disconnects", async () => {
      let server: http.Server | undefined;
      let errors: unknown[] = [];
      let closeServerTimeout: ReturnType<typeof setTimeout> | undefined;
      let handlerStarted!: () => void;
      let handlerStartedPromise = new Promise<void>((resolve) => {
        handlerStarted = resolve;
      });

      mockedCreateRequestHandler.mockImplementation(() => async (req) => {
        handlerStarted();

        await new Promise<void>((resolve) => {
          req.signal.addEventListener("abort", () => resolve(), {
            once: true,
          });
        });

        let readable = Readable.from("hello world");
        let stream = createReadableStreamFromReadable(readable);
        closeServerTimeout = setTimeout(() => server?.close(), 25);
        return new Response(stream, { status: 200 });
      });

      let app = createApp();
      app.use(
        (
          error: unknown,
          _req: express.Request,
          _res: express.Response,
          _next: express.NextFunction,
        ) => {
          errors.push(error);
          server?.close();
        },
      );

      await new Promise<void>((resolve) => {
        server = app.listen(0, "127.0.0.1", () => resolve());
      });

      let { port } = server.address() as AddressInfo;
      let request = http.get({
        host: "127.0.0.1",
        port,
        path: "/",
      });

      request.on("error", () => {});
      await handlerStartedPromise;
      request.destroy();

      await new Promise<void>((resolve, reject) => {
        server!.on("close", () => resolve());
        setTimeout(
          () => reject(new Error("Timed out waiting for server to close")),
          1000,
        );
      });

      clearTimeout(closeServerTimeout);
      expect(errors).toEqual([]);
    });
  });
});

describe("express createRemixHeaders", () => {
  describe("creates fetch headers from express headers", () => {
    it("handles empty headers", () => {
      let headers = createRemixHeaders({});
      expect(Object.fromEntries(headers.entries())).toMatchInlineSnapshot(`{}`);
    });

    it("handles simple headers", () => {
      let headers = createRemixHeaders({ "x-foo": "bar" });
      expect(headers.get("x-foo")).toBe("bar");
    });

    it("handles multiple headers", () => {
      let headers = createRemixHeaders({ "x-foo": "bar", "x-bar": "baz" });
      expect(headers.get("x-foo")).toBe("bar");
      expect(headers.get("x-bar")).toBe("baz");
    });

    it("handles headers with multiple values", () => {
      let headers = createRemixHeaders({
        "x-foo": ["bar", "baz"],
        "x-bar": "baz",
      });
      expect(headers.get("x-foo")).toEqual("bar, baz");
      expect(headers.get("x-bar")).toBe("baz");
    });

    it("handles multiple set-cookie headers", () => {
      let headers = createRemixHeaders({
        "set-cookie": [
          "__session=some_value; Path=/; Secure; HttpOnly; MaxAge=7200; SameSite=Lax",
          "__other=some_other_value; Path=/; Secure; HttpOnly; Expires=Wed, 21 Oct 2015 07:28:00 GMT; SameSite=Lax",
        ],
      });
      expect(headers.getSetCookie()).toEqual([
        "__session=some_value; Path=/; Secure; HttpOnly; MaxAge=7200; SameSite=Lax",
        "__other=some_other_value; Path=/; Secure; HttpOnly; Expires=Wed, 21 Oct 2015 07:28:00 GMT; SameSite=Lax",
      ]);
    });
  });
});

describe("express createRemixRequest", () => {
  it("creates a request with the correct headers", async () => {
    let expressRequest = createRequest({
      url: "/foo/bar",
      method: "GET",
      protocol: "http",
      hostname: "localhost",
      headers: {
        "Cache-Control": "max-age=300, s-maxage=3600",
        Host: "localhost:3000",
      },
    });
    let expressResponse = createResponse();

    let remixRequest = createRemixRequest(expressRequest, expressResponse);

    expect(remixRequest.method).toBe("GET");
    expect(remixRequest.headers.get("cache-control")).toBe(
      "max-age=300, s-maxage=3600",
    );
    expect(remixRequest.headers.get("host")).toBe("localhost:3000");
  });

  it("validates parsed port", async () => {
    let expressRequest = createRequest({
      url: "/foo/bar",
      method: "GET",
      protocol: "http",
      hostname: "localhost",
      headers: {
        "Cache-Control": "max-age=300, s-maxage=3600",
        Host: "localhost:3000",
        "x-forwarded-host": ":/spoofed",
      },
    });
    let expressResponse = createResponse();

    let remixRequest = createRemixRequest(expressRequest, expressResponse);

    expect(remixRequest.method).toBe("GET");
    expect(remixRequest.headers.get("cache-control")).toBe(
      "max-age=300, s-maxage=3600",
    );
    expect(remixRequest.headers.get("host")).toBe("localhost:3000");
    expect(remixRequest.url).toBe("http://localhost:3000/foo/bar");
  });

  it("does not use x-forwarded-host port unless trust proxy is enabled", async () => {
    let expressRequest = createRequest({
      url: "/foo/bar",
      method: "GET",
      protocol: "http",
      hostname: "localhost",
      headers: {
        Host: "localhost:3000",
        "x-forwarded-host": "example.com:8443",
      },
    });
    let expressResponse = createResponse();

    let remixRequest = createRemixRequest(expressRequest, expressResponse);

    expect(remixRequest.url).toBe("http://localhost:3000/foo/bar");
  });

  it("uses x-forwarded-host port when trust proxy is enabled", async () => {
    let app = express();
    app.set("trust proxy", true);
    let expressRequest = createRequest({
      app,
      url: "/foo/bar",
      method: "GET",
      protocol: "http",
      hostname: "example.com",
      headers: {
        Host: "localhost:3000",
        "x-forwarded-host": "example.com:8443",
      },
    });
    let expressResponse = createResponse();

    let remixRequest = createRemixRequest(expressRequest, expressResponse);

    expect(remixRequest.url).toBe("http://example.com:8443/foo/bar");
  });

  it("ignores invalid characters in host values", async () => {
    let expressRequest = createRequest({
      url: "/foo/bar",
      method: "GET",
      protocol: "http",
      hostname: "localhost/invalid",
      headers: {
        Host: "localhost:3000",
      },
    });
    let expressResponse = createResponse();

    let remixRequest = createRemixRequest(expressRequest, expressResponse);

    expect(remixRequest.url).toBe("http://localhost:3000/foo/bar");
  });

  it("falls back for invalid host values", async () => {
    let expressRequest = createRequest({
      url: "/foo/bar",
      method: "GET",
      protocol: "http",
      hostname: "/invalid",
      headers: {
        Host: "localhost:3000",
      },
    });
    let expressResponse = createResponse();

    let remixRequest = createRemixRequest(expressRequest, expressResponse);

    expect(remixRequest.url).toBe("http://localhost:3000/foo/bar");
  });
});
