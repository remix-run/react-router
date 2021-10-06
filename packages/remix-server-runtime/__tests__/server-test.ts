import { createRequestHandler } from "..";
import type { ServerBuild } from "../build";

describe("server", () => {
  let routeId = "root";
  let build: ServerBuild = {
    entry: {
      module: {
        default: async request => {
          return new Response(`${request.method}, ${request.url}`);
        }
      }
    },
    routes: {
      [routeId]: {
        id: routeId,
        path: "",
        module: {
          action: () => "ACTION",
          loader: () => "LOADER",
          default: () => "COMPONENT"
        }
      }
    },
    assets: {
      routes: {
        [routeId]: {
          hasAction: true,
          hasErrorBoundary: false,
          hasLoader: true,
          id: routeId,
          module: routeId,
          path: ""
        }
      }
    }
  } as unknown as ServerBuild;

  describe("createRequestHandler", () => {
    let allowThrough = [
      ["GET", "/"],
      ["GET", "/_data=root"],
      ["POST", "/"],
      ["POST", "/_data=root"],
      ["PUT", "/"],
      ["PUT", "/_data=root"],
      ["DELETE", "/"],
      ["DELETE", "/_data=root"],
      ["PATCH", "/"],
      ["PATCH", "/_data=root"]
    ];
    for (let [method, to] of allowThrough) {
      it(`allows through ${method} request to ${to}`, async () => {
        let handler = createRequestHandler(build, {});
        let response = await handler(
          new Request(`http://localhost:3000${to}`, {
            method
          })
        );

        expect(await response.text()).toContain(method);
      });
    }

    it("strips body for HEAD requests", async () => {
      let handler = createRequestHandler(build, {});
      let response = await handler(
        new Request("http://localhost:3000/", {
          method: "HEAD"
        })
      );

      expect(await response.text()).toBe("");
    });
  });
});
