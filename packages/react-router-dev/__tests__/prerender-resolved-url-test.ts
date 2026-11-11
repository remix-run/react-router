import http from "node:http";
import type { AddressInfo } from "node:net";
import type * as Vite from "vite";

import { getResolvedUrl, prerender } from "../vite/plugins/prerender";
import { getPrerenderConfig } from "../vite/plugin";
import type { ResolvedReactRouterConfig } from "../config/config";

const preview = jest.fn() as jest.MockedFunction<typeof Vite.preview>;
(jest as any).unstable_mockModule("vite", () => ({ preview }));

describe("getResolvedUrl", () => {
  let server: http.Server;

  afterEach(async () => {
    if (server?.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  async function listen(host: string): Promise<AddressInfo> {
    server = http.createServer();
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, host, resolve);
    });
    return server.address() as AddressInfo;
  }

  function fakePreviewServer(port: number): Vite.PreviewServer {
    return {
      httpServer: server,
      resolvedUrls: { local: [`http://localhost:${port}/`], network: [] },
    } as unknown as Vite.PreviewServer;
  }

  test("uses the literal IPv4 loopback address the server bound to", async () => {
    const address = await listen("127.0.0.1");
    const url = getResolvedUrl(fakePreviewServer(address.port));
    expect(url.hostname).toBe("127.0.0.1");
    expect(url.port).toBe(String(address.port));
  });

  test("uses the IPv6 loopback address the server bound to", async () => {
    const address = await listen("::1");
    const url = getResolvedUrl(fakePreviewServer(address.port));
    expect(url.hostname).toBe("[::1]");
    expect(url.port).toBe(String(address.port));
  });

  test("falls back to the printable URL for wildcard binds", async () => {
    const address = await listen("0.0.0.0");
    const url = getResolvedUrl(fakePreviewServer(address.port));
    expect(url.hostname).toBe("localhost");
    expect(url.port).toBe(String(address.port));
  });
});

