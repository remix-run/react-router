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
  headers?: Record<string, string>;
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

  test("honors X-Forwarded-Proto from a reverse proxy", async () => {
    let req = createNodeReq({
      headers: {
        host: "demo.example.com",
        "x-forwarded-proto": "https",
      },
    });

    let request = await fromNodeRequest(req, new ServerResponse(req));

    expect(request.url).toBe("https://demo.example.com/");
  });

  test("uses the first value of a comma-separated X-Forwarded-Proto chain", async () => {
    let req = createNodeReq({
      headers: {
        host: "demo.example.com",
        "x-forwarded-proto": "https, http",
      },
    });

    let request = await fromNodeRequest(req, new ServerResponse(req));

    expect(request.url).toBe("https://demo.example.com/");
  });

  test("ignores invalid X-Forwarded-Proto values", async () => {
    let req = createNodeReq({
      headers: {
        host: "localhost:3000",
        "x-forwarded-proto": "ftp",
      },
    });

    let request = await fromNodeRequest(req, new ServerResponse(req));

    expect(request.url).toBe("http://localhost:3000/");
  });

  test("ignores X-Forwarded-Host so Vite's allowedHosts check stays authoritative", async () => {
    let req = createNodeReq({
      headers: {
        host: "demo.example.com",
        "x-forwarded-host": "evil.example.com",
        "x-forwarded-proto": "https",
      },
    });

    let request = await fromNodeRequest(req, new ServerResponse(req));

    expect(request.url).toBe("https://demo.example.com/");
  });
});
