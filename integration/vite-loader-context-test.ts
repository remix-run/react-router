import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { createProject, customDev, viteConfig } from "./helpers/vite.js";

let port: number;
let cwd: string;
let stop: () => void;

test.beforeAll(async () => {
  port = await getPort();
  cwd = await createProject({
    "vite.config.js": await viteConfig.basic({ port }),
    "app/context.ts": String.raw`
      import { createContext } from "react-router";
      export const valueContext = createContext<string>();
    `,
    "server.mjs": String.raw`
      import { createRequestHandler } from "@react-router/express";
      import { RouterContextProvider } from "react-router";
      import express from "express";

      let viteDevServer =
        process.env.NODE_ENV === "production"
          ? undefined
          : await import("vite").then((vite) =>
              vite.createServer({
                server: { middlewareMode: true },
              })
            );

      const app = express();

      if (viteDevServer) {
        app.use(viteDevServer.middlewares);
      } else {
        app.use(
          "/assets",
          express.static("build/client/assets", { immutable: true, maxAge: "1y" })
        );
      }
      app.use(express.static("build/client", { maxAge: "1h" }));

      app.all(
        "*",
        createRequestHandler({
          build: viteDevServer
            ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
            : await import("./build/index.js"),
          getLoadContext: async () => {
            let { valueContext } = await (viteDevServer
              ? viteDevServer.ssrLoadModule("/app/context.ts")
              : import("./build/server/app/context.js"));
            return new RouterContextProvider([[valueContext, "value"]]);
          },
        })
      );

      const port = ${port};
      app.listen(port, () => console.log('http://localhost:' + port));
    `,
    "app/routes/_index.tsx": String.raw`
      import { useLoaderData } from "react-router";
      import { valueContext } from "../context";

      export const loader = ({ context }) => {
        return { value: context.get(valueContext) }
      }

      export default function IndexRoute() {
        let { value } = useLoaderData<typeof loader>();
        return (
          <div id="index">
            <p data-context>Context: {value}</p>
          </div>
        );
      }
    `,
  });
  stop = await customDev({ cwd, port });
});
test.afterAll(() => stop());

test("Vite / Load context / express", async ({ page }) => {
  let pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto(`http://localhost:${port}/`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("#index [data-context]")).toHaveText(
    "Context: value",
  );
  expect(pageErrors).toEqual([]);
});
