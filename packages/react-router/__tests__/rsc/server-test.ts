import {
  unstable_matchRSCServerRequest as matchRSCServerRequest,
  type unstable_RSCMatch as RSCMatch,
} from "../../index-react-server";
import { unstable_routeRSCServerRequest as routeRSCServerRequest } from "../../index";

describe("RSC server version recovery", () => {
  it("returns a reload document response for stale manifest requests", async () => {
    let response = await matchRSCServerRequest({
      createTemporaryReferenceSet: () => undefined,
      request: new Request("http://localhost/target.manifest?version=old"),
      routes: [],
      version: "new",
      generateResponse,
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("X-Remix-Reload-Document")).toBe("true");
  });

  it("returns a reload document response for stale configured manifest requests", async () => {
    let response = await matchRSCServerRequest({
      createTemporaryReferenceSet: () => undefined,
      request: new Request(
        "http://localhost/__routes?paths=/target&version=old",
      ),
      routeDiscovery: { mode: "lazy", manifestPath: "/__routes" },
      routes: [],
      version: "new",
      generateResponse,
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("X-Remix-Reload-Document")).toBe("true");
  });

  it("returns a reload document response for stale RSC data requests", async () => {
    let response = await matchRSCServerRequest({
      createTemporaryReferenceSet: () => undefined,
      request: new Request("http://localhost/target.rsc", {
        headers: { "X-React-Router-RSC-Version": "old" },
      }),
      routes: [],
      version: "new",
      generateResponse,
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("X-Remix-Reload-Document")).toBe("true");
  });

  it("returns a reload document response for stale server action requests", async () => {
    let response = await matchRSCServerRequest({
      createTemporaryReferenceSet: () => undefined,
      request: new Request("http://localhost/current", {
        method: "POST",
        headers: {
          "rsc-action-id": "action",
          "X-React-Router-RSC-Version": "old",
        },
      }),
      routes: [],
      version: "new",
      generateResponse,
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("X-Remix-Reload-Document")).toBe("true");
  });

  it("passes through configured manifest responses from the SSR router", async () => {
    let response = await routeRSCServerRequest({
      request: new Request(
        "http://localhost/__routes?paths=/target&version=new",
      ),
      serverResponse: new Response("manifest", {
        headers: { "React-Router-RSC-Manifest": "true" },
      }),
      createFromReadableStream: async () => {
        throw new Error("Should not decode manifest responses");
      },
      renderHTML() {
        throw new Error("Should not render manifest responses");
      },
    });

    expect(await response.text()).toBe("manifest");
  });
});

function generateResponse(match: RSCMatch) {
  return new Response(JSON.stringify(match.payload), {
    status: match.statusCode,
    headers: match.headers,
  });
}