describe("prerender HTTP requests", () => {
  let server: http.Server;

  async function closeServer() {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }

  afterEach(async () => {
    await closeServer();
    preview.mockReset();
  });

  test.each([
    { host: "127.0.0.1", printableHost: "[::1]" },
    { host: "::1", printableHost: "127.0.0.1" },
  ])(
    "fetches data and HTML from $host when the printable URL advertises $printableHost",
    async ({ host, printableHost }) => {
      let receivedPaths: string[] = [];
      server = http.createServer((request, response) => {
        receivedPaths.push(request.url!);
        response.end(`Prerendered ${request.url}`);
      });
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen({ port: 0, host, ipv6Only: host === "::1" }, resolve);
      });
      let { port } = server.address() as AddressInfo;

      // The opposite address family makes the old printable-URL behavior fail
      // deterministically, without relying on the machine's localhost DNS order.
      preview.mockResolvedValue({
        httpServer: server,
        resolvedUrls: {
          local: [`http://${printableHost}:${port}/`],
          network: [],
        },
        close: closeServer,
      } as unknown as Vite.PreviewServer);

      let responses: { status: number; body: string }[] = [];
      let plugin = prerender({
        config: { buildDirectory: ".", retryCount: 0 },
        requests: ["http://localhost/products.data?_routes=routes%2Fproducts"],
        async postProcess(request, response) {
          responses.push({
            status: response.status,
            body: await response.text(),
          });
          return new URL(request.url).pathname.endsWith(".data")
            ? {
                files: [],
                requests: ["http://localhost/products?view=full"],
              }
            : [];
        },
      });

      // Drive the plugin's build hook without performing a Vite build. Only
      // preview server creation is mocked; the HTTP transport remains real.
      let configResolved = plugin.configResolved!;
      await (
        typeof configResolved === "function"
          ? configResolved
          : configResolved.handler
      ).call(
        {} as Vite.MinimalPluginContextWithoutEnvironment,
        { configFile: undefined } as Vite.ResolvedConfig,
      );
      let buildAppHook = plugin.buildApp!;
      await (
        typeof buildAppHook === "function" ? buildAppHook : buildAppHook.handler
      ).call(
        {} as Vite.MinimalPluginContextWithoutEnvironment,
        {} as Vite.ViteBuilder,
      );

      expect(receivedPaths).toEqual([
        "/products.data?_routes=routes%2Fproducts",
        "/products?view=full",
      ]);
      expect(responses).toEqual([
        {
          status: 200,
          body: "Prerendered /products.data?_routes=routes%2Fproducts",
        },
        { status: 200, body: "Prerendered /products?view=full" },
      ]);
    },
  );

  async function drivePlugin(plugin: ReturnType<typeof prerender>) {
    let configResolved = plugin.configResolved!;
    await (
      typeof configResolved === "function"
        ? configResolved
        : configResolved.handler
    ).call(
      {} as Vite.MinimalPluginContextWithoutEnvironment,
      {
        configFile: undefined,
        root: ".",
        environments: { client: { build: { outDir: "." } } },
      } as unknown as Vite.ResolvedConfig,
    );
    let buildAppHook = plugin.buildApp!;
    await (
      typeof buildAppHook === "function" ? buildAppHook : buildAppHook.handler
    ).call(
      {} as Vite.MinimalPluginContextWithoutEnvironment,
      {} as Vite.ViteBuilder,
    );
  }

  test("retries failed 5xx requests according to retryCount and retryDelay", async () => {
    let attempts = 0;
    server = http.createServer((request, response) => {
      attempts++;
      if (attempts < 3) {
        response.statusCode = 500;
        response.end("Server Error");
      } else {
        response.statusCode = 200;
        response.end("Success after retries");
      }
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    let { port } = server.address() as AddressInfo;

    preview.mockResolvedValue({
      httpServer: server,
      resolvedUrls: { local: [`http://127.0.0.1:${port}/`], network: [] },
      close: closeServer,
    } as unknown as Vite.PreviewServer);

    let reactRouterConfig = {
      prerender: {
        paths: ["/retry-test"],
        retryCount: 2,
        retryDelay: 10,
      },
    } as unknown as ResolvedReactRouterConfig;

    let responseBody = "";
    let plugin = prerender({
      config: () => getPrerenderConfig(reactRouterConfig),
      requests: ["http://localhost/retry-test"],
      async postProcess(request, response) {
        responseBody = await response.text();
        return [];
      },
    });

    await drivePlugin(plugin);

    expect(attempts).toBe(3);
    expect(responseBody).toBe("Success after retries");
  });

  test("times out slow requests when timeout option is configured", async () => {
    server = http.createServer((request, response) => {
      // Delay response longer than the timeout
      setTimeout(() => {
        response.end("Too slow");
      }, 100);
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    let { port } = server.address() as AddressInfo;

    preview.mockResolvedValue({
      httpServer: server,
      resolvedUrls: { local: [`http://127.0.0.1:${port}/`], network: [] },
      close: closeServer,
    } as unknown as Vite.PreviewServer);

    let reactRouterConfig = {
      prerender: {
        paths: ["/timeout-test"],
        timeout: 20,
        retryCount: 0,
      },
    } as unknown as ResolvedReactRouterConfig;

    let errorHandled: Error | undefined;
    let plugin = prerender({
      config: () => getPrerenderConfig(reactRouterConfig),
      requests: ["http://localhost/timeout-test"],
      handleError(request, error) {
        errorHandled = error;
      },
    });

    await drivePlugin(plugin);

    expect(errorHandled).toBeDefined();
    expect(errorHandled?.message).toMatch(/timed out|timeout|aborted/i);
  });

  test("follows internal redirects up to maxRedirects option", async () => {
    let requestedUrls: string[] = [];
    server = http.createServer((request, response) => {
      requestedUrls.push(request.url!);
      if (request.url === "/initial") {
        response.writeHead(302, { Location: "/redirected" });
        response.end();
      } else {
        response.writeHead(200);
        response.end("Redirect destination");
      }
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    let { port } = server.address() as AddressInfo;

    preview.mockResolvedValue({
      httpServer: server,
      resolvedUrls: { local: [`http://127.0.0.1:${port}/`], network: [] },
      close: closeServer,
    } as unknown as Vite.PreviewServer);

    let reactRouterConfig = {
      prerender: {
        paths: ["/initial"],
        maxRedirects: 1,
      },
    } as unknown as ResolvedReactRouterConfig;

    let finalResponse = "";
    let plugin = prerender({
      config: () => getPrerenderConfig(reactRouterConfig),
      requests: ["http://localhost/initial"],
      async postProcess(request, response) {
        finalResponse = await response.text();
        return [];
      },
    });

    await drivePlugin(plugin);

    expect(requestedUrls).toEqual(["/initial", "/redirected"]);
    expect(finalResponse).toBe("Redirect destination");
  });
});
