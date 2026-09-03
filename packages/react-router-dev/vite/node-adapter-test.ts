import {
  type AddressInfo,
  createServer,
  request as sendRequest,
} from "node:http";
import type * as Vite from "vite";
import { fromNodeRequest } from "./node-adapter";

describe("fromNodeRequest", () => {
  it("uses the forwarded protocol without trusting the forwarded host", async () => {
    let requestUrl = await new Promise<string>((resolve, reject) => {
      let server = createServer(async (nodeReq, nodeRes) => {
        let viteRequest = Object.assign(nodeReq, {
          originalUrl: nodeReq.url,
        }) as Vite.Connect.IncomingMessage;

        try {
          let request = await fromNodeRequest(viteRequest, nodeRes);
          resolve(request.url);
          nodeRes.end();
        } catch (error) {
          reject(error);
        } finally {
          server.close();
        }
      });

      server.on("error", reject);
      server.listen(0, "127.0.0.1", () => {
        let { port } = server.address() as AddressInfo;
        let request = sendRequest({
          host: "127.0.0.1",
          port,
          headers: {
            host: "public.example.com",
            "x-forwarded-host": "evil.example.com",
            "x-forwarded-proto": "https",
          },
        });
        request.on("error", reject);
        request.end();
      });
    });

    expect(requestUrl).toBe("https://public.example.com/");
  });
});
