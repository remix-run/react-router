import fsp from "node:fs/promises";
import path from "node:path";
import { createRequestHandler as createReactRequestHandler } from "react-router";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import lambdaTester from "lambda-tester";

import {
  createRequestHandler,
  createReactRouterHeaders,
  createReactRouterRequest,
  sendReactRouterResponse,
} from "../server";

// We don't want to test that the React Router server works here,
// we just want to test the architect adapter
jest.mock("react-router", () => {
  let original = jest.requireActual("react-router");
  return {
    ...original,
    createRequestHandler: jest.fn(),
  };
});
let mockedCreateRequestHandler =
  createReactRequestHandler as jest.MockedFunction<
    typeof createReactRequestHandler
  >;

function createMockEvent(event: Partial<APIGatewayProxyEventV2> = {}) {
  let now = new Date();
  return {
    headers: {
      host: "localhost:3333",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
      "accept-language": "en-US,en;q=0.9",
      "accept-encoding": "gzip, deflate",
      ...event.headers,
    },
    isBase64Encoded: false,
    rawPath: "/",
    rawQueryString: "",
    requestContext: {
      http: {
        method: "GET",
        path: "/",
        protocol: "HTTP/1.1",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
        sourceIp: "127.0.0.1",
        ...event.requestContext?.http,
      },
      routeKey: "ANY /{proxy+}",
      accountId: "accountId",
      requestId: "requestId",
      apiId: "apiId",
      domainName: "id.execute-api.us-east-1.amazonaws.com",
      domainPrefix: "id",
      stage: "test",
      time: now.toISOString(),
      timeEpoch: now.getTime(),
      ...event.requestContext,
    },
    routeKey: "foo",
    version: "2.0",
    ...event,
  };
}

describe("architect createRequestHandler", () => {
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

      // We don't have a real app to test, but it doesn't matter. We won't ever
      // call through to the real createRequestHandler
      // @ts-expect-error
      await lambdaTester(createRequestHandler({ build: undefined }))
        .event(createMockEvent({ rawPath: "/foo/bar" }))
        .expectResolve((res: any) => {
          expect(res.statusCode).toBe(200);
          expect(res.body).toBe("URL: /foo/bar");
        });
    });

    it("handles root // requests", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async (req) => {
        return new Response(`URL: ${new URL(req.url).pathname}`);
      });

      // We don't have a real app to test, but it doesn't matter. We won't ever
      // call through to the real createRequestHandler
      // @ts-expect-error
      await lambdaTester(createRequestHandler({ build: undefined }))
        .event(createMockEvent({ rawPath: "//" }))
        .expectResolve((res: any) => {
          expect(res.statusCode).toBe(200);
          expect(res.body).toBe("URL: //");
        });
    });

    it("handles nested // requests", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async (req) => {
        return new Response(`URL: ${new URL(req.url).pathname}`);
      });

      // We don't have a real app to test, but it doesn't matter. We won't ever
      // call through to the real createRequestHandler
      // @ts-expect-error
      await lambdaTester(createRequestHandler({ build: undefined }))
        .event(createMockEvent({ rawPath: "//foo//bar" }))
        .expectResolve((res: APIGatewayProxyStructuredResultV2) => {
          expect(res.statusCode).toBe(200);
          expect(res.body).toBe("URL: //foo//bar");
        });
    });

    it("handles null body", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async () => {
        return new Response(null, { status: 200 });
      });

      // We don't have a real app to test, but it doesn't matter. We won't ever
      // call through to the real createRequestHandler
      // @ts-expect-error
      await lambdaTester(createRequestHandler({ build: undefined }))
        .event(createMockEvent({ rawPath: "/foo/bar" }))
        .expectResolve((res: APIGatewayProxyStructuredResultV2) => {
          expect(res.statusCode).toBe(200);
        });
    });

    it("handles status codes", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async () => {
        return new Response(null, { status: 204 });
      });

      // We don't have a real app to test, but it doesn't matter. We won't ever
      // call through to the real createRequestHandler
      // @ts-expect-error
      await lambdaTester(createRequestHandler({ build: undefined }))
        .event(createMockEvent({ rawPath: "/foo/bar" }))
        .expectResolve((res: APIGatewayProxyStructuredResultV2) => {
          expect(res.statusCode).toBe(204);
        });
    });

    it("sets headers", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async () => {
        let headers = new Headers();
        headers.append("X-Time-Of-Year", "most wonderful");
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

        return new Response(null, { headers });
      });

      // We don't have a real app to test, but it doesn't matter. We won't ever
      // call through to the real createRequestHandler
      // @ts-expect-error
      await lambdaTester(createRequestHandler({ build: undefined }))
        .event(createMockEvent({ rawPath: "/" }))
        .expectResolve((res: APIGatewayProxyStructuredResultV2) => {
          expect(res.statusCode).toBe(200);
          expect(res.headers?.["x-time-of-year"]).toBe("most wonderful");
          expect(res.cookies).toEqual([
            "first=one; Expires=0; Path=/; HttpOnly; Secure; SameSite=Lax",
            "second=two; MaxAge=1209600; Path=/; HttpOnly; Secure; SameSite=Lax",
            "third=three; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax",
          ]);
        });
    });
  });
});

