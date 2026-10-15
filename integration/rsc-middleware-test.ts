import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { createFixture, js } from "./helpers/create-fixture.js";
import { implementations, setupRscTest } from "./rsc/utils.js";

const rootRoute = js`
  import { Outlet } from "react-router";

  let cachedResponse;
  export const middleware = [
    async ({ request }, next) => {
      let pathname = new URL(request.url).pathname;
      if (pathname === "/cached") {
        if (cachedResponse) {
          let response = cachedResponse.clone();
          response.headers.set("X-Cache", "HIT");
          return response;
        }
        let response = await next();
        cachedResponse = response.clone();
        response.headers.set("X-Cache", "MISS");
        return response;
      }
      if (pathname === "/markdown.md") {
        return new Response("# Markdown response", {
          headers: { "Content-Type": "text/markdown; charset=utf-8" },
        });
      }
      if (pathname === "/replaced") {
        await next();
        return new Response("Replacement response", { status: 403 });
      }
      return next();
    },
  ];

  export default function Root() {
    return <html><head /><body><Outlet /></body></html>;
  }
`;
const contentRoute = js`
  export default function Component() {
    return <h1 id="route">HTML response</h1>;
  }
`;

for (let implementation of [undefined, ...implementations]) {
  test.describe(
    implementation
      ? `RSC Data middleware responses (${implementation.name})`
      : "RSC Framework middleware responses",
    () => {
      let requestDocument: (pathname: string) => Promise<Response>;
      let stopAfterAll: (() => void) | undefined;

      test.beforeAll(async () => {
        if (implementation) {
          let port = await getPort();
          stopAfterAll = await setupRscTest({
            implementation,
            port,
            files: {
              "src/routes.ts": js`
                import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

                export const routes = [{
                  id: "root",
                  path: "",
                  lazy: () => import("./routes/root"),
                  children: [{
                    id: "content",
                    path: "*",
                    lazy: () => import("./routes/content"),
                  }],
                }] satisfies RSCRouteConfig;
              `,
              "src/routes/root.tsx": rootRoute,
              "src/routes/content.tsx": contentRoute,
            },
          });
          requestDocument = (pathname) =>
            fetch(`http://localhost:${port}${pathname}`);
        } else {
          let fixture = await createFixture({
            templateName: "rsc-vite-framework",
            files: {
              "app/root.tsx": rootRoute,
              "app/routes/$.tsx": contentRoute,
            },
          });
          requestDocument = async (pathname) =>
            fixture.requestDocument(pathname);
        }
      });

      test.afterAll(() => stopAfterAll?.());

      test("renders cached middleware Flight responses as HTML", async () => {
        for (let cacheStatus of ["MISS", "HIT"]) {
          let response = await requestDocument("/cached");

          expect(response.status).toBe(200);
          expect(response.headers.get("X-Cache")).toBe(cacheStatus);
          expect(response.headers.get("Content-Type")).toBe(
            "text/html; charset=utf-8",
          );
          expect(await response.text()).toContain(
            '<h1 id="route">HTML response</h1>',
          );
        }
      });

      test("passes through raw middleware responses", async () => {
        let response = await requestDocument("/markdown.md");

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe(
          "text/markdown; charset=utf-8",
        );
        expect(await response.text()).toBe("# Markdown response");
      });

      test("passes through raw responses replacing next()", async () => {
        let response = await requestDocument("/replaced");

        expect(response.status).toBe(403);
        expect(response.headers.get("Content-Type")).toBe(
          "text/plain;charset=UTF-8",
        );
        expect(await response.text()).toBe("Replacement response");
      });
    },
  );
}
