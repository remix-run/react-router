import * as Path from "pathe";
import dedent from "dedent";
import { expect } from "@playwright/test";
import { resolveConfig } from "vite";

import { createProject, test } from "./helpers/vite.js";

const js = String.raw;

function routesConfig(delayMs: number) {
  return dedent(js`
    import { flatRoutes } from "@react-router/fs-routes";
    import type { RouteConfig } from "@react-router/dev/routes";

    await new Promise((resolve) => setTimeout(resolve, ${delayMs}));
    let routes = await flatRoutes();

    export default routes satisfies RouteConfig;
  `);
}

async function resolveReactRouterRoutes(root: string) {
  let config = await resolveConfig(
    {
      configFile: Path.join(root, "vite.config.ts"),
      root,
      logLevel: "silent",
    },
    "build",
  );

  return (config as any).__reactRouterPluginContext.reactRouterConfig.routes;
}

test.describe("Vite config", () => {
  test("isolates flatRoutes app directory state during concurrent config resolution", async () => {
    let projectA = await createProject({
      "app/routes.ts": routesConfig(50),
      "app/routes/dashboard.tsx": js`
        export default function Dashboard() {
          return <h1>Dashboard</h1>;
        }
      `,
    });
    let projectB = await createProject({
      "app/routes.ts": routesConfig(0),
      "app/routes/login.tsx": js`
        export default function Login() {
          return <h1>Login</h1>;
        }
      `,
    });

    let resolvingA = resolveReactRouterRoutes(projectA);
    await new Promise((resolve) => setTimeout(resolve, 5));
    let resolvingB = resolveReactRouterRoutes(projectB);

    let [routesA, routesB] = await Promise.all([resolvingA, resolvingB]);

    expect(routesA["routes/dashboard"]?.file).toBe("routes/dashboard.tsx");
    expect(routesA["routes/login"]).toBeUndefined();
    expect(routesB["routes/login"]?.file).toBe("routes/login.tsx");
    expect(routesB["routes/dashboard"]).toBeUndefined();
  });
});