describe("architect createReactRouterHeaders", () => {
  describe("creates fetch headers from architect headers", () => {
    it("handles empty headers", () => {
      let headers = createReactRouterHeaders({});
      expect(Object.fromEntries(headers.entries())).toMatchInlineSnapshot(`{}`);
    });

    it("handles simple headers", () => {
      let headers = createReactRouterHeaders({ "x-foo": "bar" });
      expect(headers.get("x-foo")).toBe("bar");
    });

    it("handles multiple headers", () => {
      let headers = createReactRouterHeaders({
        "x-foo": "bar",
        "x-bar": "baz",
      });
      expect(headers.get("x-foo")).toBe("bar");
      expect(headers.get("x-bar")).toBe("baz");
    });

    it("handles headers with multiple values", () => {
      let headers = createReactRouterHeaders({
        "x-foo": "bar, baz",
        "x-bar": "baz",
      });
      expect(headers.get("x-foo")).toEqual("bar, baz");
      expect(headers.get("x-bar")).toBe("baz");
    });

    it("handles multiple request cookies", () => {
      let headers = createReactRouterHeaders({}, [
        "__session=some_value",
        "__other=some_other_value",
      ]);
      expect(headers.get("cookie")).toEqual(
        "__session=some_value; __other=some_other_value"
      );
    });
  });
});

describe("architect createReactRouterRequest", () => {
  it("creates a request with the correct headers", () => {
    let request = createReactRouterRequest(
      createMockEvent({ cookies: ["__session=value"] })
    );

    expect(request.method).toBe("GET");
    expect(request.headers.get("cookie")).toBe("__session=value");
  });
});

describe("sendReactRouterResponse", () => {
  it("handles regular responses", async () => {
    let response = new Response("anything");
    let result = await sendReactRouterResponse(response);
    expect(result.body).toBe("anything");
  });

  it("handles resource routes with regular data", async () => {
    let json = JSON.stringify({ foo: "bar" });
    let response = new Response(json, {
      headers: {
        "Content-Type": "application/json",
        "content-length": json.length.toString(),
      },
    });

    let result = await sendReactRouterResponse(response);

    expect(result.body).toMatch(json);
  });

  it("handles resource routes with binary data", async () => {
    let image = await fsp.readFile(path.join(__dirname, "554828.jpeg"));

    let response = new Response(image, {
      headers: {
        "content-type": "image/jpeg",
        "content-length": image.length.toString(),
      },
    });

    let result = await sendReactRouterResponse(response);

    expect(result.body).toMatch(image.toString("base64"));
  });
});
