import { test, expect } from "@playwright/test";

import { createFixture, createAppFixture } from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { type TemplateName, viteConfig } from "./helpers/vite.js";

const templateNames = [
  "vite-5-template",
  "rsc-vite-framework",
] as const satisfies TemplateName[];

// This test ensures that code is not accidentally duplicated when a route is
// imported within user code since they're not importing one of our internal
// virtual route modules.
test.describe("Deduped route modules", () => {
  for (const templateName of templateNames) {
    test.describe(`template: ${templateName}`, () => {
      let fixture: Fixture;
      let appFixture: AppFixture;

      test.beforeAll(async () => {
        fixture = await createFixture({
          templateName,
          files: {
            "vite.config.js": await viteConfig.basic({
              templateName,
            }),
            "app/routes/client-first.a.tsx": `
              import { Link } from "react-router";

              export const customExport = (() => {
                globalThis.custom_export_count = (globalThis.custom_export_count || 0) + 1;
                return () => true;
              })();

              export const loader = (() => {
                globalThis.loader_count = (globalThis.loader_count || 0) + 1;
                return () => ({
                  customExportCount: globalThis.custom_export_count,
                  loaderCount: globalThis.loader_count,
                  componentCount: globalThis.component_count,
                });
              })();

              export const clientLoader = (() => {
                globalThis.client_loader_count = (globalThis.client_loader_count || 0) + 1;
                return async ({ serverLoader }) => {
                  const loaderData = await serverLoader();
                  return {
                    loaderCount: loaderData.loaderCount,
                    clientLoaderCount: globalThis.client_loader_count,
                    serverCustomExportCount: loaderData.customExportCount,
                    clientCustomExportCount: globalThis.custom_export_count,
                    serverComponentCount: loaderData.componentCount,
                    clientComponentCount: globalThis.component_count,
                  };
                };
              })();
              clientLoader.hydrate = true;

              const RouteA = (() => {
                globalThis.component_count = (globalThis.component_count || 0) + 1;
                return ({ loaderData }: Route.ComponentProps) => {
                  return (
                    <>
                      <h1>Module Count</h1>
                      <p>Loader count: <span data-loader-count>{loaderData.loaderCount}</span></p>
                      <p>Client loader count: <span data-client-loader-count>{loaderData.clientLoaderCount}</span></p>
                      <p>Server custom export count: <span data-server-custom-export-count>{loaderData.serverCustomExportCount}</span></p>
                      <p>Client custom export count: <span data-client-custom-export-count>{loaderData.clientCustomExportCount}</span></p>
                      <p>Server component count: <span data-server-component-count>{loaderData.serverComponentCount}</span></p>
                      <p>Client component count: <span data-client-component-count>{loaderData.clientComponentCount}</span></p>
                      <p><Link to="/client-first/b">Go to Route B</Link></p>
                    </>
                  );
                };
              })();

              export default RouteA;
            `,
            "app/routes/client-first.b.tsx": `
              import { Link } from "react-router";

              import { customExport } from "./client-first.a";
          
              export default function RouteB() {
                return customExport && (
                  <>
                    <h1>Route B</h1>
                    <p>This route imports the route module from Route A, so could potentially cause code duplication.</p>
                    <p><Link to="/client-first/a">Go to Route A</Link></p>
                  </>
                );
              }
            `,

            ...(templateName.includes("rsc")
              ? {
                  "app/routes/rsc-server-first.a/route.tsx": `
                    import { Link } from "react-router";
                    import { ModuleCounts, clientLoader } from "./client";
        
                    export const customExport = (() => {
                      globalThis.rsc_custom_export_count = (globalThis.rsc_custom_export_count || 0) + 1;
                      return () => true;
                    })();
        
                    export const loader = (() => {
                      globalThis.rsc_loader_count = (globalThis.rsc_loader_count || 0) + 1;
                      return () => ({
                        customExportCount: globalThis.rsc_custom_export_count,
                        loaderCount: globalThis.rsc_loader_count,
                        componentCount: globalThis.rsc_component_count,
                      });
                    })();

                    export { clientLoader };
        
                    export const ServerComponent = (() => {
                      globalThis.rsc_component_count = (globalThis.rsc_component_count || 0) + 1;
                      return () => {
                        return (
                          <>
                            <h1>RSC Server-First Module Count</h1>
                            <ModuleCounts />
                            <p><Link to="/rsc-server-first/b">Go to RSC Route B</Link></p>
                          </>
                        );
                      };
                    })();
                  `,
                  "app/routes/rsc-server-first.a/client.tsx": `
                    "use client";

                    import { useLoaderData } from "react-router";

                    export const clientLoader = (() => {
                      globalThis.rsc_client_loader_count = (globalThis.rsc_client_loader_count || 0) + 1;
                      return async ({ serverLoader }) => {
                        const loaderData = await serverLoader();
                        return {
                          loaderCount: loaderData.loaderCount,
                          clientLoaderCount: globalThis.rsc_client_loader_count,
                          serverCustomExportCount: loaderData.customExportCount,
                          clientCustomExportCount: globalThis.rsc_custom_export_count,
                          serverComponentCount: loaderData.componentCount,
                        };
                      };
                    })();
                    clientLoader.hydrate = true;
                  
                    export function ModuleCounts() {
                      const loaderData = useLoaderData();
                      return (
                        <>
                          <p>Loader count: <span data-loader-count>{loaderData.loaderCount}</span></p>
                          <p>Client loader count: <span data-client-loader-count>{loaderData.clientLoaderCount}</span></p>
                          <p>Server custom export count: <span data-server-custom-export-count>{loaderData.serverCustomExportCount}</span></p>
                          <p>Client custom export count: <span data-client-custom-export-count>{loaderData.clientCustomExportCount}</span></p>
                          <p>Server component count: <span data-server-component-count>{loaderData.serverComponentCount}</span></p>
                        </>
                      );
                    }
                  `,
                  "app/routes/rsc-server-first.b.tsx": `
                    import { Link } from "react-router";
        
                    import { customExport } from "./rsc-server-first.a/route";

                    // Ensure custom export is used in the client build in this route
                    export const handle = customExport;

                    export function ServerComponent() {
                      return customExport && (
                        <>
                          <h1>RSC Route B</h1>
                          <p>This route imports the route module from RSC Route A, so could potentially cause code duplication.</p>
                          <p><Link to="/rsc-server-first/a">Go to RSC Route A</Link></p>
                        </>
                      );
                    }
                  `,
                }
              : {}),
          },
        });

        appFixture = await createAppFixture(fixture);
      });

      test.afterAll(() => {
        appFixture.close();
      });

      let logs: string[] = [];

      test.beforeEach(({ page }) => {
        page.on("console", (msg) => {
          logs.push(msg.text());
        });
      });

      test.afterEach(() => {
        expect(logs).toHaveLength(0);
      });

      test("Client-first routes", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);

        let pageErrors: unknown[] = [];
        page.on("pageerror", (error) => pageErrors.push(error));

        await app.goto(`/client-first/b`, true);
        expect(pageErrors).toEqual([]);

        await app.clickLink("/client-first/a");
        await page.waitForSelector("[data-loader-count]");
        expect(await page.locator("[data-loader-count]").textContent()).toBe(
          "1",
        );
        expect(
          await page.locator("[data-client-loader-count]").textContent(),
        ).toBe("1");
        expect(
          await page.locator("[data-server-custom-export-count]").textContent(),
        ).toBe(
          templateName.includes("rsc")
            ? // In RSC, custom exports are present in both the react-server and react-client
              // environments (so they're available to be imported by both),
              // which means the Node server actually gets 2 copies
              "2"
            : "1",
        );
        expect(
          await page.locator("[data-client-custom-export-count]").textContent(),
        ).toBe("1");
        expect(
          await page.locator("[data-server-component-count]").textContent(),
        ).toBe("1");
        expect(
          await page.locator("[data-client-component-count]").textContent(),
        ).toBe("1");
        expect(pageErrors).toEqual([]);
      });

      test("Server-first routes", async ({ page }) => {
        test.skip(
          !templateName.includes("rsc"),
          "Server-first routes are an RSC-only feature",
        );

        let app = new PlaywrightFixture(appFixture, page);

        let pageErrors: unknown[] = [];
        page.on("pageerror", (error) => pageErrors.push(error));

        await app.goto(`/rsc-server-first/b`, true);
        expect(pageErrors).toEqual([]);

        await app.clickLink("/rsc-server-first/a");
        await page.waitForSelector("[data-loader-count]");
        expect(await page.locator("[data-loader-count]").textContent()).toBe(
          "1",
        );
        expect(
          await page.locator("[data-client-loader-count]").textContent(),
        ).toBe("1");
        expect(
          await page.locator("[data-server-custom-export-count]").textContent(),
        ).toBe(
          // In RSC, custom exports are present in both the react-server and react-client
          // environments (so they're available to be imported by both),
          // which means the Node server actually gets 2 copies
          "2",
        );
        expect(
          await page.locator("[data-client-custom-export-count]").textContent(),
        ).toBe("1");
        expect(
          await page.locator("[data-server-component-count]").textContent(),
        ).toBe("1");
        expect(pageErrors).toEqual([]);
      });
    });
  }
});
