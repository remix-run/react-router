import http from "node:http";
import type { AddressInfo } from "node:net";
import type * as Vite from "vite";

import { getResolvedUrl } from "../vite/plugins/prerender";

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
