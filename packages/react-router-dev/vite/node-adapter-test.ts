import { IncomingMessage, ServerResponse } from "node:http";
import type { Socket } from "node:net";
import { fromNodeRequest } from "./node-adapter";

function createNodeReq({
  method = "GET",
  url = "/",
  headers = {},
  encrypted = false,
}: {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[]>;
  encrypted?: boolean;
} = {}): IncomingMessage {
  let req = new IncomingMessage({ encrypted } as unknown as Socket);
  req.method = method;
  req.url = url;
  req.headers = headers;
  // Vite's Connect server sets `req.originalUrl`
  (req as IncomingMessage & { originalUrl: string }).originalUrl = url;
  return req;
}

describe("fromNodeRequest", () => {
  test("constructs an http:// URL for a plain HTTP connection", async () => {
    let req = createNodeReq({
      headers: { host: "localhost:3000" },
    });

    let request = await fromNodeRequest(req, new ServerResponse(req));

    expect(request.url).toBe("http://localhost:3000/");
  });

  describe.each([false, true])("encrypted: %s", (encrypted) => {
    let protocol = encrypted ? "https" : "http";

    test.each([undefined, "", "ftp", "https-invalid", ", https"])(
      "falls back to the connection protocol for X-Forwarded-Proto: %s",
      async (forwardedProto) => {
        let req = createNodeReq({
          encrypted,
          headers: {
            host: "localhost:3000",
            ...(forwardedProto === undefined
              ? {}
              : { "x-forwarded-proto": forwardedProto }),
          },
        });

        let request = await fromNodeRequest(req, new ServerResponse(req));

        expect(request.url).toBe(`${protocol}://localhost:3000/`);
      },
    );
  });

  test.each([
    { forwardedProto: "https", protocol: "https" },
    { forwardedProto: "http", protocol: "http" },
    { forwardedProto: " HTTPS: ", protocol: "https" },
    { forwardedProto: "https, http", protocol: "https" },
    { forwardedProto: ["https", "http"], protocol: "https" },
  ])(
    "honors X-Forwarded-Proto: $forwardedProto without configuration",
    async ({ forwardedProto, protocol }) => {
      let req = createNodeReq({
        encrypted: protocol === "http",
        url: "/path?query=value",
        headers: {
          host: "demo.example.com:3000",
          "x-forwarded-proto": forwardedProto,
        },
      });

      let request = await fromNodeRequest(req, new ServerResponse(req));

      expect(request.url).toBe(
        `${protocol}://demo.example.com:3000/path?query=value`,
      );
    },
  );

  test("ignores X-Forwarded-Host so Vite's allowedHosts check stays authoritative", async () => {
    let req = createNodeReq({
      headers: {
        host: "demo.example.com",
        "x-forwarded-host": "evil.example.com",
        "x-forwarded-proto": "https",
        forwarded: "host=evil.example.com;proto=http",
      },
    });

    let request = await fromNodeRequest(req, new ServerResponse(req));

    expect(request.url).toBe("https://demo.example.com/");
  });

  test("does not trust the Forwarded header", async () => {
    let req = createNodeReq({
      headers: {
        host: "localhost:3000",
        forwarded: "host=evil.example.com;proto=https",
      },
    });

    let request = await fromNodeRequest(req, new ServerResponse(req));

    expect(request.url).toBe("http://localhost:3000/");
  });
});
