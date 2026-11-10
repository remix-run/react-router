import http from "node:http";
import type { AddressInfo } from "node:net";
import type * as Vite from "vite";

import { getResolvedUrl, prerender } from "../vite/plugins/prerender";

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
});
