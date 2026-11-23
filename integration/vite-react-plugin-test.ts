import { SourceMap } from "node:module";
import { globSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";
import getPort from "get-port";
import dedent from "dedent";
import { test } from "./helpers/fixtures";
import * as Stream from "./helpers/stream";
import { viteMajorTemplates } from "./helpers/templates";
import { build } from "./helpers/vite";

const tsx = dedent;
function configFor(options = "{}") {
  return `import { defineConfig } from 'vite';
    import { reactRouter } from '@react-router/dev/vite';
    import react from '@vitejs/plugin-react';
    export default defineConfig({plugins:[reactRouter(),react(${options})]});`;
}

const componentExportBody = `({ loaderData }) => <h1>{loaderData.message}</h1>`;
const componentExportFiles = {
  "app/routes/named.tsx": `export const loader = () => ({message:'named'}); export default function Named({loaderData}) { return <h1>{loaderData.message}</h1>; }`,
  "app/routes/variable.tsx": `export const loader = () => ({message:'variable'}); const Component = ${componentExportBody}; export default Component;`,
  "app/routes/anonymous.tsx": `export const loader = () => ({message:'anonymous'}); export default ${componentExportBody};`,
  "app/routes/anonymous-function.tsx": `export const loader = () => ({message:'anonymous-function'}); export default function ({loaderData}) { return <h1>{loaderData.message}</h1>; }`,
  "app/routes/function-boundary.tsx": `export const loader = () => {throw new Error('function-boundary')}; export default () => null; export function ErrorBoundary({error}) { return <h1>{error.message}</h1>; }`,
  "app/routes/mixed-boundary.tsx": `export const loader = () => {throw new Error('mixed-boundary')}; export default () => null; export const handle = {value:'mixed'}, ErrorBoundary = ({error}) => <h1>{error.message}</h1>;`,
};

for (const template of viteMajorTemplates) {
  for (const external of [false, true]) {
    test.describe(`${template.displayName} - ${external ? "consumer" : "built-in"} React plugin`, () => {
      test.use({
        template: template.name,
        files: {
          ...(external
            ? {
                "vite.config.ts": configFor(),
                "react-router.config.ts": `export default {future:{unstable_externalReactPlugin:true}};`,
              }
            : {}),
        },
      });
      test("production SSR and SPA builds preserve maps and omit refresh runtimes", async ({
        edit,
        cwd,
      }) => {
        let rootSource = "";
        const clientSource = `export const clientLoader = () => { throw new Error("CLIENT_PRODUCTION_MAP_MARKER"); };
          export default function Route() { return <h1>Production maps</h1>; }
          type Loader = () => void; export { type Loader as loader };`;
        await edit({
          "vite.config.ts": (contents) =>
            contents.replace(
              "defineConfig({",
              "defineConfig({build:{sourcemap:true},",
            ),
          "app/root.tsx": (contents) => {
            rootSource =
              contents +
              '\nexport const loader = () => ({message:"SERVER_PRODUCTION_MAP_MARKER"});';
            return rootSource;
          },
          "app/routes/_index.tsx": clientSource,
        });
        const assertMapping = (
          directory: string,
          marker: string,
          source: string,
        ) => {
          const file = globSync(path.join(cwd, directory, "**/*.js")).find(
            (file) => readFileSync(file, "utf8").includes(marker),
          );
          expect(file).toBeDefined();
          const output = readFileSync(file!, "utf8");
          const generated = output.slice(0, output.indexOf(marker)).split("\n");
          const map = JSON.parse(readFileSync(`${file}.map`, "utf8"));
          const entry = new SourceMap(map).findEntry(
            generated.length - 1,
            generated.at(-1)!.length,
          );
          if (!("originalLine" in entry))
            throw new Error("Missing production source map entry");
          expect(entry.originalLine).toBe(
            source.slice(0, source.indexOf(marker)).split("\n").length - 1,
          );
          expect(map.sourcesContent).toContain(source);
        };
        for (const ssr of [true, false]) {
          await edit({
            "react-router.config.ts": `export default {ssr:${ssr},splitRouteModules:true,future:{unstable_externalReactPlugin:${external}}};`,
          });
          const result = build({ cwd });
          expect(result.status).toBe(0);
          expect(result.stderr.toString()).not.toContain("SOURCEMAP_BROKEN");
          assertMapping(
            "build/client",
            "CLIENT_PRODUCTION_MAP_MARKER",
            clientSource,
          );
          if (ssr)
            assertMapping(
              "build/server",
              "SERVER_PRODUCTION_MAP_MARKER",
              rootSource,
            );
          for (const file of globSync(path.join(cwd, "build/client/**/*.js"))) {
            const output = readFileSync(file, "utf8");
            expect(output).not.toContain(
              "validateRefreshBoundaryAndEnqueueUpdate",
            );
            expect(output).not.toContain("react-router:hmr");
          }
        }
      });

      test("split route indexes omit server-only exports", async ({
        edit,
        cwd,
      }) => {
        const rootSource =
          readFileSync(path.join(cwd, "app/root.tsx"), "utf8") +
          "\nexport function HydrateFallback() { return <html><head /><body><p>Loading...</p><Scripts /></body></html>; }";
        await edit({
          "app/routes/_index.tsx": tsx`
            export const loader = () => ({ message: "server" });
            export const action = () => ({ message: "action" });
            export const clientLoader = async ({ serverLoader }) => serverLoader();
            export const handle = { message: "shared" };
            export default function Route({ loaderData }) {
              "use memo";
              return <h1>{loaderData.message}</h1>;
            }
          `,
        });
        for (const ssr of [true, "unstable_api-only"]) {
          await edit({
            "app/root.tsx":
              ssr === true
                ? 'import { handle as indexHandle } from "./routes/_index";\n' +
                  rootSource +
                  "\nexport const handle = indexHandle;"
                : rootSource,
            "react-router.config.ts": `export default {ssr:${JSON.stringify(ssr)},splitRouteModules:true,future:{unstable_externalReactPlugin:${external}}};`,
          });
          const result = build({ cwd });
          expect(result.status, result.stderr.toString()).toBe(0);
        }
      });

      test("preserves per-file JSX import sources", async ({
        page,
        edit,
        cwd,
        $,
      }) => {
        await edit({
          "react-router.config.ts": `export default {splitRouteModules:true,future:{unstable_externalReactPlugin:${external}}};`,
          "app/jsx-runtime.ts": tsx`
            import { jsx as reactJsx, jsxs as reactJsxs } from "react/jsx-runtime";
            export { Fragment } from "react/jsx-runtime";
            export const jsx = (type, props, ...args) => reactJsx(type, { ...props, "data-custom-jsx": true }, ...args);
            export const jsxs = (type, props, ...args) => reactJsxs(type, { ...props, "data-custom-jsx": true }, ...args);
          `,
          "app/jsx-dev-runtime.ts": tsx`
            import { jsxDEV as reactJsxDEV } from "react/jsx-dev-runtime";
            export { Fragment } from "react/jsx-dev-runtime";
            export const jsxDEV = (type, props, key, isStatic, source, self) => reactJsxDEV(type, {
              ...props,
              "data-custom-jsx": true,
              "data-source-line": source?.lineNumber,
              "data-source-column": source?.columnNumber,
            }, key, isStatic, source, self);
          `,
          "app/routes/_index.tsx": tsx`
            /** @jsxImportSource .. */
            export async function clientLoader() {
              await new Promise(resolve => setTimeout(resolve, 100));
              return {};
            }
            clientLoader.hydrate = true;
            export function HydrateFallback() { return <p>Custom fallback</p>; }
            export default function Route() { return <p>Custom JSX</p>; }
          `,
        });
        for (const command of ["dev", "start"]) {
          if (command === "start") {
            const result = build({ cwd });
            expect(result.status, result.stderr.toString()).toBe(0);
          }
          const port = await getPort({ host: "127.0.0.1" });
          const url = `http://127.0.0.1:${port}`;
          const server = $(
            command === "dev"
              ? `pnpm dev --port ${port} --host 127.0.0.1`
              : "pnpm start",
            { env: { PORT: String(port), HOST: "127.0.0.1" } },
          );
          await Stream.match(server.stdout, url);
          await page.goto(url);
          await expect(page.locator("p[data-custom-jsx]")).toHaveText(
            "Custom JSX",
          );
          if (command === "dev") {
            const source = readFileSync(
              path.join(cwd, "app/routes/_index.tsx"),
              "utf8",
            );
            const prefix = source.slice(0, source.indexOf("<p>Custom JSX"));
            await expect(page.locator("p")).toHaveAttribute(
              "data-source-line",
              String(prefix.split("\n").length),
            );
            await expect(page.locator("p")).toHaveAttribute(
              "data-source-column",
              String(prefix.split("\n").at(-1)!.length + 1),
            );
          }
        }
        expect(page.errors).toEqual([]);
      });

      test("client route APIs update while preserving React state", async ({
        page,
        edit,
        $,
      }) => {
        await edit({
          "app/routes/_index.tsx": tsx`
          import { useState } from "react";
          import { useMatches } from "react-router";
          export const loader = () => ({ message: "server" });
          export const clientLoader = () => ({ message: "client 0" });
          clientLoader.hydrate = true;
          export const handle = { message: "handle 0" };
          export const meta = () => [{ title: "title 0" }];
          export const links = () => [{ rel: "stylesheet", href: "/styles.css", "data-probe-link": "link 0" }];
          export default function Route({ loaderData }: { loaderData: { message: string } }) {
            const [count, setCount] = useState(0);
            const matches = useMatches();
            return <>
              <button onClick={() => setCount(count + 1)}>Count: {count}</button>
              <p data-loader>{loaderData?.message}</p>
              <p data-handle>{matches[1].handle.message}</p>
            </>;
          }
        `,
          "public/styles.css": "body { color: black; }",
        });
        const port = await getPort();
        const url = `http://localhost:${port}`;
        const dev = $(`pnpm dev --port ${port}`);
        await Stream.match(dev.stdout, url);
        await page.goto(url, { waitUntil: "networkidle" });
        const button = page.locator("button");
        await expect(button).toHaveText("Count: 0");
        await button.click();
        await expect(button).toHaveText("Count: 1");
        await edit({
          "app/routes/_index.tsx": (contents) =>
            contents
              .replace("client 0", "client 1")
              .replace("handle 0", "handle 1")
              .replace("title 0", "title 1")
              .replace("link 0", "link 1"),
        });
        await expect(page.locator("[data-loader]")).toHaveText("client 1");
        await expect(page.locator("[data-handle]")).toHaveText("handle 1");
        await expect(page).toHaveTitle("title 1");
        await expect(page.locator("[data-probe-link]")).toHaveAttribute(
          "data-probe-link",
          "link 1",
        );
        await expect(button).toHaveText("Count: 1");
        expect(page.errors).toEqual([]);
      });

      test("route APIs can be added, replaced and removed without losing state", async ({
        page,
        edit,
        $,
      }) => {
        const initialSource = tsx`
          import { useState } from "react";
          import { Form, useMatches } from "react-router";
          export const loader = () => ({ message: "server 0" });
          export const action = () => ({ message: "action 0" });
          export default function Route({ loaderData, actionData }) {
            const [count, setCount] = useState(0);
            const matches = useMatches();
            return <>
              <button id="count" onClick={() => setCount(count + 1)}>Count {count}</button>
              <input defaultValue="initial" />
              <p id="data">{loaderData?.message}</p>
              <p id="action">{actionData?.message}</p>
              <p id="handle">{matches.at(-1)?.handle?.message}</p>
              <Form method="post"><button id="submit">Submit</button></Form>
            </>;
          }
        `;
        await edit({
          "react-router.config.ts": `export default {splitRouteModules:true,future:{unstable_externalReactPlugin:${external}}};`,
          "app/routes/_index.tsx": initialSource,
        });
        const port = await getPort();
        const url = `http://localhost:${port}`;
        const dev = $(`pnpm dev --port ${port}`);
        await Stream.match(dev.stdout, url);
        await page.goto(url, { waitUntil: "networkidle" });
        await page.locator("#count").click();
        await page.locator("input").fill("unsaved input");
        const assertState = async () => {
          await expect(page.locator("#count")).toHaveText("Count 1");
          await expect(page.locator("input")).toHaveValue("unsaved input");
        };
        await edit({
          "app/routes/_index.tsx":
            initialSource +
            tsx`
            export const clientLoader = async ({ serverLoader }) => ({ message: (await serverLoader()).message + " client 0" });
            export const clientAction = async ({ serverAction }) => ({ message: (await serverAction()).message + " client action" });
            export const clientMiddleware = [async (_, next) => { document.documentElement.dataset.middleware = "middleware 0"; await next(); }];
            export const handle = { message: "handle 0" };
            export const meta = () => [{ title: "title 0" }];
          `,
        });
        await expect(page.locator("#data")).toHaveText("server 0 client 0");
        await expect(page.locator("html")).toHaveAttribute(
          "data-middleware",
          "middleware 0",
        );
        await expect(page.locator("#handle")).toHaveText("handle 0");
        await expect(page).toHaveTitle("title 0");
        await page.locator("#submit").click();
        await expect(page.locator("#action")).toHaveText(
          "action 0 client action",
        );
        await assertState();
        await edit({
          "app/routes/_index.tsx": (contents) =>
            contents
              .replace("server 0", "server 1")
              .replace("client 0", "client 1")
              .replace("middleware 0", "middleware 1")
              .replace("handle 0", "handle 1")
              .replace("title 0", "title 1"),
        });
        await expect(page.locator("#data")).toHaveText("server 1 client 1");
        await expect(page.locator("html")).toHaveAttribute(
          "data-middleware",
          "middleware 1",
        );
        await expect(page.locator("#handle")).toHaveText("handle 1");
        await expect(page).toHaveTitle("title 1");
        await assertState();
        await edit({ "app/routes/_index.tsx": initialSource });
        await expect(page.locator("#data")).toHaveText("server 0");
        await expect(page.locator("#handle")).toBeEmpty();
        await expect(page).toHaveTitle("");
        await page.locator("#submit").click();
        await expect(page.locator("#action")).toHaveText("action 0");
        await assertState();
        expect(page.errors).toEqual([]);
      });

      test("server-only component dependencies are removed before refresh", async ({
        page,
        edit,
        $,
      }) => {
        await edit({
          "app/routes/_index.tsx": tsx`
        import { readFileSync } from "node:fs";
        function ServerWidget() { return <div>{readFileSync("package.json", "utf8")}</div>; }
        export const loader = () => ({ source: ServerWidget.toString() });
        export default function Route() { return <p>Client route</p>; }
      `,
        });
        const port = await getPort();
        const url = `http://localhost:${port}`;
        const dev = $(`pnpm dev --port ${port}`);
        await Stream.match(dev.stdout, url);
        await page.goto(url, { waitUntil: "networkidle" });
        await expect(page.locator("p")).toHaveText("Client route");
        const output = await (
          await page.request.get(url + "/app/routes/_index.tsx")
        ).text();
        const code = output.split("//# sourceMappingURL=")[0];
        expect(code).not.toContain("ServerWidget");
        expect(code).not.toContain("node:fs");
        expect(page.errors).toEqual([]);
      });

      test("removes server-only TypeScript dependencies before React processing", async ({
        edit,
        cwd,
      }) => {
        await edit({
          "app/secret.server.ts": `import { readFileSync } from "node:fs";
            export const readSecret = () => "SERVER_TYPESCRIPT_DCE_MARKER" + readFileSync("package.json", "utf8").length;`,
          "app/routes/_index.tsx": tsx`
            import { readSecret } from "../secret.server";
            type Secret = ReturnType<typeof readSecret>;
            enum ServerValues { Secret = readSecret() }
            export const loader = (): { value: Secret } => ({ value: ServerValues.Secret });
            export default function Route({ loaderData }: { loaderData: { value: Secret } }) {
              return <p>{loaderData.value}</p>;
            }
          `,
        });
        const result = build({ cwd });
        expect(result.status, result.stderr.toString()).toBe(0);
        for (const file of globSync(path.join(cwd, "build/client/**/*.js"))) {
          const code = readFileSync(file, "utf8");
          expect(code).not.toContain("SERVER_TYPESCRIPT_DCE_MARKER");
          expect(code).not.toContain("node:fs");
        }
      });

      test("preserves Vite TypeScript compiler options", async ({
        page,
        edit,
        cwd,
        $,
      }) => {
        const isVite8 = template.name.includes("8");
        await edit({
          "tsconfig.json": JSON.stringify({
            compilerOptions: {
              experimentalDecorators: false,
              jsx: "react-jsx",
            },
          }),
          "vite.config.ts": (contents) =>
            contents.replace(
              "defineConfig({",
              isVite8
                ? "defineConfig({oxc:{decorator:{legacy:true,emitDecoratorMetadata:true}},"
                : `defineConfig({esbuild:{tsconfigRaw:${JSON.stringify('{ /* override */ "compilerOptions": { "experimentalDecorators": true, }, }')}},`,
            ),
          "app/routes/_index.tsx": tsx`
            let decorated = false;
            let typeName = "";
            Reflect.metadata = (key: string, value: any) => () => {
              if (key === "design:type") typeName = value.name;
            };
            function mark(target: any, key: string) {
              decorated = typeof key === "string";
            }
            class Example {
              @mark field: string = "value";
            }
            export default function Route() {
              return <p>{String(decorated)}:{typeName}:{new Example().field}</p>;
            }
          `,
        });
        for (const command of ["dev", "start"]) {
          if (command === "start") {
            const result = build({ cwd });
            expect(result.status, result.stderr.toString()).toBe(0);
          }
          const port = await getPort({ host: "127.0.0.1" });
          const url = `http://127.0.0.1:${port}`;
          const server = $(
            command === "dev"
              ? `pnpm dev --port ${port} --host 127.0.0.1`
              : "pnpm start",
            { env: { PORT: String(port), HOST: "127.0.0.1" } },
          );
          await Stream.match(server.stdout, url);
          await page.goto(url);
          await expect(page.locator("p")).toHaveText(
            `true:${isVite8 ? "String" : ""}:value`,
          );
        }
        expect(page.errors).toEqual([]);
      });

      test("component-free parent route applies data updates", async ({
        page,
        edit,
        $,
      }) => {
        await edit({
          "app/routes/plain.ts": `export const loader = () => ({ value: "server 0" }); export const clientLoader = () => ({ value: "client 0" }); clientLoader.hydrate = true;`,
          "app/routes/plain._index.tsx": tsx`
          import { useState } from "react";
          import { useRouteLoaderData } from "react-router";
          export default function Child() {
            const data = useRouteLoaderData("routes/plain");
            const [count, setCount] = useState(0);
            return <><h1>{data?.value}</h1><button onClick={() => setCount(count + 1)}>Count: {count}</button></>;
          }
        `,
        });
        const port = await getPort();
        const url = `http://localhost:${port}`;
        const dev = $(`pnpm dev --port ${port}`);
        await Stream.match(dev.stdout, url);
        await page.goto(url + "/plain", { waitUntil: "networkidle" });
        await expect(page.locator("h1")).toHaveText("client 0");
        await page.locator("button").click();
        await expect(page.locator("button")).toHaveText("Count: 1");
        await edit({
          "app/routes/plain.ts": (contents) =>
            contents.replace("client 0", "client 1"),
        });
        await expect(page.locator("h1")).toHaveText("client 1");
        // The legacy runtime propagates this edit to the child and resets it.
        // The external integration applies the parent API update independently.
        await expect(page.locator("button")).toHaveText(
          external ? "Count: 1" : "Count: 0",
        );
        expect(page.errors).toEqual([]);
      });

      test("routes added after startup receive props and refresh", async ({
        page,
        edit,
        $,
      }) => {
        const port = await getPort();
        const url = `http://localhost:${port}`;
        const dev = $(`pnpm dev --port ${port}`);
        await Stream.match(dev.stdout, url);
        await page.goto(url, { waitUntil: "networkidle" });
        await edit({
          "app/routes/new-route.tsx": tsx`
        import { useState } from "react";
        export const loader = () => ({ message: "new loader 0" });
        export default function NewRoute({ loaderData }) {
          const [count, setCount] = useState(0);
          return <><h1>{loaderData?.message ?? "Missing props"}</h1><button onClick={() => setCount(count + 1)}>Count: {count}</button></>;
        }
      `,
        });
        await expect
          .poll(() => dev.buffer.stdout)
          .toMatch(/(?:Route config|Config) changed\./);
        await page.goto(url + "/new-route", { waitUntil: "networkidle" });
        await expect(page.locator("h1")).toHaveText("new loader 0");
        await page.locator("button").click();
        await edit({
          "app/routes/new-route.tsx": (contents) =>
            contents.replace("new loader 0", "new loader 1"),
        });
        await expect(page.locator("h1")).toHaveText("new loader 1");
        await expect(page.locator("button")).toHaveText("Count: 1");
        expect(page.errors).toEqual([]);
      });
      test("preserves source maps and JSX development locations", async ({
        page,
        edit,
        $,
      }) => {
        const source = tsx`
          import { useState } from "react";
          export const loader = () => ({ server: true });
          const _jsxDEV = "consumer binding";
          export const clientLoader = () => ({ client: true });
          export function HydrateFallback() { return <p>Loading mapped route</p>; }
          export default function Route() {
            const [count] = useState(0);
            function fail() { throw new Error("REACT_PLUGIN_SOURCE_MAP_MARKER"); }
            return <button onClick={fail} title={_jsxDEV}>Mapped {count}</button>;
          }
        `;
        await edit({
          "app/routes/_index.tsx": source,
          "react-router.config.ts": `export default {splitRouteModules:true,future:{unstable_externalReactPlugin:${external}}};`,
        });
        const port = await getPort();
        const url = `http://localhost:${port}`;
        const dev = $(`pnpm dev --port ${port}`);
        await Stream.match(dev.stdout, url);
        await page.goto(url, { waitUntil: "networkidle" });
        const output = await (
          await page.request.get(url + "/app/routes/_index.tsx")
        ).text();
        const encoded = output.match(
          /sourceMappingURL=data:application\/json[^,]*;base64,([^\s]+)/,
        )?.[1];
        expect(encoded).toBeTruthy();
        const payload = JSON.parse(Buffer.from(encoded!, "base64").toString());
        const offset = output.indexOf("REACT_PLUGIN_SOURCE_MAP_MARKER");
        const generated = output.slice(0, offset).split("\n");
        const entry = new SourceMap(payload).findEntry(
          generated.length - 1,
          generated.at(-1)!.length,
        );
        if (!("originalLine" in entry))
          throw new Error("Missing development source map entry");
        const original = source
          .slice(0, source.indexOf("REACT_PLUGIN_SOURCE_MAP_MARKER"))
          .split("\n");
        expect(entry.originalLine).toBe(original.length - 1);
        expect(entry.originalColumn).toBeGreaterThanOrEqual(
          original.at(-1)!.length - 2,
        );
        expect(entry.originalColumn).toBeLessThanOrEqual(
          original.at(-1)!.length,
        );
        const jsxOffset = source.indexOf("<button");
        const jsxLocation = source.slice(0, jsxOffset).split("\n");
        expect(output).toMatch(
          new RegExp(`lineNumber: ${jsxLocation.length}\\b`),
        );
        expect(output).toMatch(
          new RegExp(`columnNumber: ${jsxLocation.at(-1)!.length + 1}\\b`),
        );
        const fallback = output;
        const fallbackLocation = source
          .slice(0, source.indexOf("<p>"))
          .split("\n");
        expect(fallback).toMatch(
          new RegExp(`lineNumber: ${fallbackLocation.length}\\b`),
        );
        expect(fallback).toMatch(
          new RegExp(`columnNumber: ${fallbackLocation.at(-1)!.length + 1}\\b`),
        );
      });

      test("supports route component and boundary export forms", async ({
        page,
        edit,
        $,
      }) => {
        await edit(componentExportFiles);
        const port = await getPort();
        const url = `http://localhost:${port}`;
        const dev = $(`pnpm dev --port ${port}`);
        await Stream.match(dev.stdout, url);
        for (const name of [
          "named",
          "variable",
          "anonymous",
          "anonymous-function",
          "function-boundary",
          "mixed-boundary",
        ]) {
          await page.goto(url + "/" + name, { waitUntil: "networkidle" });
          await expect(page.locator("h1")).toHaveText(name);
        }
        expect(page.errors).toEqual([]);
      });
    });
  }
}

for (const template of viteMajorTemplates) {
  test.describe(`${template.displayName} - consumer React plugin options`, () => {
    test.use({
      template: template.name,
      files: {
        "vite.config.ts": configFor(),
        "react-router.config.ts": `export default {future:{unstable_externalReactPlugin:true}};`,
      },
    });
    test("React Compiler preserves HMR, HDR and source maps", async ({
      page,
      edit,
      cwd,
      $,
    }) => {
      const source = tsx`
        import { useState } from "react";
        import { secret } from "../secret.server";
        export const loader = () => ({ message: "server 0", secret });
        export const clientLoader = async ({ serverLoader }) => serverLoader();
        clientLoader.hydrate = true;
        export function HydrateFallback() { return <p>Loading...</p>; }
        export default function Route({ loaderData }) {
          "use memo";
          const [count, setCount] = useState(0);
          function fail() { throw new Error("COMPILER_SOURCE_MAP_MARKER"); }
          return <>
            <h1>Compiler 0</h1>
            <p data-loader>{loaderData.message}</p>
            <button id="count" onClick={() => setCount(count + 1)}>Count {count}</button>
            <input defaultValue="initial" />
            <button onClick={fail}>Fail</button>
          </>;
        }
      `;
      await edit({
        ...componentExportFiles,
        "vite.config.ts": configFor(
          template.name.includes("8")
            ? "{compiler: true}"
            : "{babel:{plugins:['babel-plugin-react-compiler']}}",
        ).replace("defineConfig({", "defineConfig({build:{sourcemap:true},"),
        "app/routes/_index.tsx": source,
        "app/secret.server.ts":
          'export const secret = "COMPILER_SERVER_ONLY_MARKER";',
      });
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const dev = $(`pnpm dev --port ${port}`);
      await Stream.match(dev.stdout, url);
      for (const file of Object.keys(componentExportFiles)) {
        const name = path.basename(file, ".tsx");
        await page.goto(url + "/" + name, { waitUntil: "networkidle" });
        await expect(page.locator("h1")).toHaveText(name);
        const output = await (await page.request.get(url + "/" + file)).text();
        expect(output.split("//# sourceMappingURL=")[0]).toMatch(
          /react[_/]compiler-runtime/,
        );
      }
      await page.goto(url, { waitUntil: "networkidle" });
      await page.locator("#count").click();
      await page.locator("input").fill("unsaved input");
      const output = await (
        await page.request.get(url + "/app/routes/_index.tsx")
      ).text();
      expect(output).toMatch(/react[_/]compiler-runtime/);
      expect(output).toMatch(/_c\(\d+\)/);
      const encoded = output.match(
        /sourceMappingURL=data:application\/json[^,]*;base64,([^\s]+)/,
      )?.[1];
      expect(encoded).toBeTruthy();
      const map = JSON.parse(Buffer.from(encoded!, "base64").toString());
      const generated = output
        .slice(0, output.indexOf("COMPILER_SOURCE_MAP_MARKER"))
        .split("\n");
      const entry = new SourceMap(map).findEntry(
        generated.length - 1,
        generated.at(-1)!.length,
      );
      expect(entry).toMatchObject({
        originalLine:
          source
            .slice(0, source.indexOf("COMPILER_SOURCE_MAP_MARKER"))
            .split("\n").length - 1,
      });
      await edit({
        "app/routes/_index.tsx": source
          .replace("Compiler 0", "Compiler 1")
          .replace("server 0", "server 1"),
      });
      await expect(page.locator("h1")).toHaveText("Compiler 1");
      await expect(page.locator("[data-loader]")).toHaveText("server 1");
      await expect(page.locator("#count")).toHaveText("Count 1");
      await expect(page.locator("input")).toHaveValue("unsaved input");
      expect(page.errors).toEqual([]);

      const result = build({ cwd });
      expect(result.status).toBe(0);
      expect(result.stderr.toString()).not.toContain("SOURCEMAP_BROKEN");
      const clientFiles = globSync(path.join(cwd, "build/client/**/*.js"));
      for (const file of clientFiles) {
        const code = readFileSync(file, "utf8");
        expect(code).not.toContain("COMPILER_SERVER_ONLY_MARKER");
        expect(code).not.toContain("validateRefreshBoundaryAndEnqueueUpdate");
      }
      const clientMaps = globSync(path.join(cwd, "build/client/**/*.js.map"));
      expect(clientMaps.length).toBeGreaterThan(0);
      expect(
        clientMaps.some((file) => {
          const map = JSON.parse(readFileSync(file, "utf8"));
          return map.sources.some((source: string) =>
            source.includes("compiler-runtime"),
          );
        }),
      ).toBe(true);
    });
    test("consumer owns classic JSX settings", async ({ page, edit, $ }) => {
      await edit({
        "vite.config.ts": configFor("{ jsxRuntime: 'classic' }"),
        "react-router.config.ts": `export default {splitRouteModules:true,future:{unstable_externalReactPlugin:true}};`,
        "tsconfig.json": JSON.stringify({
          compilerOptions: { jsx: "react", verbatimModuleSyntax: false },
        }),
        "app/root.tsx": (contents) =>
          'import * as React from "react";\n' + contents,
        "app/routes/_index.tsx": tsx`
            import * as React from "react";
            import { useState } from "react";
            export async function clientLoader() {
              await new Promise(resolve => setTimeout(resolve, 100));
              return {};
            }
            clientLoader.hydrate = true;
            export function HydrateFallback() { return <p>Loading classic...</p>; }
            export default function Route() {
              const [count, setCount] = useState(0);
              return <button onClick={() => setCount(count + 1)}>Classic 0 count: {count}</button>;
            }
          `,
      });
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const dev = $(`pnpm dev --port ${port}`);
      await Stream.match(dev.stdout, url);
      await page.goto(url, { waitUntil: "networkidle" });
      await expect(page.locator("button")).toHaveText("Classic 0 count: 0");
      await page.locator("button").click();
      await edit({
        "app/routes/_index.tsx": (contents) =>
          contents.replace("Classic 0", "Classic 1"),
      });
      await expect(page.locator("button")).toHaveText("Classic 1 count: 1");
      const output = await (
        await page.request.get(url + "/app/routes/_index.tsx")
      ).text();
      expect(output.split("//# sourceMappingURL=")[0]).toContain(
        "React.createElement",
      );
      expect(page.errors).toEqual([]);
    });

    test("respects excluded routes without swallowing component edits", async ({
      page,
      edit,
      $,
    }) => {
      await edit({
        "vite.config.ts": configFor("{exclude: /routes/}"),
        "app/routes/_index.tsx": `import {useState} from 'react'; export default function Route() {const [count,setCount]=useState(0); const marker = 'validateRefreshBoundaryAndEnqueueUpdate('; return <button title={marker} onClick={()=>setCount(count+1)}>Excluded 0 count: {count}</button>;}`,
      });
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const dev = $(`pnpm dev --port ${port}`);
      await Stream.match(dev.stdout, url);
      await page.goto(url, { waitUntil: "networkidle" });
      await page.locator("button").click();
      await edit({
        "app/routes/_index.tsx": (contents) =>
          contents.replace("Excluded 0", "Excluded 1"),
      });
      await expect(page.locator("button")).toHaveText("Excluded 1 count: 0");
      expect(page.errors).toEqual([]);
    });
  });
}

for (const template of viteMajorTemplates) {
  test.describe(`${template.displayName} - React plugin configuration`, () => {
    test.use({ template: template.name });

    test("future flag requires an active consumer plugin", async ({
      edit,
      cwd,
    }) => {
      await edit({
        "react-router.config.ts": `export default {future:{unstable_externalReactPlugin:true}};`,
      });
      const result = build({ cwd });
      expect(result.status).not.toBe(0);
      expect(result.stderr.toString()).toContain(
        'The "future.unstable_externalReactPlugin" flag requires "@vitejs/plugin-react"',
      );

      await edit({
        "vite.config.ts": `import {reactRouter} from '@react-router/dev/vite';
          import react from '@vitejs/plugin-react';
          export default {plugins:[reactRouter(),react().map(plugin=>({...plugin,apply:'serve'}))]};`,
      });
      const inactive = build({ cwd });
      expect(inactive.status).not.toBe(0);
      expect(inactive.stderr.toString()).toContain(
        'The "future.unstable_externalReactPlugin" flag requires "@vitejs/plugin-react"',
      );
    });

    test("external React is opt-in and changing the flag restarts the pipeline", async ({
      page,
      edit,
      $,
    }) => {
      await edit({
        "vite.config.ts": configFor(),
        "react-router.config.ts": `export default {future:{unstable_externalReactPlugin:false}};`,
      });
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const dev = $(`pnpm dev --port ${port}`);
      await Stream.match(dev.stdout, url);
      const getRootCode = async () =>
        (await (await page.request.get(url + "/app/root.tsx")).text()).split(
          "//# sourceMappingURL=",
        )[0];
      // Existing configurations keep the legacy integration even if they
      // also supply a React plugin. Only the flag selects the new pipeline.
      expect(await getRootCode()).toContain("virtual:react-router/hmr-runtime");
      for (const enabled of [true, false, true]) {
        await edit({
          "react-router.config.ts": `export default {future:{unstable_externalReactPlugin:${enabled}}};`,
        });
        await expect
          .poll(async () => {
            try {
              return (await getRootCode()).includes(
                "virtual:react-router/route-hmr",
              );
            } catch {
              return !enabled;
            }
          })
          .toBe(enabled);
      }
      await page.goto(url, { waitUntil: "networkidle" });
      expect(page.errors).toEqual([]);
      expect(await getRootCode()).not.toContain(
        "virtual:react-router/hmr-runtime",
      );
    });

    test("nested promised consumer plugin works with a non-root base", async ({
      page,
      edit,
      $,
    }) => {
      await edit({
        "react-router.config.ts": `export default {future:{unstable_externalReactPlugin:true}};`,
        "vite.config.ts": `import {reactRouter} from '@react-router/dev/vite';
          import react from '@vitejs/plugin-react';
          export default {base:"/app/",plugins:[reactRouter(),false,Promise.resolve([react()])]};`,
      });
      const port = await getPort();
      const url = `http://localhost:${port}/app`;
      const dev = $(`pnpm dev --port ${port}`);
      await Stream.match(dev.stdout, url);
      await page.goto(url, { waitUntil: "networkidle" });
      const code = (
        await (await page.request.get(url + "/app/root.tsx")).text()
      ).split("//# sourceMappingURL=")[0];
      expect(
        code.match(/validateRefreshBoundaryAndEnqueueUpdate\(/g),
      ).toHaveLength(1);
      expect(page.errors).toEqual([]);
    });

    test("disabled HMR preserves JSX locations and omits refresh runtimes", async ({
      page,
      edit,
      $,
    }) => {
      await edit({
        "react-router.config.ts": `export default {future:{unstable_externalReactPlugin:true}};`,
        "vite.config.ts": `import {reactRouter} from '@react-router/dev/vite';
          import react from '@vitejs/plugin-react';
          export default {server:{hmr:false},plugins:[reactRouter(),react(),{
            name:'test-ssr-transform',
            configureServer(server) {
              server.middlewares.use('/qa-ssr-transform', async (req,res,next) => {
                try {
                  const result = await server.environments.ssr.transformRequest('/app/routes/mapped.tsx');
                  res.end(result.code);
                } catch (error) {next(error);}
              });
            }
          }]};`,
        "app/routes/mapped.tsx": `export function HydrateFallback(){return <p>map</p>;}
export default function Route(){return <h1>map</h1>;}`,
      });
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const dev = $(`pnpm dev --port ${port}`);
      await Stream.match(dev.stdout, url);
      await page.goto(url, { waitUntil: "networkidle" });
      const output = (
        await (await page.request.get(url + "/app/root.tsx")).text()
      ).split("//# sourceMappingURL=")[0];
      for (const routeUrl of ["/app/routes/mapped.tsx", "/qa-ssr-transform"]) {
        const response = await page.request.get(url + routeUrl);
        expect(response.ok()).toBe(true);
        const code = await response.text();
        expect(code).toMatch(/lineNumber: 1\b/);
        expect(code).toMatch(/columnNumber: 42\b/);
        expect(code).toMatch(/lineNumber: 2\b/);
        expect(code).toMatch(/columnNumber: 40\b/);
      }
      expect(output).not.toContain("/@react-refresh");
      expect(output).not.toContain("virtual:react-router/route-hmr");
      expect(page.errors).toEqual([]);
    });
  });
}
