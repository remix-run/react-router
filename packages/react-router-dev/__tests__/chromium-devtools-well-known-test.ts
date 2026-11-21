import type http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { createServer } from "vite";
import type { ViteDevServer } from "vite";
import {
  isChromiumDevToolsWellKnownRequest,
  handleChromiumDevToolsWellKnownRequest,
  CHROMIUM_DEVTOOLS_WELL_KNOWN_PATH,
} from "../vite/plugin";

describe("Chromium DevTools well-known request handling", () => {
  describe("unit tests", () => {
    function createMockReq({
      method = "GET",
      url = CHROMIUM_DEVTOOLS_WELL_KNOWN_PATH,
      originalUrl,
    }: {
      method?: string;
      url?: string;
      originalUrl?: string;
    } = {}) {
      return {
        method,
        url,
        originalUrl: originalUrl ?? url,
        headers: { host: "localhost:3000" },
      } as any;
    }

    function createMockRes() {
      let headers: Record<string, string> = {};
      let body = "";
      let ended = false;
      let statusCode = 200;

      return {
        get statusCode() {
          return statusCode;
        },
        set statusCode(code: number) {
          statusCode = code;
        },
        setHeader(name: string, value: string) {
          headers[name.toLowerCase()] = value;
        },
        getHeader(name: string) {
          return headers[name.toLowerCase()];
        },
        end(chunk?: any) {
          ended = true;
          if (chunk) body += chunk;
        },
        _isEnded() {
          return ended;
        },
        _getBody() {
          return body;
        },
        _getHeaders() {
          return headers;
        },
      } as unknown as http.ServerResponse & {
        _isEnded: () => boolean;
        _getBody: () => string;
        _getHeaders: () => Record<string, string>;
      };
    }

    test("recognizes exact chromium devtools path with GET", () => {
      let req = createMockReq({
        method: "GET",
        url: CHROMIUM_DEVTOOLS_WELL_KNOWN_PATH,
      });
      expect(isChromiumDevToolsWellKnownRequest(req)).toBe(true);
    });

    test("recognizes exact chromium devtools path with HEAD", () => {
      let req = createMockReq({
        method: "HEAD",
        url: CHROMIUM_DEVTOOLS_WELL_KNOWN_PATH,
      });
      expect(isChromiumDevToolsWellKnownRequest(req)).toBe(true);
    });

    test("recognizes path with query parameters", () => {
      let req = createMockReq({
        method: "GET",
        url: `${CHROMIUM_DEVTOOLS_WELL_KNOWN_PATH}?t=123456`,
      });
      expect(isChromiumDevToolsWellKnownRequest(req)).toBe(true);
    });

    test("recognizes path when originalUrl matches even if url was modified", () => {
      let req = createMockReq({
        method: "GET",
        url: "/sub-path",
        originalUrl: CHROMIUM_DEVTOOLS_WELL_KNOWN_PATH,
      });
      expect(isChromiumDevToolsWellKnownRequest(req)).toBe(true);
    });

    test("rejects non-GET/HEAD methods", () => {
      for (let method of ["POST", "PUT", "DELETE", "PATCH", "OPTIONS"]) {
        let req = createMockReq({
          method,
          url: CHROMIUM_DEVTOOLS_WELL_KNOWN_PATH,
        });
        expect(isChromiumDevToolsWellKnownRequest(req)).toBe(false);
      }
    });

    test("rejects other well-known paths", () => {
      let paths = [
        "/.well-known/security.txt",
        "/.well-known/change-password",
        "/.well-known/assetlinks.json",
        "/.well-known/apple-app-site-association",
        "/.well-known/appspecific/other.json",
      ];
      for (let url of paths) {
        let req = createMockReq({ method: "GET", url });
        expect(isChromiumDevToolsWellKnownRequest(req)).toBe(false);
      }
    });

    test("rejects normal application paths", () => {
      let paths = ["/", "/about", "/users/123", "/api/data"];
      for (let url of paths) {
        let req = createMockReq({ method: "GET", url });
        expect(isChromiumDevToolsWellKnownRequest(req)).toBe(false);
      }
    });

    test("handles request with 204 No Content, Cache-Control: no-store, and empty body", () => {
      let res = createMockRes();
      handleChromiumDevToolsWellKnownRequest(res);

      expect(res.statusCode).toBe(204);
      expect(res.getHeader("cache-control")).toBe("no-store");
      expect(res._isEnded()).toBe(true);
      expect(res._getBody()).toBe("");
    });
  });

  describe("Vite dev server integration", () => {
    let tmpDir: string;
    let server: ViteDevServer | null = null;
    let serverPort: number;

    const rootDir = process.cwd();

    beforeAll(async () => {
      tmpDir = path.join(rootDir, ".tmp", `devtools-test-${Date.now()}`);
      await fs.mkdir(path.join(tmpDir, "app"), { recursive: true });
      await fs.mkdir(path.join(tmpDir, "public"), { recursive: true });

      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify({
          name: "devtools-test",
          type: "module",
          dependencies: { isbot: "^5.1.0" },
        }),
      );

      await fs.writeFile(
        path.join(tmpDir, "vite.config.ts"),
        `import { defineConfig } from "vite";
import { reactRouter } from "${path.join(rootDir, "packages/react-router-dev/dist/vite.js").replace(/\\/g, "/")}";
export default defineConfig({
  resolve: {
    alias: {
      "react-router/dom": "${path.join(rootDir, "packages/react-router/dist/development/dom-export.js").replace(/\\/g, "/")}",
      "react-router": "${path.join(rootDir, "packages/react-router/dist/development/index.js").replace(/\\/g, "/")}",
    },
  },
  plugins: [reactRouter()],
});
`,
      );

      await fs.writeFile(
        path.join(tmpDir, "react-router.config.ts"),
        "export default {};\n",
      );

      await fs.writeFile(
        path.join(tmpDir, "app/root.tsx"),
        `import { Outlet, Scripts } from "react-router";
export default function Root() {
  return (
    <html>
      <head></head>
      <body>
        <h1>Root</h1>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
`,
      );

      await fs.writeFile(
        path.join(tmpDir, "app/routes.ts"),
        `export default [
  { index: true, file: "./home.tsx" },
];
`,
      );

      await fs.writeFile(
        path.join(tmpDir, "app/home.tsx"),
        `export default function Home() {
  return <h2>Home Page</h2>;
}
`,
      );

      server = await createServer({
        root: tmpDir,
        configFile: path.join(tmpDir, "vite.config.ts"),
        server: { port: 0 },
        logLevel: "silent",
      });

      await server.listen();
      let address = server.httpServer!.address() as { port: number };
      serverPort = address.port;
    }, 60000);

    afterAll(async () => {
      if (server) {
        await server.watcher?.close();
        await server.ws?.close();
        await server.close();
      }
      await fs.rm(tmpDir, { recursive: true, force: true });
    });

    test("returns 204 No Content for Chromium DevTools endpoint without logging errors", async () => {
      let consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      try {
        let res = await fetch(
          `http://localhost:${serverPort}/.well-known/appspecific/com.chrome.devtools.json`,
        );
        expect(res.status).toBe(204);
        expect(res.headers.get("cache-control")).toBe("no-store");
        expect(await res.text()).toBe("");

        // Verify that no "No route matches URL" error was logged
        let routeMissErrors = consoleErrorSpy.mock.calls.filter((args) =>
          args.some((arg) => String(arg).includes("No route matches URL")),
        );
        expect(routeMissErrors).toHaveLength(0);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    test("returns 204 for HEAD requests to Chromium DevTools endpoint", async () => {
      let res = await fetch(
        `http://localhost:${serverPort}/.well-known/appspecific/com.chrome.devtools.json`,
        { method: "HEAD" },
      );
      expect(res.status).toBe(204);
      expect(res.headers.get("cache-control")).toBe("no-store");
    });

    test("normal application routes continue to work normally", async () => {
      let res = await fetch(`http://localhost:${serverPort}/`);
      expect(res.status).toBe(200);
      let html = await res.text();
      expect(html).toContain("Home Page");
    });

    test("genuine missing application routes preserve normal 404 behavior", async () => {
      let consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      try {
        let res = await fetch(`http://localhost:${serverPort}/not-a-real-page`);
        expect(res.status).toBe(404);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    test("other well-known paths are not swallowed and preserve normal 404 behavior", async () => {
      let consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      try {
        let res = await fetch(
          `http://localhost:${serverPort}/.well-known/security.txt`,
        );
        expect(res.status).toBe(404);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    test("serves custom static file from public directory with 200 OK when present", async () => {
      let publicDevToolsDir = path.join(
        tmpDir,
        "public",
        ".well-known",
        "appspecific",
      );
      await fs.mkdir(publicDevToolsDir, { recursive: true });
      let staticFilePath = path.join(
        publicDevToolsDir,
        "com.chrome.devtools.json",
      );
      await fs.writeFile(
        staticFilePath,
        JSON.stringify({ custom: "devtools-config" }),
      );

      try {
        let res = await fetch(
          `http://localhost:${serverPort}/.well-known/appspecific/com.chrome.devtools.json`,
        );
        expect(res.status).toBe(200);
        let body = await res.json();
        expect(body).toEqual({ custom: "devtools-config" });
      } finally {
        await fs.rm(publicDevToolsDir, { recursive: true, force: true });
      }
    });

    test("production request handler preserves standard 404 behavior", async () => {
      let consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      try {
        let { createRequestHandler } = await import("react-router");
        let mockBuild: any = {
          routes: {
            root: {
              id: "root",
              path: "",
              module: {
                default: () => null,
              },
            },
          },
          entry: {
            module: {
              default: (_request: Request, responseStatusCode: number) =>
                new Response("Not Found", { status: responseStatusCode }),
            },
          },
          future: {},
          prerender: [],
          routeDiscovery: { mode: "eager" },
        };

        let handler = createRequestHandler(mockBuild, "production");
        let req = new Request(
          `http://localhost:3000${CHROMIUM_DEVTOOLS_WELL_KNOWN_PATH}`,
        );
        let res = await handler(req);
        expect(res.status).toBe(404);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: `No route matches URL "${CHROMIUM_DEVTOOLS_WELL_KNOWN_PATH}"`,
          }),
        );
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
  });
});
